import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function fetchWebContent(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RisingCreators/1.0)",
      },
    });
    
    if (!response.ok) return "";
    
    const html = await response.text();
    
    // Basic HTML to text extraction
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 10000); // Limit content
    
    return text;
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return "";
  }
}

async function analyzeBrandContent(
  companyName: string,
  website: string,
  socialUrls: Record<string, string>,
  bio: string
): Promise<{
  keywords: string[];
  topics: string[];
  brandVoice: string;
  targetKeywords: string[];
  suggestedNiches: string[];
}> {
  // Gather content from all sources
  let allContent = `Company: ${companyName}\n\nBio: ${bio}\n\n`;

  // Fetch website content
  if (website) {
    const websiteContent = await fetchWebContent(website);
    if (websiteContent) {
      allContent += `Website Content:\n${websiteContent}\n\n`;
    }
  }

  // Fetch social media bios/content (limited)
  for (const [platform, url] of Object.entries(socialUrls)) {
    if (url) {
      const socialContent = await fetchWebContent(url);
      if (socialContent) {
        allContent += `${platform} Content:\n${socialContent.substring(0, 2000)}\n\n`;
      }
    }
  }

  // Use Claude to analyze the content
  try {
    // Try newer models first, fallback to older if needed
    const modelsToTry = [
      "claude-sonnet-4-20250514",
      "claude-3-5-sonnet-20241022", 
      "claude-3-opus-20240229",
      "claude-3-5-sonnet-20240620"
    ];
    
    let lastError: any = null;
    let message: any = null;
    
    for (const modelName of modelsToTry) {
      try {
        message = await anthropic.messages.create({
          model: modelName,
          max_tokens: 1024,
          messages: [
            {
              role: "user",
              content: `Analyze this brand's content and extract key information for matching with social media creators.

Brand Content:
${allContent.substring(0, 8000)}

Please respond with a JSON object (no markdown, just raw JSON) containing:
{
  "keywords": ["array of 10-20 specific keywords that describe this brand, products, and target audience"],
  "topics": ["array of 5-10 broader topic categories like 'golf', 'fashion', 'fitness', 'technology'"],
  "brandVoice": "brief description of the brand's tone and style (e.g., 'professional and aspirational' or 'casual and fun')",
  "targetKeywords": ["array of 10-15 keywords that creators should have in their content to be a good match"],
  "suggestedNiches": ["array of 3-5 creator niches from this list that would be good fits: Lifestyle, Tech, Fitness, Beauty, Fashion, Food, Travel, Gaming, Finance, Education, Entertainment, Music, Sports, Parenting, Pets"]
}

Focus on extracting actionable matching criteria. Be specific with keywords.`,
            },
          ],
        });
        console.log(`Successfully used model: ${modelName}`);
        break; // Success, exit loop
      } catch (error: any) {
        lastError = error;
        console.log(`Model ${modelName} failed: ${error.message}`);
        continue; // Try next model
      }
    }
    
    if (!message) {
      throw new Error(`All models failed. Last error: ${lastError?.message || "Unknown"}`);
    }

    const content = message.content[0];
    if (content.type === "text") {
      // Try to extract JSON from the response (handle markdown code blocks)
      let jsonText = content.text.trim();
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
      }
      
      const result = JSON.parse(jsonText);
      return {
        keywords: result.keywords || [],
        topics: result.topics || [],
        brandVoice: result.brandVoice || "",
        targetKeywords: result.targetKeywords || [],
        suggestedNiches: result.suggestedNiches || [],
      };
    }
  } catch (error: any) {
    console.error("Error in AI analysis:", error);
    throw new Error(`AI analysis failed: ${error.message || "Unknown error"}`);
  }

  return {
    keywords: [],
    topics: [],
    brandVoice: "",
    targetKeywords: [],
    suggestedNiches: [],
  };
}

export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if API key is configured
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY is not set in environment variables");
    return NextResponse.json({ 
      error: "Anthropic API key is not configured. Please add ANTHROPIC_API_KEY to your .env.local file." 
    }, { status: 500 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { brandProfileId } = await request.json();

  // Get brand profile
  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("id", brandProfileId)
    .eq("user_id", dbUser.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  try {
    console.log("Analyzing brand:", profile.company_name);

    const analysis = await analyzeBrandContent(
      profile.company_name || "",
      profile.website || "",
      profile.social_urls || {},
      profile.bio || ""
    );

    // Update brand profile with extracted data
    const { error } = await supabase
      .from("brand_profiles")
      .update({
        extracted_keywords: analysis.keywords,
        extracted_topics: analysis.topics,
        brand_voice: analysis.brandVoice,
        target_keywords: analysis.targetKeywords,
        preferred_niches: analysis.suggestedNiches,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq("id", brandProfileId);

    if (error) {
      console.error("Error updating profile:", error);
      return NextResponse.json({ error: "Failed to save analysis" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      analysis: {
        keywords: analysis.keywords,
        topics: analysis.topics,
        brandVoice: analysis.brandVoice,
        targetKeywords: analysis.targetKeywords,
        suggestedNiches: analysis.suggestedNiches,
      },
    });
  } catch (error: any) {
    console.error("Analysis error:", error);
    const errorMessage = error?.message || "Analysis failed";
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === "development" ? error?.stack : undefined
    }, { status: 500 });
  }
}
