export interface SubNiche {
  value: string;
  label: string;
}

export interface NicheCategory {
  value: string;
  label: string;
  icon: string;
  subNiches?: SubNiche[];
}

export const NICHE_CATEGORIES: NicheCategory[] = [
  {
    value: "gaming",
    label: "Gaming",
    icon: "🎮",
    subNiches: [
      { value: "pc_gaming", label: "PC Gaming" },
      { value: "console_gaming", label: "Console Gaming" },
      { value: "mobile_gaming", label: "Mobile Gaming" },
      { value: "rpg", label: "RPGs" },
      { value: "fps", label: "FPS/Shooters" },
      { value: "sports_games", label: "Sports Games" },
      { value: "streaming", label: "Live Streaming" },
      { value: "esports", label: "Esports" },
      { value: "game_reviews", label: "Game Reviews" },
      { value: "retro_gaming", label: "Retro Gaming" },
      { value: "gaming_other", label: "Other Gaming" },
    ],
  },
  {
    value: "tech",
    label: "Tech",
    icon: "💻",
    subNiches: [
      { value: "smartphones", label: "Smartphones" },
      { value: "laptops_pcs", label: "Laptops & PCs" },
      { value: "smart_home", label: "Smart Home" },
      { value: "software", label: "Software & Apps" },
      { value: "ai_tech", label: "AI & Emerging Tech" },
      { value: "tech_reviews", label: "Tech Reviews" },
      { value: "coding", label: "Coding & Dev" },
      { value: "gadgets", label: "Gadgets" },
      { value: "tech_other", label: "Other Tech" },
    ],
  },
  {
    value: "fitness",
    label: "Fitness",
    icon: "💪",
    subNiches: [
      { value: "weightlifting", label: "Weightlifting" },
      { value: "cardio", label: "Cardio & Running" },
      { value: "yoga", label: "Yoga & Flexibility" },
      { value: "crossfit", label: "CrossFit" },
      { value: "home_workouts", label: "Home Workouts" },
      { value: "bodybuilding", label: "Bodybuilding" },
      { value: "sports_training", label: "Sports Training" },
      { value: "nutrition", label: "Nutrition & Diet" },
      { value: "fitness_other", label: "Other Fitness" },
    ],
  },
  {
    value: "beauty",
    label: "Beauty",
    icon: "💄",
    subNiches: [
      { value: "makeup", label: "Makeup" },
      { value: "skincare", label: "Skincare" },
      { value: "haircare", label: "Haircare" },
      { value: "nails", label: "Nails" },
      { value: "beauty_reviews", label: "Product Reviews" },
      { value: "beauty_tutorials", label: "Tutorials" },
      { value: "clean_beauty", label: "Clean/Natural Beauty" },
      { value: "beauty_other", label: "Other Beauty" },
    ],
  },
  {
    value: "fashion",
    label: "Fashion",
    icon: "👗",
    subNiches: [
      { value: "streetwear", label: "Streetwear" },
      { value: "luxury", label: "Luxury Fashion" },
      { value: "sustainable", label: "Sustainable Fashion" },
      { value: "mens_fashion", label: "Men's Fashion" },
      { value: "womens_fashion", label: "Women's Fashion" },
      { value: "thrift", label: "Thrift & Vintage" },
      { value: "sneakers", label: "Sneakers" },
      { value: "accessories", label: "Accessories" },
      { value: "fashion_other", label: "Other Fashion" },
    ],
  },
  {
    value: "food",
    label: "Food",
    icon: "🍳",
    subNiches: [
      { value: "recipes", label: "Recipes" },
      { value: "restaurant_reviews", label: "Restaurant Reviews" },
      { value: "baking", label: "Baking" },
      { value: "healthy_eating", label: "Healthy Eating" },
      { value: "vegan", label: "Vegan/Vegetarian" },
      { value: "meal_prep", label: "Meal Prep" },
      { value: "food_travel", label: "Food Travel" },
      { value: "cocktails", label: "Cocktails & Drinks" },
      { value: "food_other", label: "Other Food" },
    ],
  },
  {
    value: "travel",
    label: "Travel",
    icon: "✈️",
    subNiches: [
      { value: "adventure", label: "Adventure Travel" },
      { value: "luxury_travel", label: "Luxury Travel" },
      { value: "budget_travel", label: "Budget Travel" },
      { value: "solo_travel", label: "Solo Travel" },
      { value: "family_travel", label: "Family Travel" },
      { value: "travel_tips", label: "Travel Tips" },
      { value: "digital_nomad", label: "Digital Nomad" },
      { value: "road_trips", label: "Road Trips" },
      { value: "travel_other", label: "Other Travel" },
    ],
  },
  {
    value: "sports",
    label: "Sports",
    icon: "⚽",
    subNiches: [
      { value: "golf", label: "Golf" },
      { value: "basketball", label: "Basketball" },
      { value: "football", label: "Football" },
      { value: "soccer", label: "Soccer" },
      { value: "tennis", label: "Tennis" },
      { value: "baseball", label: "Baseball" },
      { value: "hockey", label: "Hockey" },
      { value: "mma", label: "MMA/Boxing" },
      { value: "extreme_sports", label: "Extreme Sports" },
      { value: "outdoor_sports", label: "Outdoor/Adventure" },
      { value: "sports_other", label: "Other Sports" },
    ],
  },
  {
    value: "finance",
    label: "Finance",
    icon: "💰",
    subNiches: [
      { value: "investing", label: "Investing" },
      { value: "crypto", label: "Crypto" },
      { value: "personal_finance", label: "Personal Finance" },
      { value: "real_estate", label: "Real Estate" },
      { value: "budgeting", label: "Budgeting" },
      { value: "side_hustles", label: "Side Hustles" },
      { value: "retirement", label: "Retirement Planning" },
      { value: "finance_other", label: "Other Finance" },
    ],
  },
  {
    value: "education",
    label: "Education",
    icon: "📚",
    subNiches: [
      { value: "tutorials", label: "Tutorials" },
      { value: "online_courses", label: "Online Courses" },
      { value: "study_tips", label: "Study Tips" },
      { value: "language_learning", label: "Language Learning" },
      { value: "science", label: "Science" },
      { value: "history", label: "History" },
      { value: "career_advice", label: "Career Advice" },
      { value: "education_other", label: "Other Education" },
    ],
  },
  {
    value: "entertainment",
    label: "Entertainment",
    icon: "🎬",
    subNiches: [
      { value: "movie_reviews", label: "Movie Reviews" },
      { value: "tv_shows", label: "TV Shows" },
      { value: "celebrity_news", label: "Celebrity News" },
      { value: "comedy", label: "Comedy" },
      { value: "reactions", label: "Reactions" },
      { value: "podcasts", label: "Podcasts" },
      { value: "entertainment_other", label: "Other Entertainment" },
    ],
  },
  {
    value: "music",
    label: "Music",
    icon: "🎵",
    subNiches: [
      { value: "music_production", label: "Music Production" },
      { value: "covers", label: "Covers" },
      { value: "original_music", label: "Original Music" },
      { value: "music_reviews", label: "Music Reviews" },
      { value: "instruments", label: "Instruments" },
      { value: "dj", label: "DJ/Electronic" },
      { value: "music_other", label: "Other Music" },
    ],
  },
  {
    value: "lifestyle",
    label: "Lifestyle",
    icon: "✨",
    subNiches: [
      { value: "daily_vlogs", label: "Daily Vlogs" },
      { value: "minimalism", label: "Minimalism" },
      { value: "productivity", label: "Productivity" },
      { value: "self_improvement", label: "Self Improvement" },
      { value: "home_decor", label: "Home Decor" },
      { value: "organization", label: "Organization" },
      { value: "lifestyle_other", label: "Other Lifestyle" },
    ],
  },
  {
    value: "parenting",
    label: "Parenting",
    icon: "👶",
    subNiches: [
      { value: "pregnancy", label: "Pregnancy" },
      { value: "newborn", label: "Newborn Care" },
      { value: "toddlers", label: "Toddlers" },
      { value: "school_age", label: "School Age" },
      { value: "teen_parenting", label: "Teen Parenting" },
      { value: "family_activities", label: "Family Activities" },
      { value: "parenting_other", label: "Other Parenting" },
    ],
  },
  {
    value: "pets",
    label: "Pets",
    icon: "🐕",
    subNiches: [
      { value: "dogs", label: "Dogs" },
      { value: "cats", label: "Cats" },
      { value: "exotic_pets", label: "Exotic Pets" },
      { value: "pet_training", label: "Pet Training" },
      { value: "pet_care", label: "Pet Care" },
      { value: "pets_other", label: "Other Pets" },
    ],
  },
  {
    value: "diy",
    label: "DIY & Crafts",
    icon: "🔨",
    subNiches: [
      { value: "home_improvement", label: "Home Improvement" },
      { value: "woodworking", label: "Woodworking" },
      { value: "crafts", label: "Crafts" },
      { value: "sewing", label: "Sewing" },
      { value: "upcycling", label: "Upcycling" },
      { value: "diy_other", label: "Other DIY" },
    ],
  },
  {
    value: "auto",
    label: "Automotive",
    icon: "🚗",
    subNiches: [
      { value: "car_reviews", label: "Car Reviews" },
      { value: "motorcycles", label: "Motorcycles" },
      { value: "car_mods", label: "Car Mods" },
      { value: "detailing", label: "Detailing" },
      { value: "ev", label: "Electric Vehicles" },
      { value: "auto_other", label: "Other Automotive" },
    ],
  },
  {
    value: "health",
    label: "Health & Wellness",
    icon: "🧘",
    subNiches: [
      { value: "mental_health", label: "Mental Health" },
      { value: "meditation", label: "Meditation" },
      { value: "alternative_health", label: "Alternative Health" },
      { value: "womens_health", label: "Women's Health" },
      { value: "mens_health", label: "Men's Health" },
      { value: "health_other", label: "Other Health" },
    ],
  },
  {
    value: "other",
    label: "Other",
    icon: "📌",
    subNiches: [],
  },
];

export function getAllNiches(): string[] {
  const niches: string[] = [];
  NICHE_CATEGORIES.forEach((cat) => {
    niches.push(cat.value);
    cat.subNiches?.forEach((sub) => niches.push(sub.value));
  });
  return niches;
}

export function getNicheLabel(value: string): string {
  // Check if it's a custom niche
  if (value.startsWith("custom:")) {
    return value.replace("custom:", "");
  }
  
  for (const cat of NICHE_CATEGORIES) {
    if (cat.value === value) return cat.label;
    const sub = cat.subNiches?.find((s) => s.value === value);
    if (sub) return sub.label;
  }
  return value;
}
