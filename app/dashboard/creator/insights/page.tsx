import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getNicheLabel } from "@/lib/niches";
import Link from "next/link";

interface CampaignStats {
  totalCampaigns: number;
  totalBudget: number;
  avgBudgetPerCreator: number;
  nicheDistribution: { niche: string; count: number; totalBudget: number }[];
  followerRangeDistribution: { range: string; count: number; percentage: number }[];
  platformDistribution: { platform: string; count: number; percentage: number }[];
  contentStyleDistribution: { style: string; count: number }[];
  topKeywords: { word: string; count: number }[];
  engagementRequirements: { min: number; max: number; avg: number };
}

interface PersonalizedInsights {
  matchingCampaigns: number;
  nicheCampaigns: number;
  nicheAvgBudget: number;
  nichePlatforms: { platform: string; percentage: number }[];
  nicheKeywords: string[];
  competitorCount: number;
  demandTrend: "rising" | "stable" | "declining";
}

function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    "i", "me", "my", "we", "our", "you", "your", "the", "a", "an", "and", "or",
    "but", "in", "on", "at", "to", "for", "of", "with", "by", "from", "is",
    "are", "was", "were", "be", "been", "being", "have", "has", "had", "do",
    "does", "did", "will", "would", "could", "should", "may", "might", "must",
    "that", "which", "who", "this", "these", "those", "am", "not", "looking",
    "want", "need", "like", "love", "someone", "something", "brand", "brands",
    "their", "they", "them", "about", "just", "really", "very", "also", "can",
    "make", "get", "more", "some", "creator", "creators", "content", "campaign",
    "product", "products", "video", "videos", "post", "posts", "great", "good",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  return words;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(0) + "K";
  return num.toString();
}

function getFollowerRangeLabel(min: number, max: number): string {
  if (max <= 10000) return "Nano (1K-10K)";
  if (max <= 50000) return "Micro (10K-50K)";
  if (max <= 100000) return "Mid (50K-100K)";
  if (max <= 500000) return "Macro (100K-500K)";
  return "Mega (500K+)";
}

export default async function CreatorInsightsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    redirect("/onboarding/creator");
  }

  // Get all active campaigns
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  const allCampaigns = campaigns || [];

  // Calculate aggregate stats
  const stats: CampaignStats = {
    totalCampaigns: allCampaigns.length,
    totalBudget: allCampaigns.reduce((sum, c) => sum + (c.budget_total || 0), 0),
    avgBudgetPerCreator:
      allCampaigns.length > 0
        ? Math.round(
            allCampaigns.reduce((sum, c) => sum + (c.budget_per_creator || 0), 0) /
              allCampaigns.filter((c) => c.budget_per_creator).length || 1
          )
        : 0,
    nicheDistribution: [],
    followerRangeDistribution: [],
    platformDistribution: [],
    contentStyleDistribution: [],
    topKeywords: [],
    engagementRequirements: { min: 0, max: 0, avg: 0 },
  };

  // Niche distribution
  const nicheCounts: Record<string, { count: number; totalBudget: number }> = {};
  allCampaigns.forEach((c) => {
    c.target_niches?.forEach((niche: string) => {
      if (!nicheCounts[niche]) {
        nicheCounts[niche] = { count: 0, totalBudget: 0 };
      }
      nicheCounts[niche].count++;
      nicheCounts[niche].totalBudget += c.budget_per_creator || 0;
    });
  });
  stats.nicheDistribution = Object.entries(nicheCounts)
    .map(([niche, data]) => ({ niche, count: data.count, totalBudget: data.totalBudget }))
    .sort((a, b) => b.count - a.count);

  // Follower range distribution
  const followerRanges: Record<string, number> = {
    "Nano (1K-10K)": 0,
    "Micro (10K-50K)": 0,
    "Mid (50K-100K)": 0,
    "Macro (100K-500K)": 0,
    "Mega (500K+)": 0,
  };
  allCampaigns.forEach((c) => {
    const label = getFollowerRangeLabel(c.min_followers || 0, c.max_followers || 0);
    followerRanges[label]++;
  });
  stats.followerRangeDistribution = Object.entries(followerRanges)
    .map(([range, count]) => ({
      range,
      count,
      percentage: allCampaigns.length > 0 ? Math.round((count / allCampaigns.length) * 100) : 0,
    }))
    .filter((r) => r.count > 0);

  // Platform distribution
  const platformCounts: Record<string, number> = {};
  allCampaigns.forEach((c) => {
    c.preferred_platforms?.forEach((platform: string) => {
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });
  });
  stats.platformDistribution = Object.entries(platformCounts)
    .map(([platform, count]) => ({
      platform,
      count,
      percentage: allCampaigns.length > 0 ? Math.round((count / allCampaigns.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Content style distribution
  const styleCounts: Record<string, number> = {};
  allCampaigns.forEach((c) => {
    c.content_style?.forEach((style: string) => {
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });
  });
  stats.contentStyleDistribution = Object.entries(styleCounts)
    .map(([style, count]) => ({ style, count }))
    .sort((a, b) => b.count - a.count);

  // Extract keywords from campaign descriptions
  const keywordCounts: Record<string, number> = {};
  allCampaigns.forEach((c) => {
    const text = [c.ideal_creator_description, c.content_requirements, c.brief]
      .filter(Boolean)
      .join(" ");
    const keywords = extractKeywords(text);
    keywords.forEach((kw) => {
      keywordCounts[kw] = (keywordCounts[kw] || 0) + 1;
    });
  });
  stats.topKeywords = Object.entries(keywordCounts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Engagement requirements
  const engagementRates = allCampaigns
    .map((c) => c.target_engagement_rate)
    .filter((r) => r && r > 0);
  if (engagementRates.length > 0) {
    stats.engagementRequirements = {
      min: Math.min(...engagementRates),
      max: Math.max(...engagementRates),
      avg: Math.round((engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length) * 10) / 10,
    };
  }

  // Personalized insights for this creator
  const creatorNiches = creatorProfile.niche || [];
  const creatorFollowers =
    (creatorProfile.youtube_subscribers || 0) +
    (creatorProfile.tiktok_followers || 0) +
    (creatorProfile.instagram_followers || 0);

  // Find campaigns matching creator's criteria
  const matchingCampaigns = allCampaigns.filter((c) => {
    const minF = c.min_followers || 0;
    const maxF = c.max_followers || 10000000;
    return creatorFollowers >= minF && creatorFollowers <= maxF;
  });

  // Find campaigns in creator's niches
  const nicheCampaigns = allCampaigns.filter((c) =>
    c.target_niches?.some((n: string) => creatorNiches.includes(n))
  );

  // Calculate niche-specific insights
  const nicheAvgBudget =
    nicheCampaigns.length > 0
      ? Math.round(
          nicheCampaigns.reduce((sum, c) => sum + (c.budget_per_creator || 0), 0) /
            nicheCampaigns.filter((c) => c.budget_per_creator).length || 1
        )
      : 0;

  const nichePlatformCounts: Record<string, number> = {};
  nicheCampaigns.forEach((c) => {
    c.preferred_platforms?.forEach((p: string) => {
      nichePlatformCounts[p] = (nichePlatformCounts[p] || 0) + 1;
    });
  });
  const nichePlatforms = Object.entries(nichePlatformCounts)
    .map(([platform, count]) => ({
      platform,
      percentage: nicheCampaigns.length > 0 ? Math.round((count / nicheCampaigns.length) * 100) : 0,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Extract niche-specific keywords
  const nicheKeywordCounts: Record<string, number> = {};
  nicheCampaigns.forEach((c) => {
    const text = [c.ideal_creator_description, c.content_requirements, c.brief]
      .filter(Boolean)
      .join(" ");
    extractKeywords(text).forEach((kw) => {
      nicheKeywordCounts[kw] = (nicheKeywordCounts[kw] || 0) + 1;
    });
  });
  const nicheKeywords = Object.entries(nicheKeywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  // Get creator count in same niches (for competition insight)
  // Use a different approach since overlaps might not work as expected
  const { data: allCreators } = await supabase
    .from("creator_profiles")
    .select("niche");

  const competitorCount = allCreators?.filter((cp) => {
    if (!cp.niche || !Array.isArray(cp.niche)) return false;
    return cp.niche.some((n: string) => creatorNiches.includes(n));
  }).length || 0;

  const personalizedInsights: PersonalizedInsights = {
    matchingCampaigns: matchingCampaigns.length,
    nicheCampaigns: nicheCampaigns.length,
    nicheAvgBudget,
    nichePlatforms,
    nicheKeywords,
    competitorCount,
    demandTrend: nicheCampaigns.length >= 3 ? "rising" : nicheCampaigns.length >= 1 ? "stable" : "declining",
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            💡 Market Insights
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Real-time data on what brands are looking for. Use this to optimize your profile and content.
          </p>
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[var(--color-accent)]">{stats.totalCampaigns}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Active Campaigns</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              ${stats.avgBudgetPerCreator > 0 ? stats.avgBudgetPerCreator.toLocaleString() : "—"}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Avg Budget/Creator</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-blue-500">{stats.nicheDistribution.length}</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Niches in Demand</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-purple-500">
              {stats.engagementRequirements.avg > 0 ? `${stats.engagementRequirements.avg}%` : "—"}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">Avg Min Engagement</p>
          </div>
        </div>

        {/* Personalized Insights Card */}
        {creatorNiches.length > 0 && (
          <div className="bg-gradient-to-r from-[var(--color-accent)]/10 to-purple-500/10 border border-[var(--color-accent)]/20 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="text-3xl">🎯</div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  Your Niche: {creatorNiches.map((n) => getNicheLabel(n)).join(", ")}
                </h2>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-2xl font-bold text-[var(--color-accent)]">
                      {personalizedInsights.nicheCampaigns}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Active campaigns in your niche
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-500">
                      ${personalizedInsights.nicheAvgBudget > 0 ? personalizedInsights.nicheAvgBudget.toLocaleString() : "—"}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Avg budget in your niche
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-500">
                      {personalizedInsights.matchingCampaigns}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Campaigns you qualify for
                    </p>
                  </div>
                </div>

                {personalizedInsights.nichePlatforms.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-1">
                      Most requested platforms in your niche:
                    </p>
                    <div className="flex gap-2">
                      {personalizedInsights.nichePlatforms.slice(0, 3).map((p) => (
                        <span
                          key={p.platform}
                          className="px-3 py-1 rounded-full text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
                        >
                          {p.platform.charAt(0).toUpperCase() + p.platform.slice(1)} ({p.percentage}%)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {personalizedInsights.nicheKeywords.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-1">
                      Brands in your niche are looking for:
                    </p>
                    <p className="text-sm text-[var(--color-text-primary)]">
                      "{personalizedInsights.nicheKeywords.slice(0, 6).join('", "')}"
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-4 mt-4">
                  <Link
                    href="/dashboard/creator/opportunities"
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
                  >
                    View Matching Campaigns →
                  </Link>
                  {personalizedInsights.competitorCount > 0 && (
                    <span className="text-sm text-[var(--color-text-tertiary)]">
                      {personalizedInsights.competitorCount} creators in your niche
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Hot Niches */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              🔥 Hot Niches
              <span className="text-xs text-[var(--color-text-tertiary)] font-normal">
                (by campaign count)
              </span>
            </h3>
            {stats.nicheDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.nicheDistribution.slice(0, 8).map((niche, i) => {
                  const isYourNiche = creatorNiches.includes(niche.niche);
                  const maxCount = stats.nicheDistribution[0]?.count || 1;
                  const percentage = Math.round((niche.count / maxCount) * 100);
                  const avgBudget = niche.count > 0 ? Math.round(niche.totalBudget / niche.count) : 0;

                  return (
                    <div key={niche.niche}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isYourNiche ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                          {isYourNiche && "⭐ "}
                          {getNicheLabel(niche.niche)}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {niche.count} campaigns
                          {avgBudget > 0 && ` • ~$${avgBudget}/creator`}
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isYourNiche ? "bg-[var(--color-accent)]" : "bg-blue-500"}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--color-text-tertiary)]">No campaign data yet</p>
            )}
          </div>

          {/* Demand by Follower Range */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              📊 Demand by Creator Size
            </h3>
            {stats.followerRangeDistribution.length > 0 ? (
              <div className="space-y-3">
                {stats.followerRangeDistribution.map((range) => {
                  const isYourRange =
                    (range.range === "Nano (1K-10K)" && creatorFollowers >= 1000 && creatorFollowers < 10000) ||
                    (range.range === "Micro (10K-50K)" && creatorFollowers >= 10000 && creatorFollowers < 50000) ||
                    (range.range === "Mid (50K-100K)" && creatorFollowers >= 50000 && creatorFollowers < 100000) ||
                    (range.range === "Macro (100K-500K)" && creatorFollowers >= 100000 && creatorFollowers < 500000) ||
                    (range.range === "Mega (500K+)" && creatorFollowers >= 500000);

                  return (
                    <div key={range.range}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isYourRange ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                          {isYourRange && "⭐ "}
                          {range.range}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {range.percentage}% of campaigns
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isYourRange ? "bg-[var(--color-accent)]" : "bg-green-500"}`}
                          style={{ width: `${range.percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--color-text-tertiary)]">No campaign data yet</p>
            )}

            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Your followers: <strong>{formatNumber(creatorFollowers)}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Platform & Content Style */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Most Requested Platforms */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
              📱 Most Requested Platforms
            </h3>
            {stats.platformDistribution.length > 0 ? (
              <div className="space-y-2">
                {stats.platformDistribution.map((platform, i) => {
                  const icons: Record<string, string> = {
                    youtube: "🎬",
                    tiktok: "📱",
                    instagram: "📸",
                    twitch: "🎮",
                  };
                  const hasAccount =
                    (platform.platform === "youtube" && creatorProfile.youtube_channel_id) ||
                    (platform.platform === "tiktok" && creatorProfile.tiktok_handle) ||
                    (platform.platform === "instagram" && creatorProfile.instagram_handle) ||
                    (platform.platform === "twitch" && creatorProfile.twitch_handle);

                  return (
                    <div
                      key={platform.platform}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        hasAccount ? "bg-green-500/10" : "bg-[var(--color-bg-tertiary)]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{icons[platform.platform] || "📌"}</span>
                        <span className="font-medium text-[var(--color-text-primary)] capitalize">
                          {platform.platform}
                        </span>
                        {hasAccount && (
                          <span className="text-xs text-green-500">✓ Connected</span>
                        )}
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        {platform.percentage}% of campaigns
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[var(--color-text-tertiary)]">No campaign data yet</p>
            )}
          </div>

          {/* Content Styles in Demand */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
              🎨 Content Styles in Demand
            </h3>
            {stats.contentStyleDistribution.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.contentStyleDistribution.map((style) => (
                  <span
                    key={style.style}
                    className="px-3 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]"
                  >
                    <span className="capitalize">{style.style}</span>
                    <span className="ml-2 text-xs text-[var(--color-text-tertiary)]">
                      {style.count}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[var(--color-text-tertiary)]">No campaign data yet</p>
            )}
          </div>
        </div>

        {/* What Brands Are Saying */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-8">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
            💬 What Brands Are Looking For
            <span className="text-xs text-[var(--color-text-tertiary)] font-normal ml-2">
              (extracted from campaign descriptions)
            </span>
          </h3>
          {stats.topKeywords.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {stats.topKeywords.map((kw, i) => {
                const maxCount = stats.topKeywords[0]?.count || 1;
                const ratio = kw.count / maxCount;
                const size = ratio > 0.7 ? "text-lg" : ratio > 0.4 ? "text-base" : "text-sm";
                const opacity = ratio > 0.7 ? "opacity-100" : ratio > 0.4 ? "opacity-80" : "opacity-60";

                return (
                  <span
                    key={kw.word}
                    className={`px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] ${size} ${opacity}`}
                  >
                    {kw.word}
                  </span>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--color-text-tertiary)]">No keyword data yet</p>
          )}
        </div>

        {/* Tips Section */}
        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-6">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            💡 Tips Based on Market Data
          </h3>
          <div className="space-y-3">
            {stats.platformDistribution[0] &&
              !creatorProfile.youtube_channel_id &&
              stats.platformDistribution[0].platform === "youtube" && (
                <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                  <span className="text-xl">🎬</span>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">Connect YouTube</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      {stats.platformDistribution[0].percentage}% of campaigns want YouTube creators.
                      Connect your channel to unlock more opportunities.
                    </p>
                  </div>
                </div>
              )}

            {(stats.followerRangeDistribution.find((r) => r.range === "Micro (10K-50K)")?.percentage || 0) > 30 && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <span className="text-xl">📈</span>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Micro creators are in demand</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Brands love authentic creators with 10K-50K followers.
                    {creatorFollowers < 10000
                      ? " Focus on growing to this range for more opportunities."
                      : creatorFollowers < 50000
                      ? " You're in the sweet spot!"
                      : " Consider your unique value as a larger creator."}
                  </p>
                </div>
              </div>
            )}

            {stats.topKeywords.slice(0, 3).some((kw) => kw.word === "authentic") && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <span className="text-xl">✨</span>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Authenticity matters</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Brands frequently mention wanting "authentic" creators.
                    Make sure your bio and content showcase your genuine personality.
                  </p>
                </div>
              </div>
            )}

            {personalizedInsights.nicheCampaigns === 0 && creatorNiches.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <span className="text-xl">🎯</span>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Consider expanding your niches</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    No active campaigns in your current niches. Check out hot niches like{" "}
                    {stats.nicheDistribution
                      .slice(0, 3)
                      .map((n) => getNicheLabel(n.niche))
                      .join(", ")}{" "}
                    to see if any align with your content.
                  </p>
                </div>
              </div>
            )}

            {/* Default tip if no specific tips apply */}
            {stats.totalCampaigns === 0 && (
              <div className="flex items-start gap-3 p-3 bg-[var(--color-bg-secondary)] rounded-lg">
                <span className="text-xl">📋</span>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">Market data is building</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    As brands create more campaigns, you'll see detailed insights about what they're looking for.
                    In the meantime, complete your profile to be ready when opportunities come!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
