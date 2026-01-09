import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// Industry average engagement rates by follower tier
const INDUSTRY_AVG_ENGAGEMENT: Record<string, number> = {
  micro: 8.0, // < 10K
  small: 5.0, // 10K - 50K
  medium: 3.5, // 50K - 100K
  large: 2.5, // 100K - 500K
  mega: 1.5, // 500K+
};

// Estimated CPM by niche (USD)
const NICHE_CPM: Record<string, number> = {
  Finance: 25,
  Tech: 20,
  Business: 18,
  Education: 15,
  Beauty: 12,
  Fashion: 12,
  Fitness: 10,
  Food: 8,
  Travel: 8,
  Gaming: 6,
  Entertainment: 5,
  Lifestyle: 5,
  Music: 4,
  Sports: 4,
  Parenting: 10,
  Pets: 6,
};

function getFollowerTier(followers: number): string {
  if (followers < 10000) return "micro";
  if (followers < 50000) return "small";
  if (followers < 100000) return "medium";
  if (followers < 500000) return "large";
  return "mega";
}

function calculateAuthenticityScore(
  engagementRate: number,
  followers: number,
  avgViews: number
): number {
  const tier = getFollowerTier(followers);
  const industryAvg = INDUSTRY_AVG_ENGAGEMENT[tier];

  let score = 50; // Base score

  // Engagement vs industry average
  if (engagementRate >= industryAvg * 1.5) score += 25;
  else if (engagementRate >= industryAvg) score += 15;
  else if (engagementRate >= industryAvg * 0.5) score += 5;
  else score -= 10; // Suspiciously low

  // View-to-follower ratio (healthy is 10-30%)
  const viewRatio = (avgViews / Math.max(followers, 1)) * 100;
  if (viewRatio >= 20 && viewRatio <= 50) score += 15;
  else if (viewRatio >= 10 && viewRatio <= 60) score += 10;
  else if (viewRatio < 5) score -= 15; // Possibly fake followers
  else if (viewRatio > 100) score += 5; // Viral potential

  // Engagement too high can be suspicious (bought engagement)
  if (engagementRate > industryAvg * 3) score -= 10;

  return Math.max(0, Math.min(100, score));
}

function calculateBrandReadinessScore(
  followers: number,
  engagementRate: number,
  consistencyScore: number,
  authenticityScore: number,
  growthRate7d: number | null
): number {
  let score = 0;

  // Follower count (max 20 points)
  if (followers >= 100000) score += 20;
  else if (followers >= 50000) score += 17;
  else if (followers >= 25000) score += 14;
  else if (followers >= 10000) score += 10;
  else score += 5;

  // Engagement rate (max 25 points)
  if (engagementRate >= 8) score += 25;
  else if (engagementRate >= 5) score += 20;
  else if (engagementRate >= 3) score += 15;
  else if (engagementRate >= 1) score += 10;
  else score += 5;

  // Consistency (max 20 points)
  score += Math.round(consistencyScore * 0.2);

  // Authenticity (max 20 points)
  score += Math.round(authenticityScore * 0.2);

  // Growth momentum (max 15 points)
  if (growthRate7d && growthRate7d > 5) score += 15;
  else if (growthRate7d && growthRate7d > 2) score += 10;
  else if (growthRate7d && growthRate7d > 0) score += 5;

  return Math.min(100, score);
}

export async function POST(request: NextRequest) {
  const user = await currentUser();

  const adminEmails = ["justin.motes@me.com", "motemis@gmail.com"];
  if (!user || !adminEmails.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { limit = 50 } = await request.json();

  console.log("Enriching creator data...");

  try {
    // Get creators that need enrichment (oldest enriched first)
    const { data: creators } = await supabase
      .from("discovered_creators")
      .select("*")
      .eq("platform", "youtube")
      .eq("status", "active")
      .order("last_scraped_at", { ascending: true })
      .limit(limit);

    if (!creators || creators.length === 0) {
      return NextResponse.json({ message: "No creators to enrich" });
    }

    let enriched = 0;

    for (const creator of creators as any[]) {
      try {
        // Get recent videos for this channel
        const videosResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
            `part=snippet&channelId=${creator.platform_user_id}&type=video&order=date&maxResults=10` +
            `&key=${process.env.GOOGLE_API_KEY}`
        );

        const videosData = await videosResponse.json();

        if (!videosData.items || videosData.items.length === 0) {
          continue;
        }

        // Get video stats
        const videoIds = videosData.items.map((v: any) => v.id.videoId).join(",");

        const statsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/videos?` +
            `part=statistics,contentDetails&id=${videoIds}` +
            `&key=${process.env.GOOGLE_API_KEY}`
        );

        const statsData = await statsResponse.json();

        if (!statsData.items || statsData.items.length === 0) {
          continue;
        }

        // Calculate metrics from recent videos
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;
        let totalDuration = 0;
        let shortsCount = 0;

        for (const video of statsData.items) {
          const views = parseInt(video.statistics.viewCount) || 0;
          const likes = parseInt(video.statistics.likeCount) || 0;
          const comments = parseInt(video.statistics.commentCount) || 0;

          totalViews += views;
          totalLikes += likes;
          totalComments += comments;

          // Parse duration (PT1H2M3S format)
          const duration = video.contentDetails.duration;
          const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
          if (match) {
            const hours = parseInt(match[1] || "0");
            const minutes = parseInt(match[2] || "0");
            const seconds = parseInt(match[3] || "0");
            const totalSeconds = hours * 3600 + minutes * 60 + seconds;
            totalDuration += totalSeconds;

            // Shorts are typically under 60 seconds
            if (totalSeconds <= 60) shortsCount++;
          }
        }

        const videoCount = statsData.items.length;
        const avgViews = Math.round(totalViews / videoCount);
        const avgLikes = Math.round(totalLikes / videoCount);
        const avgComments = Math.round(totalComments / videoCount);
        const avgDuration = Math.round(totalDuration / videoCount);
        const shortsPercentage = Math.round((shortsCount / videoCount) * 100);

        // Calculate engagement rate (likes + comments) / views * 100
        const engagementRate =
          totalViews > 0
            ? Number((((totalLikes + totalComments) / totalViews) * 100).toFixed(2))
            : 0;

        // Calculate posting frequency (videos per week)
        // Get the date range of videos
        const firstVideoDate = new Date(
          videosData.items[videosData.items.length - 1].snippet.publishedAt
        );
        const lastVideoDate = new Date(
          videosData.items[0].snippet.publishedAt
        );
        const dayRange = Math.max(
          1,
          (lastVideoDate.getTime() - firstVideoDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        const postingFrequency = Number(((videoCount / dayRange) * 7).toFixed(2));

        // Consistency score (based on posting frequency)
        let consistencyScore = 0;
        if (postingFrequency >= 7) consistencyScore = 100; // Daily+
        else if (postingFrequency >= 3) consistencyScore = 80; // 3+ per week
        else if (postingFrequency >= 1) consistencyScore = 60; // Weekly
        else if (postingFrequency >= 0.5) consistencyScore = 40; // Bi-weekly
        else if (postingFrequency >= 0.25) consistencyScore = 20; // Monthly
        else consistencyScore = 10;

        // Authenticity score
        const authenticityScore = calculateAuthenticityScore(
          engagementRate,
          creator.followers,
          avgViews
        );

        // Brand readiness score
        const brandReadinessScore = calculateBrandReadinessScore(
          creator.followers,
          engagementRate,
          consistencyScore,
          authenticityScore,
          creator.growth_rate_7d ?? null
        );

        // Estimated CPM based on niche
        const primaryNiche = creator.niche?.[0] || "Lifestyle";
        const estimatedCpm = NICHE_CPM[primaryNiche] || 5;

        // Estimated monthly reach (avg views × posts per month)
        const postsPerMonth = postingFrequency * 4.33;
        const estimatedReachMonthly = Math.round(avgViews * postsPerMonth);

        // Update the creator
        await supabase
          .from("discovered_creators")
          .update({
            engagement_rate: engagementRate,
            avg_likes: avgLikes,
            avg_comments: avgComments,
            recent_avg_views: avgViews,
            posting_frequency: postingFrequency,
            consistency_score: consistencyScore,
            authenticity_score: authenticityScore,
            brand_readiness_score: brandReadinessScore,
            estimated_cpm: estimatedCpm,
            estimated_reach_monthly: estimatedReachMonthly,
            last_video_at: lastVideoDate.toISOString(),
            avg_video_duration: avgDuration,
            shorts_percentage: shortsPercentage,
            last_scraped_at: new Date().toISOString(),
          })
          .eq("id", creator.id);

        enriched++;

        // Rate limit protection
        await new Promise((r) => setTimeout(r, 200));
      } catch (creatorError) {
        console.error(`Error enriching ${creator.display_name}:`, creatorError);
      }
    }

    console.log(`Enriched ${enriched} creators`);

    return NextResponse.json({ success: true, enriched });
  } catch (err) {
    console.error("Enrich error:", err);
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}



