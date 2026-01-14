import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import MessageCreatorButton from "./MessageCreatorButton";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function DiscoveredCreatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  const { id } = await params;

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    redirect("/");
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  const { data: creator } = await supabase
    .from("discovered_creators")
    .select("*")
    .eq("id", id)
    .single();

  if (!creator) {
    redirect("/dashboard/brand/discover");
  }

  // Check if already unlocked
  const { data: existingUnlock } = await supabase
    .from("discovered_creator_unlocks")
    .select("*")
    .eq("discovered_creator_id", id)
    .eq("brand_user_id", dbUser.id)
    .single();

  const isUnlocked = !!existingUnlock;
  const isPremium =
    brandProfile?.is_premium &&
    (!brandProfile.premium_until || new Date(brandProfile.premium_until) > new Date());
  const canViewFull = isPremium || isUnlocked;

  const displayName = creator.name || creator.channel_title || creator.display_name || "Creator";

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {canViewFull ? (
              creator.thumbnail_url || creator.profile_image_url ? (
                <img
                  src={creator.thumbnail_url || creator.profile_image_url}
                  alt={displayName}
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-4xl">
                  🎬
                </div>
              )
            ) : (
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-4xl blur-sm">
                  🎬
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-3">
                {canViewFull ? (
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {displayName}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    <span className="text-base text-[var(--color-text-tertiary)]">
                      Unlock to reveal creator
                    </span>
                  </h1>
                )}
                {creator.rising_score && creator.rising_score >= 50 && (
                  <span
                    className={`text-sm px-3 py-1 rounded-full font-medium ${
                      creator.rising_score >= 70
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    🔥 Rising
                  </span>
                )}
              </div>

              {canViewFull && (
                <p className="text-[var(--color-text-secondary)] mt-1">
                  @{creator.youtube_handle || creator.platform_username} •{" "}
                  {creator.platform || "YouTube"}
                </p>
              )}

              {(creator.primary_niche || (creator.niche && creator.niche.length > 0)) && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(creator.niche || [creator.primary_niche]).map((n: string) => (
                    <span
                      key={n}
                      className="text-sm px-3 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canViewFull && (
            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <MessageCreatorButton discoveredCreatorId={id} creatorName={displayName} />
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatNumber(creator.subscriber_count || creator.followers || 0)}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">Subscribers</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatNumber(creator.video_count || creator.total_posts || 0)}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">Videos</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatNumber(creator.avg_views || 0)}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">Avg Views</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p
              className={`text-2xl font-bold ${
                (creator.growth_rate_7d || 0) > 0
                  ? "text-green-500"
                  : "text-[var(--color-text-primary)]"
              }`}
            >
              {creator.growth_rate_7d
                ? `${creator.growth_rate_7d > 0 ? "+" : ""}${creator.growth_rate_7d.toFixed(1)}%`
                : "—"}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">Weekly Growth</p>
          </div>
        </div>

        {/* Bio */}
        {(creator.description || creator.bio) && canViewFull && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-2">
              About
            </h2>
            <p className="text-[var(--color-text-primary)] whitespace-pre-wrap">
              {(creator.description || creator.bio)?.slice(0, 500)}
              {(creator.description || creator.bio)?.length > 500 && "..."}
            </p>
          </div>
        )}

        {/* Channel Link */}
        {canViewFull && (creator.channel_url || creator.platform_user_id) && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-3">
              Channel
            </h2>
            <Link
              href={creator.channel_url || `https://youtube.com/channel/${creator.platform_user_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[var(--color-accent)] hover:underline"
            >
              <span>🎬</span>
              <span>View YouTube Channel →</span>
            </Link>
          </div>
        )}

        {/* Unlock Section - for non-premium, non-unlocked users */}
        {!canViewFull && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-8">
            <div className="text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🔓</span>
              </div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                Unlock this creator
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Upgrade to premium to see full profiles and contact creators.
              </p>
              <Link
                href="/dashboard/brand/settings?tab=billing"
                className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
              >
                Upgrade to Premium
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
