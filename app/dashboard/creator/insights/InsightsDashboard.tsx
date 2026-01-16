"use client";

import { useState } from "react";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  niche: string[] | null;
  bio: string | null;
  
  youtube_subscribers: number | null;
  youtube_views: number | null;
  youtube_engagement_rate: number | null;
  
  tiktok_followers: number | null;
  tiktok_views: number | null;
  tiktok_engagement_rate: number | null;
  
  instagram_followers: number | null;
  instagram_engagement_rate: number | null;
  
  total_followers: number | null;
  total_engagement_rate: number | null;
  follower_growth_7d: number | null;
  follower_growth_30d: number | null;
  
  posts_per_week: number | null;
  consistency_score: number | null;
  viral_post_count: number | null;
  avg_post_performance: number | null;
  estimated_post_value: number | null;
  
  best_posting_hour: number | null;
  best_posting_day: string | null;
}

interface Snapshot {
  snapshot_date: string;
  total_followers: number | null;
  total_views: number | null;
}

interface Benchmarks {
  avg_engagement_rate: number | null;
  avg_growth_rate: number | null;
  avg_views_per_post: number | null;
}

interface Post {
  id: string;
  platform: string;
  caption: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
}

interface Insight {
  id: string;
  insight_type: string;
  title: string;
  content: string;
  priority: number;
  created_at: string;
}

function formatNumber(num: number | null | undefined): string {
  if (!num) return "0";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toLocaleString();
}

// Group insights by date
function groupInsightsByDate(insights: Insight[]): Record<string, Insight[]> {
  return insights.reduce((acc, insight) => {
    const date = new Date(insight.created_at).toLocaleDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(insight);
    return acc;
  }, {} as Record<string, Insight[]>);
}

// Parse stored insight content
function parseInsightContent(content: string): any {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export default function InsightsDashboard({
  profile,
  snapshots,
  benchmarks,
  topPosts,
  previousInsights,
  followerTier,
  insightsToday = 0,
  maxInsightsPerDay = 2,
}: {
  profile: CreatorProfile;
  snapshots: Snapshot[];
  benchmarks: Benchmarks | null;
  topPosts: Post[];
  previousInsights: Insight[];
  followerTier: string;
  insightsToday?: number;
  maxInsightsPerDay?: number;
}) {
  const [generating, setGenerating] = useState(false);
  const [insights, setInsights] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());
  const [localInsightsToday, setLocalInsightsToday] = useState(insightsToday);

  const totalFollowers =
    (profile.youtube_subscribers || 0) +
    (profile.tiktok_followers || 0) +
    (profile.instagram_followers || 0);

  const avgEngagement =
    profile.total_engagement_rate ||
    ((profile.youtube_engagement_rate || 0) +
      (profile.tiktok_engagement_rate || 0) +
      (profile.instagram_engagement_rate || 0)) / 3;

  const canGenerateMore = localInsightsToday < maxInsightsPerDay;
  const remainingInsights = maxInsightsPerDay - localInsightsToday;

  const generateInsights = async () => {
    if (!canGenerateMore) {
      setError(`You've reached your daily limit of ${maxInsightsPerDay} insights. Come back tomorrow!`);
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/creator/generate-insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profileId: profile.id,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate insights");
      }

      setInsights(data.insights);
      setLocalInsightsToday(prev => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate insights");
    }

    setGenerating(false);
  };

  const toggleDate = (date: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(date)) {
      newExpanded.delete(date);
    } else {
      newExpanded.add(date);
    }
    setExpandedDates(newExpanded);
  };

  // Calculate quick stats
  const isAboveAvgEngagement = benchmarks?.avg_engagement_rate 
    ? avgEngagement > benchmarks.avg_engagement_rate 
    : null;
  
  const isAboveAvgGrowth = benchmarks?.avg_growth_rate 
    ? (profile.follower_growth_30d || 0) > benchmarks.avg_growth_rate 
    : null;

  const getHealthScore = () => {
    let score = 50;
    if (isAboveAvgEngagement) score += 15;
    if (isAboveAvgGrowth) score += 15;
    if ((profile.consistency_score || 0) >= 70) score += 10;
    if ((profile.viral_post_count || 0) > 0) score += 10;
    return Math.min(100, score);
  };

  const healthScore = getHealthScore();
  const groupedInsights = groupInsightsByDate(previousInsights);

  // Render parsed insight content
  const renderInsightContent = (parsedContent: any) => {
    if (!parsedContent) return null;

    return (
      <div className="space-y-4">
        {/* Summary */}
        {parsedContent.summary && (
          <div>
            <p className="text-[var(--color-text-secondary)] leading-relaxed">
              {parsedContent.summary}
            </p>
          </div>
        )}

        {/* Strengths */}
        {parsedContent.strengths && parsedContent.strengths.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-green-500 mb-2">Strengths</p>
            <ul className="space-y-1">
              {parsedContent.strengths.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-green-500 mt-0.5">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {parsedContent.improvements && parsedContent.improvements.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-yellow-500 mb-2">Areas to Improve</p>
            <ul className="space-y-1">
              {parsedContent.improvements.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                  <span className="text-yellow-500 mt-0.5">→</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Items */}
        {parsedContent.actionItems && parsedContent.actionItems.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--color-accent)] mb-2">Action Items</p>
            <div className="space-y-2">
              {parsedContent.actionItems.map((item: any, i: number) => (
                <div key={i} className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                  <p className="font-medium text-sm text-[var(--color-text-primary)]">{item.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{item.description}</p>
                  {item.metric && (
                    <p className="text-xs text-[var(--color-accent)] mt-1">{item.metric}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Ideas */}
        {parsedContent.contentIdeas && parsedContent.contentIdeas.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-purple-500 mb-2">Content Ideas</p>
            <div className="grid gap-2">
              {parsedContent.contentIdeas.map((idea: any, i: number) => (
                <div key={i} className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm text-[var(--color-text-primary)]">{idea.title}</p>
                    {idea.format && (
                      <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-500 rounded-full">
                        {idea.format}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{idea.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Best Times */}
        {parsedContent.bestTimes && (
          <div className="mt-4 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg">
            <p className="text-sm font-medium text-blue-500 mb-1">Best Times to Post</p>
            <p className="text-sm text-[var(--color-text-secondary)]">{parsedContent.bestTimes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">AI Insights</h1>
            <p className="text-[var(--color-text-secondary)]">
              Personalized recommendations to grow your channel
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={generateInsights}
              disabled={generating || !canGenerateMore}
              className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {generating ? (
                <>
                  <span className="animate-spin">⚡</span>
                  Analyzing...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate New Insights
                </>
              )}
            </button>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              {canGenerateMore 
                ? `${remainingInsights} of ${maxInsightsPerDay} remaining today`
                : "Daily limit reached"
              }
            </p>
          </div>
        </div>

        {/* Health Score Card */}
        <div className="bg-gradient-to-r from-[var(--color-accent)] to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Channel Health Score</p>
              <p className="text-4xl font-bold">{healthScore}/100</p>
              <p className="text-white/80 text-sm mt-2">
                {healthScore >= 80 ? "Excellent! Your channel is performing great." :
                 healthScore >= 60 ? "Good progress! Room for improvement." :
                 "Let's work on boosting your metrics."}
              </p>
            </div>
            <div className="text-right">
              <p className="text-white/80 text-sm">Your Tier</p>
              <p className="text-2xl font-bold capitalize">{followerTier}</p>
              <p className="text-white/80 text-sm mt-1">{formatNumber(totalFollowers)} followers</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Engagement Rate</p>
            <p className={`text-2xl font-bold ${isAboveAvgEngagement ? "text-green-500" : "text-[var(--color-text-primary)]"}`}>
              {avgEngagement?.toFixed(1) || 0}%
            </p>
            {benchmarks?.avg_engagement_rate && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {isAboveAvgEngagement ? "↑ Above" : "↓ Below"} {benchmarks.avg_engagement_rate.toFixed(1)}% avg
              </p>
            )}
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">30d Growth</p>
            <p className={`text-2xl font-bold ${(profile.follower_growth_30d || 0) > 0 ? "text-green-500" : "text-red-500"}`}>
              {profile.follower_growth_30d ? `${profile.follower_growth_30d > 0 ? "+" : ""}${profile.follower_growth_30d.toFixed(1)}%` : "—"}
            </p>
            {benchmarks?.avg_growth_rate && (
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {isAboveAvgGrowth ? "↑ Above" : "↓ Below"} {benchmarks.avg_growth_rate.toFixed(1)}% avg
              </p>
            )}
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Consistency</p>
            <p className={`text-2xl font-bold ${(profile.consistency_score || 0) >= 70 ? "text-green-500" : "text-yellow-500"}`}>
              {profile.consistency_score || 0}/100
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {profile.posts_per_week?.toFixed(1) || 0} posts/week
            </p>
          </div>

          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Est. Post Value</p>
            <p className="text-2xl font-bold text-green-500">
              ${formatNumber(profile.estimated_post_value || 0)}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Per sponsored post
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {/* AI Generated Insights (Current Session) */}
        {insights && (
          <div className="space-y-6 mb-8">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🤖</span>
                <h2 className="font-semibold text-[var(--color-text-primary)]">Latest Analysis</h2>
                <span className="text-xs text-[var(--color-text-tertiary)]">Just now</span>
              </div>
              {renderInsightContent(insights)}
            </div>
          </div>
        )}

        {/* No Insights Yet */}
        {!insights && !generating && previousInsights.length === 0 && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-12 text-center">
            <p className="text-4xl mb-4">🤖</p>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              Get AI-Powered Insights
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
              Our AI will analyze your channel performance, compare you to similar creators, 
              and give you personalized recommendations to grow faster.
            </p>
            <button
              onClick={generateInsights}
              disabled={!canGenerateMore}
              className="px-6 py-3 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              Generate My Insights
            </button>
          </div>
        )}

        {/* Previous Insights - Collapsible by Date */}
        {previousInsights.length > 0 && (
          <div className="mt-8">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Previous Insights</h2>
            <div className="space-y-3">
              {Object.entries(groupedInsights)
                .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                .map(([date, dateInsights]) => (
                  <div
                    key={date}
                    className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden"
                  >
                    {/* Date Header - Clickable */}
                    <button
                      onClick={() => toggleDate(date)}
                      className="w-full flex items-center justify-between p-4 hover:bg-[var(--color-bg-tertiary)] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">📊</span>
                        <div className="text-left">
                          <p className="font-medium text-[var(--color-text-primary)]">{date}</p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {dateInsights.length} insight{dateInsights.length > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <span className={`text-[var(--color-text-tertiary)] transition-transform ${expandedDates.has(date) ? "rotate-180" : ""}`}>
                        ▼
                      </span>
                    </button>

                    {/* Expanded Content */}
                    {expandedDates.has(date) && (
                      <div className="border-t border-[var(--color-border)]">
                        {dateInsights.map((insight, index) => {
                          const parsedContent = parseInsightContent(insight.content);
                          return (
                            <div
                              key={insight.id}
                              className={`p-4 ${index > 0 ? "border-t border-[var(--color-border)]" : ""}`}
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                  {insight.title}
                                </span>
                                <span className="text-xs text-[var(--color-text-tertiary)]">
                                  {new Date(insight.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              {parsedContent ? (
                                renderInsightContent(parsedContent)
                              ) : (
                                <p className="text-sm text-[var(--color-text-secondary)]">{insight.content}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
