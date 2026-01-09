import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UnlockDiscoveredButton from "../UnlockDiscoveredButton";

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

  // Get brand profile to determine premium status
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
    (!brandProfile.premium_until ||
      new Date(brandProfile.premium_until) > new Date());
  const canViewIdentity = isPremium || isUnlocked;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-start gap-6">
            {canViewIdentity ? (
              creator.profile_image_url ? (
                <img
                  src={creator.profile_image_url}
                  alt={creator.display_name}
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
                {canViewIdentity ? (
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    {creator.display_name}
                  </h1>
                ) : (
                  <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                    <span className="text-base text-[var(--color-text-tertiary)]">
                      Premium or unlock to reveal
                    </span>
                  </h1>
                )}
                {creator.rising_score && creator.rising_score >= 50 && (
                  <span className={`text-sm px-3 py-1 rounded-full font-medium ${
                    creator.rising_score >= 70
                      ? "bg-green-500/10 text-green-500"
                      : "bg-yellow-500/10 text-yellow-500"
                  }`}>
                    🔥 Rising Score
                  </span>
                )}
              </div>

              {canViewIdentity && (
                <p className="text-[var(--color-text-secondary)] mt-1">
                  @{creator.platform_username} • {creator.platform}
                </p>
              )}

              {creator.niche && creator.niche.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {creator.niche.map((n: string) => (
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatNumber(creator.followers)}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">Followers</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {formatNumber(creator.total_posts || 0)}
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
            <p className={`text-2xl font-bold ${
              (creator.growth_rate_7d || 0) > 0 ? "text-green-500" : "text-[var(--color-text-primary)]"
            }`}>
              {creator.growth_rate_7d ? `${creator.growth_rate_7d > 0 ? "+" : ""}${creator.growth_rate_7d.toFixed(1)}%` : "—"}
            </p>
            <p className="text-sm text-[var(--color-text-secondary)]">Weekly Growth</p>
          </div>
        </div>

        {/* Bio - only visible when identity is visible */}
        {creator.bio && canViewIdentity && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <h2 className="text-sm font-medium text-[var(--color-text-tertiary)] uppercase mb-2">
              About
            </h2>
            <p className="text-[var(--color-text-primary)]">{creator.bio}</p>
          </div>
        )}

        {/* Unlock Section */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          {isUnlocked ? (
            <div className="text-center">
              <p className="text-green-500 font-medium mb-2">✓ Unlock Requested</p>
              <p className="text-[var(--color-text-secondary)]">
                We've notified this creator that you're interested in working with them.
                You'll be able to contact them once they claim their profile.
              </p>
              <a
                href={`https://youtube.com/channel/${creator.platform_user_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-4 text-[var(--color-accent)] hover:underline"
              >
                View their YouTube channel →
              </a>
            </div>
          ) : (
            <div className="text-center">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Interested in this creator?
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-4">
                This creator hasn't joined Rising Creators yet. Request to unlock and we'll
                reach out to them on your behalf.
              </p>
              <UnlockDiscoveredButton
                discoveredCreatorId={creator.id}
                brandUserId={dbUser.id}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}