import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function CreatorDashboard() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user data from our database
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

  // Get creator profile
  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  // Calculate total followers from profile
  const totalFollowers = profile
    ? (profile.tiktok_followers || 0) +
      (profile.instagram_followers || 0) +
      (profile.youtube_subscribers || 0) +
      (profile.twitter_followers || 0)
    : 0;

  // Get brand activity stats
  const { count: unlockCount } = await supabase
    .from("unlocks")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", profile?.id);

  const { count: watchlistCount } = await supabase
    .from("watchlist_items")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", profile?.id);

  // Mock some stats for now
  const stats = {
    score: 74,
    followers: totalFollowers,
    growth: 15.2,
    engagement: 7.1,
    profileViews: 12,
    watchlistAdds: watchlistCount || 0,
    unlocks: unlockCount || 0,
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back, {user.firstName || "Creator"}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Here's how you're doing
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Your Creator Score
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-6xl font-bold text-[var(--color-text-primary)]">
              {stats.score}
            </div>
            <div>
              <div className="text-xl text-[var(--color-text-secondary)]">/100</div>
              <div className="text-green-500 text-sm mt-1">Ready for brand deals</div>
            </div>
          </div>
          <div className="mt-4 bg-[var(--color-bg-tertiary)] rounded-full h-3">
            <div 
              className="bg-[var(--color-accent)] h-3 rounded-full transition-all" 
              style={{ width: `${stats.score}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-text-tertiary)] text-sm">Followers</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.followers.toLocaleString()}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-text-tertiary)] text-sm">Monthly Growth</p>
            <p className="text-3xl font-bold text-green-500 mt-1">
              +{stats.growth}%
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <p className="text-[var(--color-text-tertiary)] text-sm">Engagement Rate</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.engagement}%
            </p>
          </div>
        </div>

        {/* Brand Activity */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Brand Activity This Month
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">
                {stats.profileViews}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Profile Views</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">
                {stats.watchlistAdds}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Watchlist Adds</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">
                {stats.unlocks}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Unlocks</p>
            </div>
          </div>
        </div>

        {/* Quick Tip */}
        <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-xl p-6">
          <h2 className="text-[var(--color-accent)] font-medium mb-2">💡 This Week's Insight</h2>
          <p className="text-[var(--color-text-secondary)]">
            Your engagement rate is strong ({stats.engagement}%) but you're posting less than similar creators. 
            Creators in your niche who post 4x/week grow 2.3x faster.
          </p>
        </div>

      </div>
    </div>
  );
}
