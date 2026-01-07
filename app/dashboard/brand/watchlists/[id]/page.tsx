import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function formatFollowers(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function WatchlistDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get watchlist
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("*")
    .eq("id", id)
    .eq("brand_clerk_id", user.id)
    .single();

  if (!watchlist) {
    return (
      <div className="p-8 bg-[var(--color-bg-primary)] min-h-screen">
        <p className="text-[var(--color-text-secondary)]">Watchlist not found</p>
      </div>
    );
  }

  // Get creators in watchlist
  const { data: watchlistItems } = await supabase
    .from("watchlist_items")
    .select("*")
    .eq("watchlist_id", id);

  // Get creator profiles for each item
  let creators: any[] = [];
  if (watchlistItems && watchlistItems.length > 0) {
    const creatorIds = watchlistItems.map((item) => item.creator_id);
    const { data: creatorProfiles } = await supabase
      .from("creator_profiles")
      .select(`
        *,
        users (
          first_name,
          last_name,
          email
        )
      `)
      .in("id", creatorIds);

    creators = creatorProfiles || [];
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/brand/watchlists"
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-sm mb-2 inline-block"
          >
            ← Back to Watchlists
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            {watchlist.name}
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {creators.length} creator{creators.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Creators */}
        {creators.length > 0 ? (
          <div className="space-y-4">
            {creators.map((creator) => {
              const displayName =
                creator.display_name ||
                `${creator.users?.first_name || ""} ${creator.users?.last_name || ""}`.trim() ||
                "Creator";

              const totalFollowers =
                (creator.tiktok_followers || 0) +
                (creator.instagram_followers || 0) +
                (creator.youtube_subscribers || 0) +
                (creator.twitter_followers || 0);

              return (
                <Link
                  key={creator.id}
                  href={`/dashboard/brand/creator/${creator.id}`}
                  className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 flex justify-between items-center hover:border-[var(--color-accent)] transition block"
                >
                  <div className="flex items-center gap-4">
                    {creator.profile_photo_url ? (
                      <img
                        src={creator.profile_photo_url}
                        alt={displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {displayName}
                      </h3>
                      <p className="text-[var(--color-text-secondary)] text-sm">
                        {creator.niche?.join(", ") || "Creator"} · {formatFollowers(totalFollowers)} followers
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {creator.location && (
                      <span className="text-[var(--color-text-tertiary)] text-sm">
                        📍 {creator.location}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-12 text-center">
            <p className="text-[var(--color-text-secondary)] mb-4">
              No creators in this watchlist yet
            </p>
            <Link
              href="/dashboard/brand/discover"
              className="text-[var(--color-accent)] hover:underline font-medium"
            >
              Discover creators →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
