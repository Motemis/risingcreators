interface Campaign {
  id: string;
  name: string;
  target_niches: string[] | null;
  min_followers: number | null;
  max_followers: number | null;
  target_engagement_rate: number | null;
  preferred_platforms: string[] | null;
  content_style: string[] | null;
  ideal_creator_description: string | null;
  content_requirements: string | null;
  brief: string | null;
  budget_per_creator: number | null;
}

interface CreatorProfile {
  id: string;
  niche: string[] | null;
  bio: string | null;
  display_name: string | null;
  youtube_subscribers: number | null;
  tiktok_followers: number | null;
  instagram_followers: number | null;
  youtube_channel_id: string | null;
  tiktok_handle: string | null;
  instagram_handle: string | null;
  engagement_rate?: number | null;
  brand_readiness_score?: number | null;
  past_brands?: string[] | null;
  preferred_categories?: string[] | null;
}

export interface MatchResult {
  score: number;
  tier: "perfect" | "strong" | "potential";
  reasons: string[];
  highlights: string[];
  misses: string[];
}

export function calculateCreatorCampaignMatch(
  campaign: Campaign,
  creator: CreatorProfile
): MatchResult {
  let score = 0;
  const reasons: string[] = [];
  const highlights: string[] = [];
  const misses: string[] = [];

  const totalFollowers =
    (creator.youtube_subscribers || 0) +
    (creator.tiktok_followers || 0) +
    (creator.instagram_followers || 0);

  // 1. FOLLOWER RANGE FIT (10 points) - Hard requirement
  const minFollowers = campaign.min_followers || 0;
  const maxFollowers = campaign.max_followers || 10000000;
  
  if (totalFollowers >= minFollowers && totalFollowers <= maxFollowers) {
    score += 10;
    
    // Bonus for being in the "sweet spot" (middle 50% of range)
    const range = maxFollowers - minFollowers;
    const sweetSpotMin = minFollowers + range * 0.25;
    const sweetSpotMax = maxFollowers - range * 0.25;
    
    if (totalFollowers >= sweetSpotMin && totalFollowers <= sweetSpotMax) {
      score += 5;
      highlights.push(`Follower count (${formatNumber(totalFollowers)}) is in their sweet spot`);
    } else {
      reasons.push(`Follower count in range`);
    }
  } else {
    misses.push(`Follower count outside target range`);
  }

  // 2. NICHE ALIGNMENT (20 points)
  if (campaign.target_niches && campaign.target_niches.length > 0 && creator.niche) {
    const matchingNiches = creator.niche.filter((n) =>
      campaign.target_niches!.some((cn) => cn.toLowerCase() === n.toLowerCase())
    );
    
    if (matchingNiches.length > 0) {
      const nicheScore = Math.min(20, (matchingNiches.length / campaign.target_niches.length) * 20);
      score += nicheScore;
      highlights.push(`Niche match: ${matchingNiches.join(", ")}`);
    } else {
      misses.push(`No direct niche overlap`);
    }
  } else {
    score += 10; // Partial if no niche requirement
  }

  // 3. PLATFORM MATCH (10 points)
  if (campaign.preferred_platforms && campaign.preferred_platforms.length > 0) {
    const creatorPlatforms: string[] = [];
    if (creator.youtube_channel_id || (creator.youtube_subscribers && creator.youtube_subscribers > 0)) {
      creatorPlatforms.push("youtube");
    }
    if (creator.tiktok_handle || (creator.tiktok_followers && creator.tiktok_followers > 0)) {
      creatorPlatforms.push("tiktok");
    }
    if (creator.instagram_handle || (creator.instagram_followers && creator.instagram_followers > 0)) {
      creatorPlatforms.push("instagram");
    }

    const matchingPlatforms = creatorPlatforms.filter((p) =>
      campaign.preferred_platforms!.includes(p)
    );

    if (matchingPlatforms.length > 0) {
      const platformScore = (matchingPlatforms.length / campaign.preferred_platforms.length) * 10;
      score += platformScore;
      if (matchingPlatforms.length === campaign.preferred_platforms.length) {
        highlights.push(`Active on all requested platforms`);
      } else {
        reasons.push(`Platform match: ${matchingPlatforms.join(", ")}`);
      }
    } else {
      misses.push(`Not active on requested platforms`);
    }
  } else {
    score += 5;
  }

  // 4. ENGAGEMENT RATE (10 points)
  if (campaign.target_engagement_rate && creator.engagement_rate) {
    if (creator.engagement_rate >= campaign.target_engagement_rate) {
      score += 10;
      if (creator.engagement_rate >= campaign.target_engagement_rate * 1.5) {
        highlights.push(`Engagement (${creator.engagement_rate}%) exceeds minimum by 50%+`);
      } else {
        reasons.push(`Engagement meets minimum (${campaign.target_engagement_rate}%)`);
      }
    } else if (creator.engagement_rate >= campaign.target_engagement_rate * 0.8) {
      score += 5;
      reasons.push(`Engagement close to minimum`);
    } else {
      misses.push(`Engagement below target`);
    }
  } else if (!campaign.target_engagement_rate) {
    score += 5;
  }

  // 5. KEYWORD MATCHING FROM DESCRIPTION (25 points)
  const campaignText = [
    campaign.ideal_creator_description,
    campaign.content_requirements,
    campaign.brief,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const creatorText = [creator.bio, creator.display_name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (campaignText && creatorText) {
    const keywords = extractMeaningfulKeywords(campaignText);
    const matchedKeywords = keywords.filter((kw) => creatorText.includes(kw));

    if (matchedKeywords.length >= 5) {
      score += 25;
      highlights.push(`Strong keyword alignment with campaign needs`);
    } else if (matchedKeywords.length >= 3) {
      score += 18;
      highlights.push(`Good keyword match: "${matchedKeywords.slice(0, 3).join('", "')}"`);
    } else if (matchedKeywords.length >= 1) {
      score += 10;
      reasons.push(`Some keyword overlap`);
    }
  }

  // 6. CONTENT STYLE MATCH (15 points)
  if (campaign.content_style && campaign.content_style.length > 0 && creatorText) {
    const styleKeywords: Record<string, string[]> = {
      educational: ["tutorial", "learn", "teach", "how to", "tips", "guide", "explain"],
      entertaining: ["fun", "comedy", "funny", "entertainment", "laugh", "humor"],
      reviews: ["review", "honest", "opinion", "testing", "tried", "verdict"],
      tutorials: ["tutorial", "step by step", "walkthrough", "how to", "guide"],
      vlogs: ["vlog", "day in", "life", "behind the scenes", "daily"],
      lifestyle: ["lifestyle", "life", "routine", "daily", "living"],
    };

    let styleMatches = 0;
    const matchedStyles: string[] = [];

    for (const style of campaign.content_style) {
      const keywords = styleKeywords[style] || [];
      if (keywords.some((kw) => creatorText.includes(kw))) {
        styleMatches++;
        matchedStyles.push(style);
      }
    }

    if (styleMatches > 0) {
      const styleScore = (styleMatches / campaign.content_style.length) * 15;
      score += styleScore;
      if (styleMatches >= 2) {
        highlights.push(`Content style match: ${matchedStyles.join(", ")}`);
      } else {
        reasons.push(`Content style alignment`);
      }
    }
  } else {
    score += 7;
  }

  // 7. BRAND READINESS (5 points)
  if (creator.brand_readiness_score) {
    if (creator.brand_readiness_score >= 70) {
      score += 5;
      reasons.push(`Brand ready profile`);
    } else if (creator.brand_readiness_score >= 50) {
      score += 3;
    }
  }

  // 8. PAST BRAND EXPERIENCE (5 points bonus)
  if (creator.past_brands && creator.past_brands.length > 0) {
    score += 5;
    reasons.push(`Previous brand collaboration experience`);
  }

  // Determine tier
  let tier: "perfect" | "strong" | "potential";
  if (score >= 75 && highlights.length >= 2) {
    tier = "perfect";
  } else if (score >= 50) {
    tier = "strong";
  } else {
    tier = "potential";
  }

  return {
    score: Math.min(100, score),
    tier,
    reasons,
    highlights,
    misses,
  };
}

function extractMeaningfulKeywords(text: string): string[] {
  const stopWords = new Set([
    "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "and", "or",
    "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is",
    "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "that", "which", "who", "this", "these", "those", "am", "not", "looking",
    "want", "need", "like", "love", "someone", "something", "content", "creator",
    "creators", "brand", "brands", "campaign", "their", "they", "them", "about",
    "just", "really", "very", "also", "can", "make", "get", "more", "some",
  ]);

  const words = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return [...new Set(words)];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
