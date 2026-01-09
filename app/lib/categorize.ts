const NICHE_KEYWORDS: Record<string, string[]> = {
    "Fitness": ["fitness", "workout", "gym", "exercise", "muscle", "training", "crossfit", "yoga", "weight loss", "health"],
    "Tech": ["tech", "technology", "gadget", "software", "coding", "programming", "computer", "phone", "app", "developer", "ai", "startup"],
    "Gaming": ["gaming", "game", "gamer", "playstation", "xbox", "nintendo", "esports", "twitch", "streamer", "gameplay"],
    "Beauty": ["beauty", "makeup", "skincare", "cosmetics", "tutorial", "hair", "nails", "glam"],
    "Fashion": ["fashion", "style", "outfit", "clothing", "wear", "trend", "designer", "model"],
    "Food": ["food", "cooking", "recipe", "chef", "kitchen", "meal", "restaurant", "baking", "cuisine", "eat"],
    "Travel": ["travel", "adventure", "explore", "destination", "vacation", "trip", "backpack", "tourist", "vlog"],
    "Lifestyle": ["lifestyle", "daily", "routine", "life", "vlog", "day in the life", "morning routine"],
    "Finance": ["finance", "money", "invest", "stock", "crypto", "trading", "wealth", "budget", "financial", "entrepreneur"],
    "Education": ["education", "learn", "tutorial", "how to", "teach", "course", "study", "school", "university", "explain"],
    "Entertainment": ["entertainment", "funny", "comedy", "prank", "challenge", "react", "reaction"],
    "Music": ["music", "song", "singer", "artist", "band", "cover", "album", "producer", "beat"],
    "Sports": ["sports", "football", "basketball", "soccer", "baseball", "golf", "tennis", "athlete", "nfl", "nba"],
    "Parenting": ["parenting", "mom", "dad", "baby", "kids", "family", "children", "motherhood", "fatherhood"],
    "Pets": ["pet", "dog", "cat", "puppy", "kitten", "animal", "rescue"],
  };
  
  export function categorizeCreator(title: string, bio: string): string[] {
    const text = `${title} ${bio}`.toLowerCase();
    const matchedNiches: { niche: string; score: number }[] = [];
  
    for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          score++;
        }
      }
      if (score > 0) {
        matchedNiches.push({ niche, score });
      }
    }
  
    // Sort by score and return top 3
    matchedNiches.sort((a, b) => b.score - a.score);
    const topNiches = matchedNiches.slice(0, 3).map((n) => n.niche);
  
    // Default to Lifestyle if no matches
    return topNiches.length > 0 ? topNiches : ["Lifestyle"];
  }
  
  export function calculateRisingScore(
    followers: number,
    growth7d: number | null,
    growth30d: number | null,
    avgViews: number,
    totalPosts: number
  ): number {
    let score = 0;
  
    // Growth rate (most important)
    if (growth7d && growth7d > 10) score += 40;
    else if (growth7d && growth7d > 5) score += 30;
    else if (growth7d && growth7d > 2) score += 20;
    else if (growth7d && growth7d > 0) score += 10;
  
    if (growth30d && growth30d > 30) score += 25;
    else if (growth30d && growth30d > 20) score += 20;
    else if (growth30d && growth30d > 10) score += 15;
    else if (growth30d && growth30d > 0) score += 5;
  
    // Engagement (views per video relative to followers)
    const viewRatio = avgViews / Math.max(followers, 1);
    if (viewRatio > 1) score += 20;
    else if (viewRatio > 0.5) score += 15;
    else if (viewRatio > 0.2) score += 10;
    else if (viewRatio > 0.1) score += 5;
  
    // Content consistency
    if (totalPosts > 100) score += 10;
    else if (totalPosts > 50) score += 7;
    else if (totalPosts > 20) score += 5;
  
    // Sweet spot bonus (10K-100K is ideal for brands)
    if (followers >= 10000 && followers <= 100000) score += 5;
  
  return Math.min(score, 100);
}

interface BrandProfile {
  industry: string;
  target_audience_age: string[];
  target_audience_gender: string;
  budget_per_creator: string;
  campaign_goals: string[];
  preferred_creator_size: string[];
  preferred_content_style: string[];
  preferred_niches: string[];
}

interface Creator {
  niche: string[] | null;
  followers: number;
  engagement_rate: number | null;
  brand_readiness_score: number | null;
  avg_views: number | null;
  shorts_percentage: number | null;
}

// Map industries to relevant niches
const INDUSTRY_NICHE_MAP: Record<string, string[]> = {
  "E-commerce / Retail": ["Lifestyle", "Fashion", "Beauty", "Tech"],
  "SaaS / Technology": ["Tech", "Education", "Finance"],
  "Food & Beverage": ["Food", "Lifestyle", "Fitness"],
  "Health & Wellness": ["Fitness", "Lifestyle", "Food", "Parenting"],
  "Beauty & Cosmetics": ["Beauty", "Fashion", "Lifestyle"],
  "Fashion & Apparel": ["Fashion", "Beauty", "Lifestyle"],
  "Finance / Fintech": ["Finance", "Tech", "Education"],
  "Travel & Hospitality": ["Travel", "Lifestyle", "Food"],
  "Entertainment / Media": ["Entertainment", "Music", "Gaming"],
  "Education": ["Education", "Tech", "Parenting"],
  "Gaming": ["Gaming", "Tech", "Entertainment"],
  "Sports & Fitness": ["Sports", "Fitness", "Lifestyle"],
  "Home & Living": ["Lifestyle", "Parenting", "Food"],
  "Automotive": ["Tech", "Lifestyle", "Sports"],
};

// Map budget to appropriate follower ranges
const BUDGET_SIZE_MAP: Record<string, { min: number; max: number }> = {
  "under_500": { min: 1000, max: 25000 },
  "500_1000": { min: 10000, max: 50000 },
  "1000_5000": { min: 25000, max: 250000 },
  "5000_plus": { min: 100000, max: 10000000 },
};

// Map size labels to follower ranges
const SIZE_RANGES: Record<string, { min: number; max: number }> = {
  "micro": { min: 1000, max: 10000 },
  "small": { min: 10000, max: 50000 },
  "medium": { min: 50000, max: 100000 },
  "large": { min: 100000, max: 500000 },
};

export function calculateMatchScore(brand: BrandProfile, creator: Creator): {
  score: number;
  grade: string;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // 1. Niche Match (max 30 points)
  const creatorNiches = creator.niche || [];
  const brandNiches = brand.preferred_niches || [];
  const industryNiches = INDUSTRY_NICHE_MAP[brand.industry] || [];
  
  const nicheMatches = creatorNiches.filter(
    (n) => brandNiches.includes(n) || industryNiches.includes(n)
  );

  if (nicheMatches.length >= 2) {
    score += 30;
    reasons.push(`Strong niche match: ${nicheMatches.join(", ")}`);
  } else if (nicheMatches.length === 1) {
    score += 20;
    reasons.push(`Niche match: ${nicheMatches[0]}`);
  } else if (creatorNiches.some((n) => industryNiches.includes(n))) {
    score += 10;
    reasons.push("Related industry niche");
  }

  // 2. Size/Budget Fit (max 25 points)
  const budgetRange = BUDGET_SIZE_MAP[brand.budget_per_creator];
  const preferredSizes = brand.preferred_creator_size || [];

  let sizeMatch = false;
  for (const size of preferredSizes) {
    const range = SIZE_RANGES[size];
    if (range && creator.followers >= range.min && creator.followers <= range.max) {
      sizeMatch = true;
      break;
    }
  }

  if (sizeMatch) {
    score += 25;
    reasons.push("Matches preferred creator size");
  } else if (budgetRange && creator.followers >= budgetRange.min && creator.followers <= budgetRange.max) {
    score += 15;
    reasons.push("Within budget range");
  }

  // 3. Engagement Quality (max 20 points)
  const engagement = creator.engagement_rate || 0;
  
  if (engagement >= 5) {
    score += 20;
    reasons.push("Excellent engagement rate");
  } else if (engagement >= 3) {
    score += 15;
    reasons.push("Good engagement rate");
  } else if (engagement >= 1) {
    score += 10;
    reasons.push("Average engagement");
  }

  // 4. Brand Readiness (max 15 points)
  const readiness = creator.brand_readiness_score || 0;
  
  if (readiness >= 70) {
    score += 15;
    reasons.push("Highly brand-ready");
  } else if (readiness >= 50) {
    score += 10;
    reasons.push("Brand-ready");
  } else if (readiness >= 30) {
    score += 5;
  }

  // 5. Campaign Goal Fit (max 10 points)
  const goals = brand.campaign_goals || [];
  
  if (goals.includes("awareness") && creator.followers > 50000) {
    score += 5;
    reasons.push("Good for awareness campaigns");
  }
  if (goals.includes("engagement") && engagement >= 4) {
    score += 5;
    reasons.push("High-engagement creator");
  }
  if (goals.includes("content") && (creator.brand_readiness_score || 0) >= 60) {
    score += 5;
    reasons.push("Quality content creator");
  }
  if (goals.includes("sales") && engagement >= 3) {
    score += 5;
  }

  // Cap at 100
  score = Math.min(100, score);

  // Calculate grade
  let grade: string;
  if (score >= 85) grade = "A+";
  else if (score >= 75) grade = "A";
  else if (score >= 65) grade = "B+";
  else if (score >= 55) grade = "B";
  else if (score >= 45) grade = "C+";
  else if (score >= 35) grade = "C";
  else grade = "D";

  return { score, grade, reasons: reasons.slice(0, 3) };
}

interface EnhancedBrandProfile extends BrandProfile {
  extracted_keywords?: string[];
  extracted_topics?: string[];
  target_keywords?: string[];
}

interface EnhancedCreator extends Creator {
  bio?: string | null;
  display_name?: string;
}

export function calculateEnhancedMatchScore(
  brand: EnhancedBrandProfile,
  creator: EnhancedCreator
): {
  score: number;
  grade: string;
  reasons: string[];
} {
  let score = 0;
  const reasons: string[] = [];

  // 1. Niche Match (max 25 points)
  const creatorNiches = creator.niche || [];
  const brandNiches = brand.preferred_niches || [];
  const industryNiches = INDUSTRY_NICHE_MAP[brand.industry] || [];

  const nicheMatches = creatorNiches.filter(
    (n) => brandNiches.includes(n) || industryNiches.includes(n)
  );

  if (nicheMatches.length >= 2) {
    score += 25;
    reasons.push(`Strong niche match: ${nicheMatches.join(", ")}`);
  } else if (nicheMatches.length === 1) {
    score += 15;
    reasons.push(`Niche match: ${nicheMatches[0]}`);
  } else if (creatorNiches.some((n) => industryNiches.includes(n))) {
    score += 8;
    reasons.push("Related industry niche");
  }

  // 2. Keyword Match (max 30 points) - NEW
  const brandKeywords = [
    ...(brand.extracted_keywords || []),
    ...(brand.target_keywords || []),
    ...(brand.extracted_topics || []),
  ].map((k) => k.toLowerCase());

  const creatorText = `${creator.display_name || ""} ${creator.bio || ""} ${(creator.niche || []).join(" ")}`.toLowerCase();

  let keywordMatches = 0;
  const matchedKeywords: string[] = [];

  for (const keyword of brandKeywords) {
    if (creatorText.includes(keyword.toLowerCase())) {
      keywordMatches++;
      if (matchedKeywords.length < 5) {
        matchedKeywords.push(keyword);
      }
    }
  }

  if (keywordMatches >= 5) {
    score += 30;
    reasons.push(`Strong keyword match: ${matchedKeywords.slice(0, 3).join(", ")}`);
  } else if (keywordMatches >= 3) {
    score += 20;
    reasons.push(`Good keyword match: ${matchedKeywords.join(", ")}`);
  } else if (keywordMatches >= 1) {
    score += 10;
    reasons.push(`Keyword match: ${matchedKeywords.join(", ")}`);
  }

  // 3. Size/Budget Fit (max 20 points)
  const budgetRange = BUDGET_SIZE_MAP[brand.budget_per_creator];
  const preferredSizes = brand.preferred_creator_size || [];

  let sizeMatch = false;
  for (const size of preferredSizes) {
    const range = SIZE_RANGES[size];
    if (range && creator.followers >= range.min && creator.followers <= range.max) {
      sizeMatch = true;
      break;
    }
  }

  if (sizeMatch) {
    score += 20;
    reasons.push("Matches preferred creator size");
  } else if (budgetRange && creator.followers >= budgetRange.min && creator.followers <= budgetRange.max) {
    score += 12;
    reasons.push("Within budget range");
  }

  // 4. Engagement Quality (max 15 points)
  const engagement = creator.engagement_rate || 0;

  if (engagement >= 5) {
    score += 15;
    reasons.push("Excellent engagement rate");
  } else if (engagement >= 3) {
    score += 10;
    reasons.push("Good engagement rate");
  } else if (engagement >= 1) {
    score += 5;
  }

  // 5. Brand Readiness (max 10 points)
  const readiness = creator.brand_readiness_score || 0;

  if (readiness >= 70) {
    score += 10;
    reasons.push("Highly brand-ready");
  } else if (readiness >= 50) {
    score += 6;
  } else if (readiness >= 30) {
    score += 3;
  }

  // Cap at 100
  score = Math.min(100, score);

  // Calculate grade
  let grade: string;
  if (score >= 85) grade = "A+";
  else if (score >= 75) grade = "A";
  else if (score >= 65) grade = "B+";
  else if (score >= 55) grade = "B";
  else if (score >= 45) grade = "C+";
  else if (score >= 35) grade = "C";
  else grade = "D";

  return { score, grade, reasons: reasons.slice(0, 3) };
}