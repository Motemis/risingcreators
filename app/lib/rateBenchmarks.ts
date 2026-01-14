import { supabase } from "@/lib/supabase";

export interface RateRange {
  low: number;
  mid: number;
  high: number;
}

export interface CreatorRates {
  youtube_integration?: RateRange;
  youtube_dedicated?: RateRange;
  tiktok_post?: RateRange;
  instagram_post?: RateRange;
  instagram_story?: RateRange;
  instagram_reel?: RateRange;
  twitch_sponsored?: RateRange;
}

export async function getIndustryRates(
  youtubeFollowers: number,
  tiktokFollowers: number,
  instagramFollowers: number,
  twitchFollowers: number
): Promise<CreatorRates> {
  const rates: CreatorRates = {};

  // Fetch all benchmarks
  const { data: benchmarks } = await supabase
    .from("rate_benchmarks")
    .select("*");

  if (!benchmarks) return rates;

  const findRate = (platform: string, contentType: string, followers: number): RateRange | undefined => {
    const benchmark = benchmarks.find(
      (b) =>
        b.platform === platform &&
        b.content_type === contentType &&
        followers >= b.follower_min &&
        followers < b.follower_max
    );

    if (benchmark) {
      return {
        low: benchmark.rate_low,
        mid: benchmark.rate_mid,
        high: benchmark.rate_high,
      };
    }
    return undefined;
  };

  if (youtubeFollowers > 0) {
    rates.youtube_integration = findRate("youtube", "integration", youtubeFollowers);
    rates.youtube_dedicated = findRate("youtube", "dedicated", youtubeFollowers);
  }

  if (tiktokFollowers > 0) {
    rates.tiktok_post = findRate("tiktok", "post", tiktokFollowers);
  }

  if (instagramFollowers > 0) {
    rates.instagram_post = findRate("instagram", "post", instagramFollowers);
    rates.instagram_story = findRate("instagram", "story", instagramFollowers);
    rates.instagram_reel = findRate("instagram", "reel", instagramFollowers);
  }

  if (twitchFollowers > 0) {
    rates.twitch_sponsored = findRate("twitch", "sponsored_stream", twitchFollowers);
  }

  return rates;
}

// Fallback calculation if no database benchmarks
export function calculateFallbackRates(
  youtubeFollowers: number,
  tiktokFollowers: number,
  instagramFollowers: number,
  twitchFollowers: number
): CreatorRates {
  const rates: CreatorRates = {};

  // YouTube: $10-25 per 1K followers
  if (youtubeFollowers > 0) {
    rates.youtube_integration = {
      low: Math.max(50, Math.round(youtubeFollowers * 0.01)),
      mid: Math.max(100, Math.round(youtubeFollowers * 0.015)),
      high: Math.max(200, Math.round(youtubeFollowers * 0.025)),
    };
    rates.youtube_dedicated = {
      low: Math.max(150, Math.round(youtubeFollowers * 0.03)),
      mid: Math.max(300, Math.round(youtubeFollowers * 0.04)),
      high: Math.max(500, Math.round(youtubeFollowers * 0.06)),
    };
  }

  // TikTok: $5-15 per 1K followers
  if (tiktokFollowers > 0) {
    rates.tiktok_post = {
      low: Math.max(25, Math.round(tiktokFollowers * 0.005)),
      mid: Math.max(50, Math.round(tiktokFollowers * 0.01)),
      high: Math.max(100, Math.round(tiktokFollowers * 0.015)),
    };
  }

  // Instagram: $5-15 per 1K followers
  if (instagramFollowers > 0) {
    rates.instagram_post = {
      low: Math.max(25, Math.round(instagramFollowers * 0.005)),
      mid: Math.max(50, Math.round(instagramFollowers * 0.01)),
      high: Math.max(100, Math.round(instagramFollowers * 0.015)),
    };
    rates.instagram_story = {
      low: Math.max(15, Math.round(instagramFollowers * 0.0025)),
      mid: Math.max(25, Math.round(instagramFollowers * 0.005)),
      high: Math.max(50, Math.round(instagramFollowers * 0.0075)),
    };
    rates.instagram_reel = {
      low: Math.max(35, Math.round(instagramFollowers * 0.0075)),
      mid: Math.max(75, Math.round(instagramFollowers * 0.015)),
      high: Math.max(150, Math.round(instagramFollowers * 0.025)),
    };
  }

  // Twitch: $50-200 per hour per 1K concurrent viewers (rough estimate based on followers)
  if (twitchFollowers > 0) {
    rates.twitch_sponsored = {
      low: Math.max(50, Math.round(twitchFollowers * 0.01)),
      mid: Math.max(100, Math.round(twitchFollowers * 0.02)),
      high: Math.max(200, Math.round(twitchFollowers * 0.04)),
    };
  }

  return rates;
}
