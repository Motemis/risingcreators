import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function GrowthPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user and profile
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  // If user doesn't exist, redirect to onboarding
  if (!dbUser || !dbUser.onboarded) {
    redirect("/onboarding");
  }

  // Verify user is a creator
  if (dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  const totalFollowers = profile
    ? (profile.tiktok_followers || 0) +
      (profile.instagram_followers || 0) +
      (profile.youtube_subscribers || 0) +
      (profile.twitter_followers || 0)
    : 0;

  // Mock data for now
  const stats = {
    currentFollowers: totalFollowers,
    lastMonthFollowers: Math.round(totalFollowers * 0.87),
    growthRate: 15.2,
    percentile: 85,
    engagementRate: 7.1,
    avgEngagement: 5.2,
    postsPerWeek: 2.1,
    avgPostsPerWeek: 3.4,
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">My Growth</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Track your progress and see how you compare
          </p>
        </div>

        {/* Growth Chart Placeholder */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Follower Growth
          </h2>
          <div className="flex items-end justify-between h-40 border-b border-[var(--color-border)] mb-4">
            {/* Simple bar chart placeholder */}
            <div className="flex items-end gap-2 h-full w-full">
              {[40, 45, 42, 55, 60, 65, 70, 75, 85, 90, 95, 100].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-[var(--color-accent)] rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-[var(--color-text-tertiary)] text-sm">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-text-tertiary)] text-sm">Current Followers</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.currentFollowers.toLocaleString()}
            </p>
            <p className="text-green-500 text-sm mt-2">
              +{(stats.currentFollowers - stats.lastMonthFollowers).toLocaleString()} this month
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-text-tertiary)] text-sm">Monthly Growth Rate</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              +{stats.growthRate}%
            </p>
            <p className="text-[var(--color-text-secondary)] text-sm mt-2">
              Top {100 - stats.percentile}% in your niche
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            How You Compare
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">Monthly Growth</span>
              <div className="flex items-center gap-4">
                <span className="text-[var(--color-text-primary)] font-semibold">{stats.growthRate}%</span>
                <span className="text-[var(--color-text-tertiary)]">vs {stats.avgEngagement}% avg</span>
                <span className="text-green-500 text-sm">✓ Ahead</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-[var(--color-border)]">
              <span className="text-[var(--color-text-secondary)]">Engagement Rate</span>
              <div className="flex items-center gap-4">
                <span className="text-[var(--color-text-primary)] font-semibold">{stats.engagementRate}%</span>
                <span className="text-[var(--color-text-tertiary)]">vs {stats.avgEngagement}% avg</span>
                <span className="text-green-500 text-sm">✓ Ahead</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-[var(--color-text-secondary)]">Posts per Week</span>
              <div className="flex items-center gap-4">
                <span className="text-[var(--color-text-primary)] font-semibold">{stats.postsPerWeek}</span>
                <span className="text-[var(--color-text-tertiary)]">vs {stats.avgPostsPerWeek} avg</span>
                <span className="text-red-500 text-sm">✗ Behind</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
