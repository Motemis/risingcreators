import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function InsightsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get unlock count
  const { count: unlockCount } = await supabase
    .from("unlocks")
    .select("*", { count: "exact", head: true })
    .eq("brand_clerk_id", user.id);

  // Get watchlist count
  const { count: watchlistCount } = await supabase
    .from("watchlists")
    .select("*", { count: "exact", head: true })
    .eq("brand_clerk_id", user.id);

  // Get total saved creators across all watchlists
  const { data: watchlists } = await supabase
    .from("watchlists")
    .select("id")
    .eq("brand_clerk_id", user.id);

  let totalSaved = 0;
  if (watchlists && watchlists.length > 0) {
    const watchlistIds = watchlists.map((w) => w.id);
    const { count } = await supabase
      .from("watchlist_items")
      .select("*", { count: "exact", head: true })
      .in("watchlist_id", watchlistIds);
    totalSaved = count || 0;
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Insights
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Your activity on Rising Creators
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-[var(--color-text-primary)]">
              {unlockCount || 0}
            </p>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Creators Unlocked
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-[var(--color-text-primary)]">
              {watchlistCount || 0}
            </p>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Watchlists
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-[var(--color-text-primary)]">
              {totalSaved}
            </p>
            <p className="text-[var(--color-text-secondary)] mt-2">
              Creators Saved
            </p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
            Coming Soon
          </h2>
          <ul className="space-y-3 text-[var(--color-text-secondary)]">
            <li>📊 See trending niches and creators</li>
            <li>📈 Track creator growth over time</li>
            <li>🎯 Get personalized recommendations</li>
            <li>💰 Rate benchmarks for your industry</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
