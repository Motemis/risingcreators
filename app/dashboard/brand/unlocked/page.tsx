import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

function formatFollowers(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function UnlockedPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get all unlocks for this brand
  const { data: unlocks } = await supabase
    .from("unlocks")
    .select("*")
    .eq("brand_clerk_id", user.id)
    .order("created_at", { ascending: false });

  // Get creator profiles for each unlock
  let unlockedCreators: any[] = [];
  if (unlocks && unlocks.length > 0) {
    const creatorIds = unlocks.map((u) => u.creator_id);
    const { data: creators } = await supabase
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

    // Merge unlock data with creator data
    unlockedCreators = unlocks.map((unlock) => {
      const creator = creators?.find((c) => c.id === unlock.creator_id);
      return { ...unlock, creator };
    }).filter((u) => u.creator);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Unlocked Creators
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Creators you've unlocked ({unlockedCreators.length})
          </p>
        </div>

        {/* Unlocked Creators */}
        {unlockedCreators.length > 0 ? (
          <div className="space-y-4">
            {unlockedCreators.map((unlock) => {
              const creator = unlock.creator;
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
                <div
                  key={unlock.id}
                  className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      {creator.profile_photo_url ? (
                        <img
                          src={creator.profile_photo_url}
                          alt={displayName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-[var(--color-text-primary)]">
                          {displayName}
                        </h3>
                        <p className="text-[var(--color-text-secondary)]">
                          {creator.niche?.join(", ") || "Creator"} · {formatFollowers(totalFollowers)} followers
                        </p>
                        {creator.location && (
                          <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
                            📍 {creator.location}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <Link
                      href={`/dashboard/brand/creator/${creator.id}`}
                      className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm hover:bg-[var(--color-accent-hover)] transition-colors"
                    >
                      View Profile
                    </Link>
                  </div>

                  {/* Contact Info */}
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-[var(--color-text-tertiary)] text-sm">Email</p>
                        <p className="text-[var(--color-text-primary)]">
                          {creator.users?.email || "Not provided"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-tertiary)] text-sm">Unlocked</p>
                        <p className="text-[var(--color-text-primary)]">
                          {new Date(unlock.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {creator.rate_per_post && (
                        <div>
                          <p className="text-[var(--color-text-tertiary)] text-sm">Per Post</p>
                          <p className="text-[var(--color-text-primary)]">
                            ${(creator.rate_per_post / 100).toFixed(0)}
                          </p>
                        </div>
                      )}
                      {creator.rate_per_video && (
                        <div>
                          <p className="text-[var(--color-text-tertiary)] text-sm">Per Video</p>
                          <p className="text-[var(--color-text-primary)]">
                            ${(creator.rate_per_video / 100).toFixed(0)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Social Links */}
                    <div className="mt-4 flex flex-wrap gap-3">
                      {creator.tiktok_url && (
                        <a
                          href={creator.tiktok_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--color-accent)] hover:underline"
                        >
                          TikTok ↗
                        </a>
                      )}
                      {creator.instagram_url && (
                        <a
                          href={creator.instagram_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--color-accent)] hover:underline"
                        >
                          Instagram ↗
                        </a>
                      )}
                      {creator.youtube_url && (
                        <a
                          href={creator.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--color-accent)] hover:underline"
                        >
                          YouTube ↗
                        </a>
                      )}
                      {creator.twitter_url && (
                        <a
                          href={creator.twitter_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[var(--color-accent)] hover:underline"
                        >
                          Twitter/X ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-12 text-center">
            <p className="text-[var(--color-text-secondary)] mb-4">No unlocked creators yet</p>
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
