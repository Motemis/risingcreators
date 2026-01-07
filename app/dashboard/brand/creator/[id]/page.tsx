import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UnlockButton from "./UnlockButton";
import SaveToWatchlistButton from "./SaveToWatchlistButton";
import PostsSection from "./PostsSection";

function formatFollowers(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function CreatorDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get creator profile
  const { data: creator } = await supabase
    .from("creator_profiles")
    .select(`
      *,
      users (
        first_name,
        last_name,
        email
      )
    `)
    .eq("id", id)
    .single();

  if (!creator) {
    return (
      <div className="p-8 bg-[var(--color-bg-primary)] min-h-screen">
        <div className="max-w-2xl mx-auto text-center py-16">
          <p className="text-[var(--color-text-secondary)]">Creator not found</p>
        </div>
      </div>
    );
  }

  // Check if already unlocked
  const { data: unlock } = await supabase
    .from("unlocks")
    .select("*")
    .eq("brand_clerk_id", user.id)
    .eq("creator_id", id)
    .single();

  const isUnlocked = !!unlock;

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
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              {creator.profile_photo_url ? (
                <img
                  src={creator.profile_photo_url}
                  alt={displayName}
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {displayName}
                </h1>
                {creator.location && (
                  <p className="text-[var(--color-text-secondary)]">
                    📍 {creator.location}
                  </p>
                )}
                {creator.niche && creator.niche.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {creator.niche.map((n: string) => (
                      <span
                        key={n}
                        className="px-2 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs rounded-full"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <SaveToWatchlistButton creatorId={id} brandClerkId={user.id} />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {creator.tiktok_followers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(creator.tiktok_followers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">TikTok</p>
            </div>
          )}
          {creator.instagram_followers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(creator.instagram_followers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">Instagram</p>
            </div>
          )}
          {creator.youtube_subscribers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(creator.youtube_subscribers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">YouTube</p>
            </div>
          )}
          {creator.twitter_followers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(creator.twitter_followers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">Twitter/X</p>
            </div>
          )}
        </div>

        {/* Total Reach */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
          <div className="text-center">
            <p className="text-4xl font-bold text-[var(--color-text-primary)]">
              {formatFollowers(totalFollowers)}
            </p>
            <p className="text-[var(--color-text-secondary)]">Total Reach</p>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
            <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-2 uppercase">
              About
            </h2>
            <p className="text-[var(--color-text-primary)]">{creator.bio}</p>
          </div>
        )}

        {/* Social Links - Gated */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Social Links {!isUnlocked && "🔒"}
          </h2>

          {isUnlocked ? (
            <div className="space-y-3">
              {creator.tiktok_url && (
                <a
                  href={creator.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[var(--color-accent)] hover:underline"
                >
                  TikTok ↗
                </a>
              )}
              {creator.instagram_url && (
                <a
                  href={creator.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[var(--color-accent)] hover:underline"
                >
                  Instagram ↗
                </a>
              )}
              {creator.youtube_url && (
                <a
                  href={creator.youtube_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[var(--color-accent)] hover:underline"
                >
                  YouTube ↗
                </a>
              )}
              {creator.twitter_url && (
                <a
                  href={creator.twitter_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[var(--color-accent)] hover:underline"
                >
                  Twitter/X ↗
                </a>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[var(--color-text-secondary)] blur-sm select-none">
                tiktok.com/@username
              </p>
              <p className="text-[var(--color-text-secondary)] blur-sm select-none">
                instagram.com/username
              </p>
            </div>
          )}
        </div>

        {/* Contact & Rates - Gated */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)]">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Contact & Rates {!isUnlocked && "🔒"}
          </h2>

          {isUnlocked ? (
            <div className="space-y-4">
              <div>
                <p className="text-[var(--color-text-tertiary)] text-sm">Email</p>
                <p className="text-[var(--color-text-primary)]">
                  {creator.users?.email || "Not provided"}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
                {creator.rate_per_post && (
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-sm">Per Post</p>
                    <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                      ${(creator.rate_per_post / 100).toFixed(0)}
                    </p>
                  </div>
                )}
                {creator.rate_per_video && (
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-sm">Per Video</p>
                    <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                      ${(creator.rate_per_video / 100).toFixed(0)}
                    </p>
                  </div>
                )}
                {creator.rate_per_story && (
                  <div>
                    <p className="text-[var(--color-text-tertiary)] text-sm">Per Story</p>
                    <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                      ${(creator.rate_per_story / 100).toFixed(0)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)] mb-4">
                Unlock to see contact info and rates
              </p>
              <UnlockButton creatorId={id} brandClerkId={user.id} />
            </div>
          )}
        </div>

        {/* Featured Posts - Only shown when unlocked */}
        {isUnlocked && (
          <PostsSection creatorProfileId={creator.id} />
        )}

      </div>
    </div>
  );
}
