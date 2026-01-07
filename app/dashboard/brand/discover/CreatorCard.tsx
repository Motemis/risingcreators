import Link from "next/link";

interface Creator {
  id: string;
  type: "claimed" | "discovered";
  display_name: string;
  profile_image_url: string | null;
  bio: string | null;
  location: string | null;
  niche: string[] | null;
  followers: number;
  youtube_subscribers?: number;
  tiktok_followers?: number;
  instagram_followers?: number;
  rising_score: number | null;
  growth_rate_7d: number | null;
  platform?: string;
  platform_user_id?: string;
  engagement_rate?: number;
  brand_readiness_score?: number;
  estimated_reach_monthly?: number;
  consistency_score?: number;
  authenticity_score?: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function CreatorCard({
  creator,
  isPremium = false,
}: {
  creator: Creator;
  isPremium?: boolean;
}) {
  const href =
    creator.type === "claimed"
      ? `/dashboard/brand/creator/${creator.id}`
      : `/dashboard/brand/discovered/${creator.id}`;

  return (
    <Link
      href={href}
      className="block bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-accent)] transition-colors"
    >
      {/* Top Badges */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-2">
          {creator.brand_readiness_score &&
            creator.brand_readiness_score >= 70 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-green-500/10 text-green-500">
                ✓ Brand Ready
              </span>
            )}
          {creator.rising_score && creator.rising_score >= 50 && (
            <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange-500/10 text-orange-500">
              🔥 Rising
            </span>
          )}
        </div>
        {creator.platform && creator.type === "discovered" && (
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
            {creator.platform}
          </span>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Avatar - slightly blurred for free users */}
        <div className="relative">
          {creator.profile_image_url ? (
            <img
              src={creator.profile_image_url}
              alt="Creator"
              className={`w-14 h-14 rounded-full object-cover ${
                !isPremium ? "blur-sm" : ""
              }`}
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl ${
                !isPremium ? "blur-sm" : ""
              }`}
            >
              {creator.platform === "youtube" && "🎬"}
              {creator.platform === "tiktok" && "📱"}
              {creator.platform === "instagram" && "📸"}
              {!creator.platform && "👤"}
            </div>
          )}
          {!isPremium && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg">🔒</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name - show real name only for premium users */}
          {isPremium ? (
            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
              {creator.display_name}
            </h3>
          ) : (
            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
              <span className="text-sm text-[var(--color-text-tertiary)]">
                Premium to reveal
              </span>
            </h3>
          )}

          {/* Niche Tags - always visible */}
          {creator.niche && creator.niche.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {creator.niche.slice(0, 2).map((n) => (
                <span
                  key={n}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                >
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Key Metrics Grid - always visible */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            {formatNumber(creator.followers)}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Followers</p>
        </div>
        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-2 text-center">
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            {creator.engagement_rate ? `${creator.engagement_rate}%` : "—"}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Engagement</p>
        </div>
        <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-2 text-center">
          <p
            className={`text-sm font-bold ${
              (creator.growth_rate_7d || 0) > 0
                ? "text-green-500"
                : "text-[var(--color-text-primary)]"
            }`}
          >
            {creator.growth_rate_7d
              ? `${creator.growth_rate_7d > 0 ? "+" : ""}${creator.growth_rate_7d.toFixed(1)}%`
              : "—"}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Growth/wk</p>
        </div>
      </div>

      {/* Estimated Reach - always visible */}
      {creator.estimated_reach_monthly &&
        creator.estimated_reach_monthly > 0 && (
          <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
            <div className="flex justify-between items-center text-sm">
              <span className="text-[var(--color-text-secondary)]">
                Est. Monthly Reach
              </span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {formatNumber(creator.estimated_reach_monthly)} views
              </span>
            </div>
          </div>
        )}

      {/* Brand Readiness Score - always visible */}
      {creator.brand_readiness_score && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--color-text-tertiary)]">
              Brand Readiness
            </span>
            <span className="text-[var(--color-text-secondary)]">
              {creator.brand_readiness_score}/100
            </span>
          </div>
          <div className="h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                creator.brand_readiness_score >= 70
                  ? "bg-green-500"
                  : creator.brand_readiness_score >= 50
                  ? "bg-yellow-500"
                  : "bg-red-500"
              }`}
              style={{ width: `${creator.brand_readiness_score}%` }}
            />
          </div>
        </div>
      )}

      {/* Upgrade prompt for free users */}
      {!isPremium && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)] text-center">
          <span className="text-xs text-[var(--color-accent)]">
            🔓 Upgrade to see full profile
          </span>
        </div>
      )}
    </Link>
  );
}


