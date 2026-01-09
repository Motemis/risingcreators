import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function BrandDashboard() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get brand user
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  // If user doesn't exist, redirect to onboarding
  if (!dbUser || !dbUser.onboarded) {
    redirect("/onboarding");
  }

  // Verify user is a brand
  if (dbUser.user_type !== "brand") {
    redirect("/");
  }

  // Mock stats for now
  const stats = {
    creatorsViewed: 24,
    watchlistCount: 8,
    unlockedCount: 3,
    campaignsActive: 1,
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back{dbUser.first_name ? `, ${dbUser.first_name}` : ""}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Here's your creator discovery overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">Creators Viewed</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.creatorsViewed}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">In Watchlists</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.watchlistCount}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">Unlocked</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.unlockedCount}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)]">
            <p className="text-[var(--color-text-secondary)] text-sm">Active Campaigns</p>
            <p className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">
              {stats.campaignsActive}
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)] mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/dashboard/brand/discover"
              className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Discover Creators
            </Link>
            <Link
              href="/dashboard/brand/watchlists"
              className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-border)] transition-colors"
            >
              View Watchlists
            </Link>
            <Link
              href="/dashboard/brand/unlocked"
              className="bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-border)] transition-colors"
            >
              Unlocked Creators
            </Link>
          </div>
        </div>

        {/* Tip */}
        <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-xl p-6">
          <h2 className="text-[var(--color-accent)] font-medium mb-2">💡 Tip</h2>
          <p className="text-[var(--color-text-secondary)]">
            Use the Discover page to find rising creators. Add them to watchlists to track their growth, 
            then unlock their contact info when you're ready to reach out.
          </p>
        </div>

      </div>
    </div>
  );
}



