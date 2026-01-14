interface Campaign {
  target_niches: string[] | null;
  min_followers: number | null;
  max_followers: number | null;
  target_engagement_rate: number | null;
  preferred_platforms: string[] | null;
  content_style: string[] | null;
  ideal_creator_description: string | null;
  content_requirements: string | null;
  brief: string | null;
}

interface Creator {
  niche: string[] | null;
  followers: number;
  engagement_rate: number | null;
  platform: string | null;
  brand_readiness_score: number | null;
  bio: string | null;
  display_name: string | null;
}

export function calculateCampaignMatchScore(
  campaign: Campaign,
  creator: Creator
): { score: number; grade: string; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];

  // 1. Niche Match (30 points)
  if (campaign.target_niches && campaign.target_niches.length > 0 && creator.niche) {
    const matchingNiches = creator.niche.filter((n) =>
      campaign.target_niches!.includes(n)
    );
    if (matchingNiches.length > 0) {
      const nicheScore = Math.min(30, (matchingNiches.length / campaign.target_niches.length) * 30);
      score += nicheScore;
      reasons.push(`Niche match: ${matchingNiches.join(", ")}`);
    }
  } else if (!campaign.target_niches || campaign.target_niches.length === 0) {
    score += 15; // Partial points if no niche requirement
  }

  // 2. Follower Range (20 points)
  const minFollowers = campaign.min_followers || 0;
  const maxFollowers = campaign.max_followers || 10000000;
  if (creator.followers >= minFollowers && creator.followers <= maxFollowers) {
    score += 20;
    reasons.push("Follower count in range");
  } else if (creator.followers >= minFollowers * 0.8 && creator.followers <= maxFollowers * 1.2) {
    score += 10; // Close to range
  }

  // 3. Engagement Rate (20 points)
  if (campaign.target_engagement_rate && creator.engagement_rate) {
    if (creator.engagement_rate >= campaign.target_engagement_rate) {
      score += 20;
      reasons.push(`High engagement (${creator.engagement_rate}%)`);
    } else if (creator.engagement_rate >= campaign.target_engagement_rate * 0.7) {
      score += 10;
    }
  } else if (!campaign.target_engagement_rate) {
    score += 10; // Partial points if no engagement requirement
  }

  // 4. Platform Match (15 points)
  if (campaign.preferred_platforms && campaign.preferred_platforms.length > 0) {
    if (creator.platform && campaign.preferred_platforms.includes(creator.platform)) {
      score += 15;
      reasons.push(`Platform match: ${creator.platform}`);
    }
  } else {
    score += 8; // Partial points if no platform requirement
  }

  // 5. Brand Readiness (15 points)
  if (creator.brand_readiness_score) {
    if (creator.brand_readiness_score >= 70) {
      score += 15;
      reasons.push("Brand ready");
    } else if (creator.brand_readiness_score >= 50) {
      score += 10;
    } else if (creator.brand_readiness_score >= 30) {
      score += 5;
    }
  }

  // 6. Keyword matching from campaign description (bonus up to 10 points)
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
    // Extract meaningful keywords from campaign text
    const keywords = extractKeywords(campaignText);
    const matchedKeywords = keywords.filter((kw) => creatorText.includes(kw));

    if (matchedKeywords.length >= 3) {
      score += 10;
      reasons.push("Strong keyword match");
    } else if (matchedKeywords.length >= 1) {
      score += 5;
      reasons.push("Keyword match");
    }
  }

  // Calculate grade
  const grade =
    score >= 90
      ? "A+"
      : score >= 80
      ? "A"
      : score >= 70
      ? "B+"
      : score >= 60
      ? "B"
      : score >= 50
      ? "C"
      : "D";

  return { score: Math.min(100, score), grade, reasons };
}

function extractKeywords(text: string): string[] {
  // Common words to ignore
  const stopWords = new Set([
    "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "and", "or",
    "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is",
    "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "that", "which", "who", "whom", "this", "these", "those", "am", "not",
    "looking", "want", "need", "like", "love", "someone", "something", "content",
    "creator", "creators", "brand", "brands", "campaign", "video", "videos",
    "post", "posts", "their", "they", "them", "about", "just", "really",
  ]);

  const words = text
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  // Return unique keywords
  return [...new Set(words)];
}
