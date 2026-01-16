import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculateEnhancedMatchScore } from "@/lib/categorize";
import CreatorCard from "./CreatorCard";

export default async function BrandDiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{ 
    niche?: string; 
    minFollowers?: string; 
    maxFollowers?: string; 
    search?: string; 
    sort?: string;
    minEngagement?: string;
    platform?: string;
    trending?: string;
  }>;
}) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    redirect("/");
  }

  // Get brand profile to check premium status
  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  const isPremium =
    brandProfile?.is_premium &&
    (!brandProfile.premium_until ||
      new Date(brandProfile.premium_until) > new Date());

  // Get filters
  const nicheFilter = params.niche || "";
  const minFollowers = parseInt(params.minFollowers || "0");
  const maxFollowers = parseInt(params.maxFollowers || "10000000");
  const searchQuery = params.search || "";
  const sortBy = params.sort || ((brandProfile?.onboarding_completed || brandProfile?.last_analyzed_at) ? "match" : "brand_readiness");
  const minEngagement = parseFloat(params.minEngagement || "0");
  const platformFilter = params.platform || "";
  const trendingOnly = params.trending === "true";

  // Fetch claimed creators (from creator_profiles)
  let claimedQuery = supabase
    .from("creator_profiles")
    .select(`
      *,
      user:users(*)
    `)
    .eq("is_public", true);

  // Apply filters to claimed creators
  if (minEngagement > 0) {
    claimedQuery = claimedQuery.gte("total_engagement_rate", minEngagement);
  }
  if (trendingOnly) {
    claimedQuery = claimedQuery.eq("is_trending", true);
  }

  // Fetch discovered creators (unhidden only)
  let discoveredQuery = supabase
    .from("discovered_creators")
    .select("*")
    .eq("is_hidden", false)
    .eq("status", "active")
    .is("claimed_by", null);

  // Apply follower filters
  discoveredQuery = discoveredQuery
    .gte("followers", minFollowers)
    .lte("followers", maxFollowers);

  // Apply niche filter
  if (nicheFilter) {
    discoveredQuery = discoveredQuery.contains("niche", [nicheFilter]);
  }

  // Apply platform filter
  if (platformFilter) {
    discoveredQuery = discoveredQuery.eq("platform", platformFilter);
  }

  // Apply engagement filter
  if (minEngagement > 0) {
    discoveredQuery = discoveredQuery.gte("engagement_rate", minEngagement);
  }

  // Apply trending filter
  if (trendingOnly) {
    discoveredQuery = discoveredQuery.eq("is_trending", true);
  }

  // Apply search to discovered (only if premium)
  if (searchQuery && isPremium) {
    discoveredQuery = discoveredQuery.or(
      `display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`
    );
  }

  // Apply sort
  if (sortBy === "match") {
    discoveredQuery = discoveredQuery.order("brand_readiness_score", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (sortBy === "brand_readiness") {
    discoveredQuery = discoveredQuery.order("brand_readiness_score", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (sortBy === "rising_score") {
    discoveredQuery = discoveredQuery.order("rising_score", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (sortBy === "followers") {
    discoveredQuery = discoveredQuery.order("followers", { ascending: false });
  } else if (sortBy === "growth") {
    discoveredQuery = discoveredQuery.order("growth_rate_7d", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (sortBy === "engagement") {
    discoveredQuery = discoveredQuery.order("engagement_rate", {
      ascending: false,
      nullsFirst: false,
    });
  } else if (sortBy === "value") {
    discoveredQuery = discoveredQuery.order("estimated_post_value", {
      ascending: false,
      nullsFirst: false,
    });
  }

  discoveredQuery = discoveredQuery.limit(200);

  const [{ data: claimedCreators }, { data: discoveredCreators }] = await Promise.all([
    claimedQuery,
    discoveredQuery,
  ]);

  // Merge and format creators for display
  const allCreators = [
    // Claimed creators first
    ...(claimedCreators || []).map((profile) => ({
      id: profile.id,
      type: "claimed" as const,
      display_name: profile.display_name || profile.user?.first_name || "Creator",
      profile_image_url: profile.profile_photo_url,
      bio: profile.bio,
      location: profile.location,
      niche: profile.niche,
      followers: (profile.tiktok_followers || 0) + (profile.instagram_followers || 0) + (profile.youtube_subscribers || 0) + (profile.twitter_followers || 0),
      youtube_subscribers: profile.youtube_subscribers,
      tiktok_followers: profile.tiktok_followers,
      instagram_followers: profile.instagram_followers,
      rising_score: null,
      growth_rate_7d: profile.follower_growth_7d,
      growth_rate_30d: profile.follower_growth_30d,
      platform: "multi",
      engagement_rate: profile.total_engagement_rate,
      brand_readiness_score: null,
      estimated_reach_monthly: null,
      consistency_score: profile.consistency_score,
      authenticity_score: profile.audience_quality_score,
      // New analytics fields
      is_trending: profile.is_trending,
      estimated_post_value: profile.estimated_post_value,
      estimated_cpm: profile.estimated_cpm,
      audience_quality_score: profile.audience_quality_score,
      viral_post_count: profile.viral_post_count,
      view_to_follower_ratio: profile.view_to_follower_ratio,
    })),
    // Discovered creators
    ...(discoveredCreators || []).map((creator) => ({
      id: creator.id,
      type: "discovered" as const,
      display_name: creator.display_name,
      profile_image_url: creator.profile_image_url,
      bio: creator.bio,
      location: creator.location,
      niche: creator.niche,
      followers: creator.followers,
      youtube_subscribers: creator.platform === "youtube" ? creator.followers : 0,
      tiktok_followers: creator.platform === "tiktok" ? creator.followers : 0,
      instagram_followers: creator.platform === "instagram" ? creator.followers : 0,
      rising_score: creator.rising_score,
      growth_rate_7d: creator.growth_rate_7d,
      growth_rate_30d: creator.growth_rate_30d,
      platform: creator.platform,
      platform_user_id: creator.platform_user_id,
      engagement_rate: creator.engagement_rate,
      brand_readiness_score: creator.brand_readiness_score,
      estimated_reach_monthly: creator.estimated_reach_monthly,
      consistency_score: creator.consistency_score,
      authenticity_score: creator.authenticity_score,
      // New analytics fields
      is_trending: creator.is_trending,
      estimated_post_value: creator.estimated_post_value,
      estimated_cpm: creator.estimated_cpm,
      audience_quality_score: creator.audience_quality_score,
      viral_post_count: creator.viral_post_count,
      view_to_follower_ratio: creator.view_to_follower_ratio,
    })),
  ];

  // Calculate match scores if brand has completed onboarding
  const creatorsWithMatch = allCreators.map((creator) => {
    if (brandProfile?.onboarding_completed || brandProfile?.last_analyzed_at) {
      const match = calculateEnhancedMatchScore(brandProfile as any, {
        niche: creator.niche,
        followers: creator.followers,
        engagement_rate: creator.engagement_rate || null,
        brand_readiness_score: creator.brand_readiness_score || null,
        avg_views: creator.estimated_reach_monthly ? Math.round(creator.estimated_reach_monthly / 4) : null,
        shorts_percentage: null,
        bio: creator.bio,
        display_name: creator.display_name,
      });
      return { ...creator, matchScore: match.score, matchGrade: match.grade, matchReasons: match.reasons };
    }
    return { ...creator, matchScore: null, matchGrade: null, matchReasons: [] };
  });

  // Sort based on selection
  let sortedCreators = [...creatorsWithMatch];
  if (sortBy === "match") {
    if (brandProfile?.onboarding_completed || brandProfile?.last_analyzed_at) {
      sortedCreators.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    } else {
      sortedCreators.sort((a, b) => (b.brand_readiness_score || 0) - (a.brand_readiness_score || 0));
    }
  } else if (sortBy === "brand_readiness") {
    sortedCreators.sort((a, b) => (b.brand_readiness_score || 0) - (a.brand_readiness_score || 0));
  } else if (sortBy === "rising_score") {
    sortedCreators.sort((a, b) => (b.rising_score || 0) - (a.rising_score || 0));
  } else if (sortBy === "followers") {
    sortedCreators.sort((a, b) => b.followers - a.followers);
  } else if (sortBy === "growth") {
    sortedCreators.sort((a, b) => (b.growth_rate_7d || 0) - (a.growth_rate_7d || 0));
  } else if (sortBy === "engagement") {
    sortedCreators.sort((a, b) => (b.engagement_rate || 0) - (a.engagement_rate || 0));
  } else if (sortBy === "value") {
    sortedCreators.sort((a, b) => (b.estimated_post_value || 0) - (a.estimated_post_value || 0));
  }

  // Limit to 50 results AFTER sorting
  sortedCreators = sortedCreators.slice(0, 50);

  // Get unique niches for filter dropdown
  const allNiches = [
    "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
    "Travel", "Gaming", "Finance", "Education", "Entertainment",
    "Music", "Sports", "Parenting", "Pets"
  ];

  // Count trending creators
  const trendingCount = allCreators.filter(c => c.is_trending).length;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Discover Creators
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Find rising creators to partner with
            </p>
          </div>

          {/* Premium Status / Upgrade CTA */}
          {isPremium ? (
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500">
              <span className="text-green-500 font-medium">Premium Active</span>
            </div>
          ) : (
            <Link
              href="/dashboard/brand/upgrade"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--color-accent)] text-white font-medium hover:bg-[var(--color-accent-hover)]"
            >
              Upgrade to Premium
            </Link>
          )}
        </div>

        {/* Premium Banner for Free Users */}
        {!isPremium && (
          <div className="bg-gradient-to-r from-[var(--color-accent)] to-purple-600 rounded-xl p-6 mb-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">
                  Unlock Full Creator Analytics
                </h2>
                <p className="text-white/80">
                  See creator names, detailed metrics, engagement rates, and contact info.
                </p>
              </div>
              <Link
                href="/dashboard/brand/upgrade"
                className="px-6 py-3 bg-white text-[var(--color-accent)] rounded-lg font-semibold hover:bg-white/90"
              >
                Upgrade Now — $99/mo
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{allCreators.length}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Total Creators</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">{trendingCount}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Trending Now</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-500">
              {allCreators.filter(c => (c.engagement_rate || 0) >= 5).length}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">High Engagement (5%+)</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-500">
              {allCreators.filter(c => (c.growth_rate_7d || 0) >= 5).length}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Fast Growing (5%+/wk)</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 mb-6">
          <form className="space-y-4">
            {/* Row 1: Search and Basic Filters */}
            <div className="flex flex-wrap gap-4">
              {/* Search - only show for premium */}
              {isPremium && (
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    name="search"
                    defaultValue={searchQuery}
                    placeholder="Search by name, bio..."
                    className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                  />
                </div>
              )}

              <select
                name="niche"
                defaultValue={nicheFilter}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="">All Niches</option>
                {allNiches.map((niche) => (
                  <option key={niche} value={niche}>
                    {niche}
                  </option>
                ))}
              </select>

              <select
                name="platform"
                defaultValue={platformFilter}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="">All Platforms</option>
                <option value="youtube">YouTube</option>
                <option value="tiktok">TikTok</option>
                <option value="instagram">Instagram</option>
                <option value="twitch">Twitch</option>
              </select>

              <select
                name="sort"
                defaultValue={sortBy}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="match">Sort: Best Match</option>
                <option value="brand_readiness">Sort: Brand Ready</option>
                <option value="rising_score">Sort: Rising Stars</option>
                <option value="followers">Sort: Most Followers</option>
                <option value="growth">Sort: Fastest Growing</option>
                <option value="engagement">Sort: Highest Engagement</option>
                <option value="value">Sort: Best Value</option>
              </select>
            </div>

            {/* Row 2: Advanced Filters */}
            <div className="flex flex-wrap gap-4 pt-3 border-t border-[var(--color-border)]">
              <select
                name="minFollowers"
                defaultValue={minFollowers || ""}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="0">Min Followers: Any</option>
                <option value="1000">Min: 1K</option>
                <option value="10000">Min: 10K</option>
                <option value="50000">Min: 50K</option>
                <option value="100000">Min: 100K</option>
              </select>

              <select
                name="maxFollowers"
                defaultValue={maxFollowers || ""}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="10000000">Max Followers: Any</option>
                <option value="10000">Max: 10K</option>
                <option value="50000">Max: 50K</option>
                <option value="100000">Max: 100K</option>
                <option value="500000">Max: 500K</option>
              </select>

              <select
                name="minEngagement"
                defaultValue={minEngagement || ""}
                className="px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="0">Min Engagement: Any</option>
                <option value="2">Min: 2%</option>
                <option value="5">Min: 5%</option>
                <option value="8">Min: 8%</option>
                <option value="10">Min: 10%</option>
              </select>

              <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] cursor-pointer hover:bg-[var(--color-bg-tertiary)]">
                <input
                  type="checkbox"
                  name="trending"
                  value="true"
                  defaultChecked={trendingOnly}
                  className="rounded border-[var(--color-border-strong)]"
                />
                <span className="text-[var(--color-text-primary)] text-sm">Trending Only</span>
              </label>

              <button
                type="submit"
                className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Results Count */}
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {sortedCreators.length} creators found
          {(brandProfile?.onboarding_completed || brandProfile?.last_analyzed_at) && sortBy === "match" && " • Sorted by your brand match"}
          {trendingOnly && ` • Showing trending creators only`}
        </p>

        {/* Creator Grid */}
        {sortedCreators.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCreators.map((creator) => (
              <CreatorCard
                key={`${creator.type}-${creator.id}`}
                creator={creator}
                isPremium={isPremium}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[var(--color-text-secondary)]">
              No creators found matching your criteria.
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
              Try adjusting your filters
            </p>
          </div>
        )}
      </div>
    </div>
  );
}