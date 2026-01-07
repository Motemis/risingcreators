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