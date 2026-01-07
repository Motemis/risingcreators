import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import CreateWatchlistButton from "./CreateWatchlistButton";

export default async function WatchlistsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user's watchlists
  const { data: watchlists } = await supabase
    .from("watchlists")
    .select("*")
    .eq("brand_clerk_id", user.id)
    .order("created_at", { ascending: false });

  // Get counts for each watchlist
  const watchlistsWithCounts = await Promise.all(
    (watchlists || []).map(async (watchlist) => {
      const { count } = await supabase
        .from("watchlist_items")
        .select("*", { count: "exact", head: true })
        .eq("watchlist_id", watchlist.id);

      return { ...watchlist, creatorCount: count || 0 };
    })
  );

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              My Watchlists
            </h1>
            <p className="text-[var(--color-text-secondary)] mt-1">
              Track and organize creators you're interested in
            </p>
          </div>
          <CreateWatchlistButton brandClerkId={user.id} />
        </div>

        {/* Watchlists */}
        {watchlistsWithCounts.length > 0 ? (
          <div className="grid gap-4">
            {watchlistsWithCounts.map((watchlist) => (
              <Link
                key={watchlist.id}
                href={`/dashboard/brand/watchlists/${watchlist.id}`}
                className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-accent)] transition block"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                      {watchlist.name}
                    </h2>
                    <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                      {watchlist.creatorCount} creator{watchlist.creatorCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <span className="text-[var(--color-text-tertiary)]">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-12 text-center">
            <p className="text-[var(--color-text-secondary)] mb-4">No watchlists yet</p>
            <p className="text-[var(--color-text-tertiary)] text-sm">
              Create a watchlist to start tracking creators
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
