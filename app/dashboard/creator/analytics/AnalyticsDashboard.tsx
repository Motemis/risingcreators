"use client";

import { useState, type JSX } from "react";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  niche: string[] | null;
  
  // YouTube
  youtube_subscribers: number | null;
  youtube_views: number | null;
  youtube_watch_time_hours: number | null;
  youtube_avg_view_duration: number | null;
  youtube_ctr: number | null;
  youtube_impressions: number | null;
  youtube_engagement_rate: number | null;
  
  // TikTok
  tiktok_followers: number | null;
  tiktok_views: number | null;
  tiktok_likes: number | null;
  tiktok_shares: number | null;
  tiktok_engagement_rate: number | null;
  
  // Instagram
  instagram_followers: number | null;
  instagram_reach: number | null;
  instagram_impressions: number | null;
  instagram_engagement_rate: number | null;
  instagram_avg_likes: number | null;
  
  // Twitch
  twitch_followers: number | null;
  twitch_subscribers: number | null;
  twitch_avg_viewers: number | null;
  twitch_peak_viewers: number | null;
  twitch_watch_time_hours: number | null;
  
  // Twitter
  twitter_followers: number | null;
  twitter_impressions: number | null;
  twitter_engagement_rate: number | null;
  
  // Pinterest
  pinterest_followers: number | null;
  pinterest_monthly_views: number | null;
  pinterest_engagement_rate: number | null;
  
  // Spotify
  spotify_monthly_listeners: number | null;
  spotify_followers: number | null;
  
  // Aggregates
  total_followers: number | null;
  total_engagement_rate: number | null;
  follower_growth_7d: number | null;
  follower_growth_30d: number | null;
  follower_growth_90d: number | null;
  last_synced_at: string | null;
  
  // Audience Demographics
  audience_age_13_17: number | null;
  audience_age_18_24: number | null;
  audience_age_25_34: number | null;
  audience_age_35_44: number | null;
  audience_age_45_plus: number | null;
  audience_male: number | null;
  audience_female: number | null;
  audience_top_countries: { country: string; percent: number }[] | null;
  
  // Calculated Engagement Metrics
  view_to_follower_ratio: number | null;
  like_to_view_ratio: number | null;
  comment_to_view_ratio: number | null;
  share_rate: number | null;
  save_rate: number | null;
  
  // Content Metrics
  avg_watch_time_seconds: number | null;
  audience_retention_rate: number | null;
  posts_per_week: number | null;
  best_posting_hour: number | null;
  best_posting_day: string | null;
  consistency_score: number | null;
  
  // Viral/Quality Metrics
  viral_post_count: number | null;
  avg_post_performance: number | null;
  
  // Brand Value Metrics
  estimated_cpm: number | null;
  estimated_post_value: number | null;
  audience_quality_score: number | null;
  
  // Trending
  is_trending: boolean | null;
}

interface Snapshot {
  snapshot_date: string;
  total_followers: number | null;
  total_views: number | null;
  youtube_subscribers: number | null;
  tiktok_followers: number | null;
  instagram_followers: number | null;
}

interface Benchmarks {
  avg_engagement_rate: number | null;
  avg_growth_rate: number | null;
  avg_views_per_post: number | null;
}

interface Post {
  id: string;
  platform: string;
  thumbnail_url: string | null;
  caption: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
}

function formatNumber(num: number | null | undefined): string {
  if (!num) return "—";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

function formatPercent(num: number | null | undefined): string {
  if (num === null || num === undefined) return "—";
  return num.toFixed(1) + "%";
}

function formatDuration(seconds: number | null): string {
  if (!seconds) return "—";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatHour(hour: number | null): string {
  if (hour === null) return "—";
  const ampm = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 || 12;
  return `${h}:00 ${ampm}`;
}

function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    youtube: "🎬",
    tiktok: "📱",
    instagram: "📸",
    twitch: "🎮",
    twitter: "🐦",
    pinterest: "📌",
    spotify: "🎧",
  };
  return icons[platform.toLowerCase()] || "📊";
}

function getScoreColor(score: number | null, thresholds: { good: number; ok: number }): string {
  if (score === null) return "text-[var(--color-text-tertiary)]";
  if (score >= thresholds.good) return "text-green-500";
  if (score >= thresholds.ok) return "text-yellow-500";
  return "text-red-500";
}

function getGrowthIndicator(value: number | null): JSX.Element | null {
  if (value === null) return null;
  if (value > 0) {
    return <span className="text-green-500">↑ +{formatPercent(value)}</span>;
  } else if (value < 0) {
    return <span className="text-red-500">↓ {formatPercent(value)}</span>;
  }
  return <span className="text-[var(--color-text-tertiary)]">→ 0%</span>;
}

export default function AnalyticsDashboard({
  profile,
  snapshots,
  benchmarks,
  topPosts,
}: {
  profile: CreatorProfile;
  snapshots: Snapshot[];
  benchmarks: Benchmarks | null;
  topPosts: Post[];
}) {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "engagement" | "audience" | "content">("overview");

  // Calculate totals
  const totalFollowers =
    (profile.youtube_subscribers || 0) +
    (profile.tiktok_followers || 0) +
    (profile.instagram_followers || 0) +
    (profile.twitch_followers || 0) +
    (profile.twitter_followers || 0) +
    (profile.pinterest_followers || 0) +
    (profile.spotify_followers || 0);

  const totalViews =
    (profile.youtube_views || 0) +
    (profile.tiktok_views || 0) +
    (profile.instagram_impressions || 0);

  // Get growth rate based on selected time range
  const growthRate = timeRange === "7d" 
    ? profile.follower_growth_7d 
    : timeRange === "30d" 
    ? profile.follower_growth_30d 
    : profile.follower_growth_90d;

  // Calculate average engagement across platforms
  const engagementRates = [
    profile.youtube_engagement_rate,
    profile.tiktok_engagement_rate,
    profile.instagram_engagement_rate,
  ].filter((r) => r !== null) as number[];
  
  const avgEngagement = engagementRates.length > 0
    ? engagementRates.reduce((a, b) => a + b, 0) / engagementRates.length
    : null;

  // Connected platforms
  const platforms = [
    { name: "YouTube", key: "youtube", connected: !!profile.youtube_subscribers, followers: profile.youtube_subscribers, color: "text-red-500" },
    { name: "TikTok", key: "tiktok", connected: !!profile.tiktok_followers, followers: profile.tiktok_followers, color: "text-[#00f2ea]" },
    { name: "Instagram", key: "instagram", connected: !!profile.instagram_followers, followers: profile.instagram_followers, color: "text-pink-500" },
    { name: "Twitch", key: "twitch", connected: !!profile.twitch_followers, followers: profile.twitch_followers, color: "text-purple-500" },
    { name: "Twitter", key: "twitter", connected: !!profile.twitter_followers, followers: profile.twitter_followers, color: "text-blue-400" },
    { name: "Pinterest", key: "pinterest", connected: !!profile.pinterest_followers, followers: profile.pinterest_followers, color: "text-red-600" },
    { name: "Spotify", key: "spotify", connected: !!profile.spotify_followers, followers: profile.spotify_followers, color: "text-green-500" },
  ].filter((p) => p.connected);

  // Calculate viral posts from topPosts
  const avgViews = topPosts.length > 0 
    ? topPosts.reduce((sum, p) => sum + (p.views || 0), 0) / topPosts.length 
    : 0;
  const viralPosts = topPosts.filter((p) => (p.views || 0) > avgViews * 2);

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Analytics</h1>
              {profile.is_trending && (
                <span className="px-2 py-1 bg-orange-500/10 text-orange-500 text-xs font-medium rounded-full">
                  🔥 Trending
                </span>
              )}
            </div>
            <p className="text-[var(--color-text-secondary)]">
              Track your performance across all platforms
            </p>
          </div>
          
          {/* Time Range Selector */}
          <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] rounded-lg p-1 border border-[var(--color-border)]">
            {(["7d", "30d", "90d"] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  timeRange === range
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {range === "7d" ? "7 Days" : range === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 border-b border-[var(--color-border)]">
          {[
            { key: "overview", label: "Overview" },
            { key: "engagement", label: "Engagement" },
            { key: "audience", label: "Audience" },
            { key: "content", label: "Content" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as typeof activeTab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[var(--color-accent)] text-[var(--color-accent)]"
                  : "border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <>
            {/* Key Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Total Followers</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {formatNumber(totalFollowers)}
                </p>
                <div className="mt-1">{getGrowthIndicator(growthRate)}</div>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Total Views</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {formatNumber(totalViews)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">Lifetime</p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Avg Engagement</p>
                <p className={`text-3xl font-bold ${getScoreColor(avgEngagement, { good: 5, ok: 2 })}`}>
                  {formatPercent(avgEngagement)}
                </p>
                {benchmarks?.avg_engagement_rate && (
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                    vs {formatPercent(benchmarks.avg_engagement_rate)} avg
                  </p>
                )}
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Est. Post Value</p>
                <p className="text-3xl font-bold text-green-500">
                  {profile.estimated_post_value ? `$${formatNumber(profile.estimated_post_value)}` : "—"}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  CPM: {profile.estimated_cpm ? `$${profile.estimated_cpm.toFixed(2)}` : "—"}
                </p>
              </div>
            </div>

            {/* Growth Chart */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[var(--color-text-primary)]">Follower Growth</h2>
                <div className="flex gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-tertiary)]">7d:</span>
                    {getGrowthIndicator(profile.follower_growth_7d)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-tertiary)]">30d:</span>
                    {getGrowthIndicator(profile.follower_growth_30d)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--color-text-tertiary)]">90d:</span>
                    {getGrowthIndicator(profile.follower_growth_90d)}
                  </div>
                </div>
              </div>
              
              {snapshots.length > 1 ? (
                <div className="h-48">
                  <div className="flex items-end justify-between h-40 border-b border-[var(--color-border)] gap-1">
                    {snapshots.slice(-14).map((snapshot, i) => {
                      const maxFollowers = Math.max(...snapshots.map((s) => s.total_followers || 0));
                      const height = maxFollowers > 0
                        ? ((snapshot.total_followers || 0) / maxFollowers) * 100
                        : 0;

                      return (
                        <div
                          key={i}
                          className="flex-1 bg-[var(--color-accent)] rounded-t hover:bg-[var(--color-accent-hover)] transition-colors cursor-pointer group relative"
                          style={{ height: `${Math.max(height, 5)}%` }}
                        >
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border)] px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            {formatNumber(snapshot.total_followers)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-[var(--color-text-tertiary)] mt-2 overflow-hidden">
                    {snapshots.slice(-14).map((snapshot, i) => (
                      <span key={i} className="flex-1 text-center truncate">
                        {new Date(snapshot.snapshot_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-[var(--color-text-tertiary)]">
                  <div className="text-center">
                    <p className="text-4xl mb-2">📊</p>
                    <p>Not enough data yet</p>
                    <p className="text-sm">Check back in a few days</p>
                  </div>
                </div>
              )}
            </div>

            {/* Platform Breakdown */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Platform Breakdown</h2>
              
              {platforms.length > 0 ? (
                <div className="space-y-4">
                  {platforms.map((platform) => {
                    const percent = totalFollowers > 0 
                      ? ((platform.followers || 0) / totalFollowers) * 100 
                      : 0;
                    
                    return (
                      <div key={platform.key}>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span>{getPlatformIcon(platform.key)}</span>
                            <span className="text-[var(--color-text-primary)] font-medium">{platform.name}</span>
                          </div>
                          <span className={`font-semibold ${platform.color}`}>
                            {formatNumber(platform.followers)}
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-accent)] rounded-full transition-all"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          {percent.toFixed(1)}% of total
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-4xl mb-3">📱</p>
                  <p className="text-[var(--color-text-secondary)] mb-2">No platforms connected</p>
                  <a
                    href="/dashboard/creator/profile"
                    className="inline-block px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
                  >
                    Connect Accounts
                  </a>
                </div>
              )}
            </div>
          </>
        )}

        {/* ENGAGEMENT TAB */}
        {activeTab === "engagement" && (
          <>
            {/* Engagement Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Avg Engagement Rate</p>
                <p className={`text-3xl font-bold ${getScoreColor(avgEngagement, { good: 5, ok: 2 })}`}>
                  {formatPercent(avgEngagement)}
                </p>
                {benchmarks?.avg_engagement_rate && (
                  <p className={`text-sm mt-1 ${(avgEngagement || 0) > benchmarks.avg_engagement_rate ? "text-green-500" : "text-yellow-500"}`}>
                    {(avgEngagement || 0) > benchmarks.avg_engagement_rate ? "Above" : "Below"} niche avg
                  </p>
                )}
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">View-to-Follower</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.view_to_follower_ratio, { good: 30, ok: 15 })}`}>
                  {formatPercent(profile.view_to_follower_ratio)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  % of followers watching
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Like-to-View</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.like_to_view_ratio, { good: 8, ok: 4 })}`}>
                  {formatPercent(profile.like_to_view_ratio)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Content quality signal
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Comment-to-View</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.comment_to_view_ratio, { good: 2, ok: 0.5 })}`}>
                  {formatPercent(profile.comment_to_view_ratio)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Community engagement
                </p>
              </div>
            </div>

            {/* Platform Engagement Breakdown */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              {profile.youtube_subscribers && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎬</span>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">YouTube Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Engagement Rate</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatPercent(profile.youtube_engagement_rate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Click-Through Rate</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatPercent(profile.youtube_ctr)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Avg View Duration</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {profile.youtube_avg_view_duration ? `${profile.youtube_avg_view_duration.toFixed(1)}m` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Impressions</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.youtube_impressions)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile.tiktok_followers && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📱</span>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">TikTok Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Engagement Rate</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatPercent(profile.tiktok_engagement_rate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Total Likes</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.tiktok_likes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Shares</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.tiktok_shares)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Share Rate</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatPercent(profile.share_rate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile.instagram_followers && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📸</span>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Instagram Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Engagement Rate</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatPercent(profile.instagram_engagement_rate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Reach</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.instagram_reach)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Avg Likes</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.instagram_avg_likes)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Save Rate</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatPercent(profile.save_rate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {profile.twitch_followers && (
                <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">🎮</span>
                    <h3 className="font-semibold text-[var(--color-text-primary)]">Twitch Engagement</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Avg Viewers</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.twitch_avg_viewers)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Peak Viewers</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.twitch_peak_viewers)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Subscribers</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.twitch_subscribers)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-tertiary)]">Watch Time</p>
                      <p className="text-xl font-bold text-[var(--color-text-primary)]">
                        {formatNumber(profile.twitch_watch_time_hours)}h
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Benchmarks */}
            {benchmarks && (
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">How You Compare</h2>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-secondary)]">Engagement Rate</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--color-text-primary)] font-semibold">
                        {formatPercent(avgEngagement)}
                      </span>
                      <span className="text-[var(--color-text-tertiary)]">
                        vs {formatPercent(benchmarks.avg_engagement_rate)} niche avg
                      </span>
                      {(avgEngagement || 0) > (benchmarks.avg_engagement_rate || 0) ? (
                        <span className="text-green-500 text-sm px-2 py-0.5 bg-green-500/10 rounded-full">Above avg</span>
                      ) : (
                        <span className="text-yellow-500 text-sm px-2 py-0.5 bg-yellow-500/10 rounded-full">Below avg</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-b border-[var(--color-border)]">
                    <span className="text-[var(--color-text-secondary)]">Growth Rate ({timeRange})</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--color-text-primary)] font-semibold">
                        {formatPercent(growthRate)}
                      </span>
                      <span className="text-[var(--color-text-tertiary)]">
                        vs {formatPercent(benchmarks.avg_growth_rate)} niche avg
                      </span>
                      {(growthRate || 0) > (benchmarks.avg_growth_rate || 0) ? (
                        <span className="text-green-500 text-sm px-2 py-0.5 bg-green-500/10 rounded-full">Above avg</span>
                      ) : (
                        <span className="text-yellow-500 text-sm px-2 py-0.5 bg-yellow-500/10 rounded-full">Below avg</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3">
                    <span className="text-[var(--color-text-secondary)]">Avg Views per Post</span>
                    <div className="flex items-center gap-4">
                      <span className="text-[var(--color-text-primary)] font-semibold">
                        {formatNumber(profile.avg_post_performance)}
                      </span>
                      <span className="text-[var(--color-text-tertiary)]">
                        vs {formatNumber(benchmarks.avg_views_per_post)} niche avg
                      </span>
                      {(profile.avg_post_performance || 0) > (benchmarks.avg_views_per_post || 0) ? (
                        <span className="text-green-500 text-sm px-2 py-0.5 bg-green-500/10 rounded-full">Above avg</span>
                      ) : (
                        <span className="text-yellow-500 text-sm px-2 py-0.5 bg-yellow-500/10 rounded-full">Below avg</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* AUDIENCE TAB */}
        {activeTab === "audience" && (
          <>
            {/* Audience Quality */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Audience Quality</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.audience_quality_score, { good: 80, ok: 60 })}`}>
                  {profile.audience_quality_score || "—"}/100
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Real follower score
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Audience Retention</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.audience_retention_rate, { good: 50, ok: 30 })}`}>
                  {formatPercent(profile.audience_retention_rate)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Avg watch completion
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Avg Watch Time</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {formatDuration(profile.avg_watch_time_seconds)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Per video
                </p>
              </div>
            </div>

            {/* Demographics */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Age Distribution */}
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Age Distribution</h3>
                {(profile.audience_age_18_24 || profile.audience_age_25_34) ? (
                  <div className="space-y-3">
                    {[
                      { label: "13-17", value: profile.audience_age_13_17 },
                      { label: "18-24", value: profile.audience_age_18_24 },
                      { label: "25-34", value: profile.audience_age_25_34 },
                      { label: "35-44", value: profile.audience_age_35_44 },
                      { label: "45+", value: profile.audience_age_45_plus },
                    ].map((age) => (
                      <div key={age.label}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[var(--color-text-secondary)]">{age.label}</span>
                          <span className="text-[var(--color-text-primary)] font-medium">
                            {formatPercent(age.value)}
                          </span>
                        </div>
                        <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-accent)] rounded-full"
                            style={{ width: `${age.value || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                    <p>Demographics data not available</p>
                    <p className="text-sm">Connect platform APIs to see audience breakdown</p>
                  </div>
                )}
              </div>

              {/* Gender Distribution */}
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Gender Distribution</h3>
                {(profile.audience_male || profile.audience_female) ? (
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">Male</span>
                        <span className="text-[var(--color-text-primary)] font-medium">
                          {formatPercent(profile.audience_male)}
                        </span>
                      </div>
                      <div className="h-4 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${profile.audience_male || 0}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-[var(--color-text-secondary)]">Female</span>
                        <span className="text-[var(--color-text-primary)] font-medium">
                          {formatPercent(profile.audience_female)}
                        </span>
                      </div>
                      <div className="h-4 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-pink-500 rounded-full"
                          style={{ width: `${profile.audience_female || 0}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                    <p>Gender data not available</p>
                  </div>
                )}

                {/* Top Countries */}
                {profile.audience_top_countries && profile.audience_top_countries.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
                    <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">Top Countries</h4>
                    <div className="space-y-2">
                      {profile.audience_top_countries.slice(0, 5).map((country, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span className="text-[var(--color-text-secondary)]">{country.country}</span>
                          <span className="text-[var(--color-text-primary)]">{country.percent}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* CONTENT TAB */}
        {activeTab === "content" && (
          <>
            {/* Content Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Posts per Week</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.posts_per_week, { good: 3, ok: 1 })}`}>
                  {profile.posts_per_week?.toFixed(1) || "—"}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Avg posting frequency
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Consistency Score</p>
                <p className={`text-3xl font-bold ${getScoreColor(profile.consistency_score, { good: 80, ok: 50 })}`}>
                  {profile.consistency_score || "—"}/100
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  How regularly you post
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Viral Posts</p>
                <p className="text-3xl font-bold text-orange-500">
                  {profile.viral_post_count || viralPosts.length}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Posts above 2x avg
                </p>
              </div>

              <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
                <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Avg Performance</p>
                <p className="text-3xl font-bold text-[var(--color-text-primary)]">
                  {formatNumber(profile.avg_post_performance || avgViews)}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Views per post
                </p>
              </div>
            </div>

            {/* Best Times to Post */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Best Times to Post</h3>
              {(profile.best_posting_hour !== null || profile.best_posting_day) ? (
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-2">Best Time</p>
                    <p className="text-2xl font-bold text-[var(--color-accent)]">
                      {formatHour(profile.best_posting_hour)}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Your audience is most active
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-2">Best Day</p>
                    <p className="text-2xl font-bold text-[var(--color-accent)]">
                      {profile.best_posting_day || "—"}
                    </p>
                    <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                      Highest engagement day
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                  <p>Not enough posting data to analyze</p>
                  <p className="text-sm">Keep posting consistently to unlock insights</p>
                </div>
              )}
            </div>

            {/* Top Performing Content */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
              <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Top Performing Content</h3>
              {topPosts.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {topPosts.slice(0, 10).map((post, i) => {
                    const isViral = (post.views || 0) > avgViews * 2;
                    
                    return (
                      <div key={post.id} className="group relative">
                        <div className="relative aspect-video rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] mb-2">
                          {post.thumbnail_url ? (
                            <img
                              src={post.thumbnail_url}
                              alt={post.caption || "Post"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              {getPlatformIcon(post.platform)}
                            </div>
                          )}
                          
                          {/* Rank badge */}
                          <div className="absolute top-1 left-1 w-5 h-5 bg-black/70 rounded-full flex items-center justify-center text-xs text-white font-bold">
                            {i + 1}
                          </div>
                          
                          {/* Viral badge */}
                          {isViral && (
                            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-orange-500 rounded text-xs text-white font-medium">
                              🔥 Viral
                            </div>
                          )}
                          
                          {/* Platform badge */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                            {getPlatformIcon(post.platform)}
                          </div>
                        </div>
                        <p className="text-sm text-[var(--color-text-primary)] line-clamp-1">
                          {post.caption || "Untitled"}
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {formatNumber(post.views)} views • {formatNumber(post.likes)} likes
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--color-text-tertiary)]">
                  <p className="text-4xl mb-3">📹</p>
                  <p>No content synced yet</p>
                  <p className="text-sm">Connect your accounts to see performance data</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* Last Synced */}
        <p className="text-center text-xs text-[var(--color-text-tertiary)] mt-6">
          {profile.last_synced_at 
            ? `Last synced: ${new Date(profile.last_synced_at).toLocaleString()}`
            : "Data syncs automatically every 6 hours"}
        </p>
      </div>
    </div>
  );
}
