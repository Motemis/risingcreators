import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  console.log("=== Generate Insights API Called ===");
  
  // Check API key
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }
  console.log("API Key exists, prefix:", process.env.ANTHROPIC_API_KEY.substring(0, 15));

  const user = await currentUser();
  console.log("User:", user?.id);

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
    console.log("Request body:", body);
  } catch (e) {
    console.error("Failed to parse request body:", e);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { profileId } = body;

  if (!profileId) {
    console.error("No profileId provided");
    return NextResponse.json({ error: "Profile ID required" }, { status: 400 });
  }

  // Get creator profile
  console.log("Fetching profile:", profileId);
  const { data: profile, error: profileError } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (profileError) {
    console.error("Profile fetch error:", profileError);
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  if (!profile) {
    console.error("Profile is null");
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  console.log("Profile found:", profile.display_name);

  // Rate limit: max 2 insights per day
  const MAX_INSIGHTS_PER_DAY = 2;
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count: insightsToday } = await supabase
    .from("creator_insights")
    .select("*", { count: "exact", head: true })
    .eq("creator_profile_id", profileId)
    .gte("created_at", todayStart.toISOString());

  console.log("Insights today:", insightsToday);

  if ((insightsToday || 0) >= MAX_INSIGHTS_PER_DAY) {
    console.log("Rate limit exceeded");
    return NextResponse.json(
      { error: "Daily insight limit reached. Come back tomorrow!" },
      { status: 429 }
    );
  }

  // Get benchmarks for comparison
  const totalFollowers =
    (profile.youtube_subscribers || 0) +
    (profile.tiktok_followers || 0) +
    (profile.instagram_followers || 0);

  const followerTier = getFollowerTier(totalFollowers);
  const primaryNiche = profile.niche?.[0] || "Lifestyle";

  console.log("Fetching benchmarks for:", primaryNiche, followerTier);
  const { data: benchmarks } = await supabase
    .from("niche_benchmarks")
    .select("*")
    .eq("niche", primaryNiche)
    .eq("follower_tier", followerTier)
    .single();

  // Get top posts
  const { data: topPosts } = await supabase
    .from("creator_posts")
    .select("*")
    .eq("creator_profile_id", profileId)
    .order("views", { ascending: false })
    .limit(5);

  console.log("Top posts count:", topPosts?.length || 0);

  // Build the prompt
  const prompt = buildAnalysisPrompt(profile, benchmarks, topPosts || [], followerTier);
  console.log("Prompt length:", prompt.length);

  try {
    console.log("Calling Anthropic API...");
    
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    console.log("Anthropic response received");

    // Extract text from response
    const responseText = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("");

    console.log("Response text length:", responseText.length);

    // Parse the JSON response
    let insights;
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
        console.log("Insights parsed successfully");
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      console.error("Response was:", responseText.substring(0, 500));
      insights = {
        summary: responseText.substring(0, 500),
        strengths: ["Unable to parse detailed insights"],
        improvements: ["Please try generating insights again"],
        actionItems: [],
        contentIdeas: [],
      };
    }

    // Save insights to database
    const { error: insertError } = await supabase.from("creator_insights").insert({
      creator_profile_id: profileId,
      insight_type: "ai_analysis",
      title: "AI Performance Analysis",
      content: JSON.stringify(insights),
      priority: 1,
    });

    if (insertError) {
      console.error("Failed to save insights:", insertError);
    }

    console.log("=== Insights generated successfully ===");
    return NextResponse.json({ insights });

  } catch (err) {
    console.error("AI generation error:", err);
    
    if (err instanceof Error) {
      console.error("Error name:", err.name);
      console.error("Error message:", err.message);
    }
    
    return NextResponse.json(
      { error: "Failed to generate insights: " + (err instanceof Error ? err.message : String(err)) },
      { status: 500 }
    );
  }
}

function getFollowerTier(totalFollowers: number): string {
  if (totalFollowers < 10000) return "nano";
  if (totalFollowers < 50000) return "micro";
  if (totalFollowers < 100000) return "mid";
  if (totalFollowers < 500000) return "macro";
  return "mega";
}

function buildAnalysisPrompt(
  profile: any,
  benchmarks: any,
  topPosts: any[],
  followerTier: string
): string {
  const totalFollowers =
    (profile.youtube_subscribers || 0) +
    (profile.tiktok_followers || 0) +
    (profile.instagram_followers || 0);

  const avgEngagement =
    profile.total_engagement_rate ||
    ((profile.youtube_engagement_rate || 0) +
      (profile.tiktok_engagement_rate || 0) +
      (profile.instagram_engagement_rate || 0)) / 3;

  return `You are a social media growth expert analyzing a creator's channel performance. Provide actionable, specific insights.

## Creator Profile
- Name: ${profile.display_name || "Creator"}
- Niche: ${profile.niche?.join(", ") || "General"}
- Tier: ${followerTier} (${totalFollowers.toLocaleString()} total followers)
- Bio: ${profile.bio || "Not provided"}

## Platform Breakdown
- YouTube: ${profile.youtube_subscribers?.toLocaleString() || 0} subscribers, ${profile.youtube_engagement_rate?.toFixed(1) || 0}% engagement
- TikTok: ${profile.tiktok_followers?.toLocaleString() || 0} followers, ${profile.tiktok_engagement_rate?.toFixed(1) || 0}% engagement  
- Instagram: ${profile.instagram_followers?.toLocaleString() || 0} followers, ${profile.instagram_engagement_rate?.toFixed(1) || 0}% engagement

## Performance Metrics
- Overall Engagement Rate: ${avgEngagement?.toFixed(1) || 0}%
- 7-Day Growth: ${profile.follower_growth_7d?.toFixed(1) || 0}%
- 30-Day Growth: ${profile.follower_growth_30d?.toFixed(1) || 0}%
- Posts Per Week: ${profile.posts_per_week?.toFixed(1) || 0}
- Consistency Score: ${profile.consistency_score || 0}/100
- Viral Posts: ${profile.viral_post_count || 0}
- Avg Views Per Post: ${profile.avg_post_performance?.toLocaleString() || 0}
- Estimated Post Value: $${profile.estimated_post_value || 0}

## Niche Benchmarks (${profile.niche?.[0] || "General"} - ${followerTier} tier)
- Avg Engagement Rate: ${benchmarks?.avg_engagement_rate?.toFixed(1) || "N/A"}%
- Avg Growth Rate: ${benchmarks?.avg_growth_rate?.toFixed(1) || "N/A"}%
- Avg Views Per Post: ${benchmarks?.avg_views_per_post?.toLocaleString() || "N/A"}

## Top Performing Content
${topPosts?.map((p, i) => `${i + 1}. "${p.caption?.substring(0, 50) || "Untitled"}..." - ${p.views?.toLocaleString() || 0} views, ${p.likes?.toLocaleString() || 0} likes`).join("\n") || "No content data available"}

## Best Posting Times
- Best Hour: ${profile.best_posting_hour !== null ? `${profile.best_posting_hour}:00` : "Unknown"}
- Best Day: ${profile.best_posting_day || "Unknown"}

---

Analyze this creator's performance and provide insights in the following JSON format. Be specific and actionable. Reference their actual numbers.

{
  "summary": "A 2-3 sentence overview of their channel performance, mentioning specific metrics",
  "strengths": [
    "Specific strength with data point",
    "Another strength with context"
  ],
  "improvements": [
    "Specific area to improve with why it matters",
    "Another improvement opportunity"
  ],
  "actionItems": [
    {
      "title": "Specific action to take this week",
      "description": "Detailed explanation of how to do it",
      "metric": "Expected improvement (e.g., '+10% engagement')"
    },
    {
      "title": "Another action item",
      "description": "How to implement it",
      "metric": "Expected outcome"
    },
    {
      "title": "Third action item",
      "description": "Implementation details",
      "metric": "Expected result"
    }
  ],
  "contentIdeas": [
    {
      "title": "Content idea based on their niche",
      "description": "Why this would work for their audience",
      "format": "Video type (e.g., 'YouTube Short', 'Tutorial', 'Vlog')"
    },
    {
      "title": "Another content idea",
      "description": "Explanation",
      "format": "Format type"
    },
    {
      "title": "Third content idea",
      "description": "Why it fits their brand",
      "format": "Format"
    }
  ],
  "bestTimes": "Recommendation for optimal posting schedule based on their data"
}

Respond ONLY with the JSON object, no other text.`;
}
