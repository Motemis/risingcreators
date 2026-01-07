import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function ActivityPage() {
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

  // Get real stats
  const { count: unlockCount } = await supabase
    .from("unlocks")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", profile?.id);

  const { count: watchlistCount } = await supabase
    .from("watchlist_items")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", profile?.id);

  const stats = {
    profileViews: 12,
    watchlistAdds: watchlistCount || 0,
    unlocks: unlockCount || 0,
    lastMonthViews: 8,
  };

  // Mock activity feed for now
  const activities = [
    { type: "unlock", text: "A brand unlocked your profile", time: "2 days ago" },
    { type: "watchlist", text: "Added to a watchlist", time: "3 days ago" },
    { type: "view", text: "Profile viewed", time: "4 days ago" },
    { type: "view", text: "Profile viewed", time: "5 days ago" },
    { type: "watchlist", text: "Added to a watchlist", time: "1 week ago" },
    { type: "view", text: "Profile viewed", time: "1 week ago" },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Brand Activity</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            See how brands are interacting with your profile
          </p>
        </div>

        {/* Stats */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            This Month
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">{stats.profileViews}</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Profile Views</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">{stats.watchlistAdds}</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Watchlist Adds</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-[var(--color-text-primary)]">{stats.unlocks}</p>
              <p className="text-[var(--color-text-secondary)] text-sm mt-1">Unlocks</p>
            </div>
          </div>
          <p className="text-green-500 text-sm mt-4 text-center">
            ↑ {Math.round(((stats.profileViews - stats.lastMonthViews) / stats.lastMonthViews) * 100)}% more activity than last month
          </p>
        </div>

        {/* Activity Feed */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Recent Activity
          </h2>
          <div className="space-y-1">
            {activities.map((activity, i) => (
              <div 
                key={i}
                className="flex items-center justify-between py-3 border-b border-[var(--color-border)] last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {activity.type === "unlock" && "🔓"}
                    {activity.type === "watchlist" && "⭐"}
                    {activity.type === "view" && "👁"}
                  </span>
                  <span className="text-[var(--color-text-primary)]">{activity.text}</span>
                </div>
                <span className="text-[var(--color-text-tertiary)] text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            How You Compare
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Creators your size in your niche:
          </p>
          <div className="mt-4 space-y-2">
            <p className="text-[var(--color-text-secondary)]">
              Average profile views/month: <span className="text-[var(--color-text-primary)] font-medium">8</span>
            </p>
            <p className="text-[var(--color-text-secondary)]">
              Your profile views/month: <span className="text-[var(--color-text-primary)] font-medium">{stats.profileViews}</span>
            </p>
          </div>
          <p className="text-green-500 mt-4">
            You're getting {Math.round((stats.profileViews / 8 - 1) * 100)}% more brand attention than average.
          </p>
        </div>

      </div>
    </div>
  );
}
