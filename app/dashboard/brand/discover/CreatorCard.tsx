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
  engagement_rate?: number | null;
  brand_readiness_score?: number | null;
  estimated_reach_monthly?: number | null;
  consistency_score?: number | null;
  authenticity_score?: number | null;
  matchScore?: number | null;
  matchGrade?: string | null;
  matchReasons?: string[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function MatchScoreCircle({ score }: { score: number }) {
  const displayScore = Math.max(1, Math.min(10, Math.round(score / 10)));
  
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const progress = displayScore / 10;
  const strokeDashoffset = circumference * (1 - progress);
  
  let color: string;
  let bgColor: string;
  if (displayScore >= 8) {
    color = "#22c55e";
    bgColor = "rgba(34, 197, 94, 0.1)";
  } else if (displayScore >= 7) {
    color = "#eab308";
    bgColor = "rgba(234, 179, 8, 0.1)";
  } else if (displayScore >= 4) {
    color = "#f97316";
    bgColor = "rgba(249, 115, 22, 0.1)";
  } else {
    color = "#ef4444";
    bgColor = "rgba(239, 68, 68, 0.1)";
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-12 h-12" title={`Match Score: ${displayScore}/10`}>
        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 44 44">
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill={bgColor}
            stroke="var(--color-border)"
            strokeWidth="3"
          />
          <circle
            cx="22"
            cy="22"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div 
          className="absolute inset-0 flex items-center justify-center font-bold text-sm"
          style={{ color }}
        >
          {displayScore}
        </div>
      </div>
      <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1 whitespace-nowrap">
        Brand Match
      </span>
    </div>
  );
}

export default function CreatorCard({ 
  creator, 
  isPremium = false 
}: { 
  creator: Creator;
  isPremium?: boolean;
}) {
  const href = creator.type === "claimed"
    ? `/dashboard/brand/creator/${creator.id}`
    : `/dashboard/brand/discovered/${creator.id}`;

  return (
    <Link
      href={href}
      className="block bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-accent)] transition-colors"
    >
      {/* Creator Info Row with Match Score */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {creator.profile_image_url ? (
            <img
              src={creator.profile_image_url}
              alt="Creator"
              className={`w-14 h-14 rounded-full object-cover ${!isPremium ? "blur-[2px]" : ""}`}
            />
          ) : (
            <div className={`w-14 h-14 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl ${!isPremium ? "blur-[2px]" : ""}`}>
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

        {/* Name and Niches */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          {isPremium ? (
            <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
              {creator.display_name}
            </h3>
          ) : (
            <div className="relative inline-block">
              <span className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] px-3 py-1 rounded-full">
                Premium to reveal
              </span>
            </div>
          )}

          {/* Niche Tags */}
          {creator.niche && creator.niche.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
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

        {/* Match Score - Right Side */}
        {creator.matchScore !== null && creator.matchScore !== undefined && (
          <div className="flex-shrink-0">
            <MatchScoreCircle score={creator.matchScore} />
          </div>
        )}
      </div>

      {/* Key Metrics Grid */}
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
          <p className={`text-sm font-bold ${
            (creator.growth_rate_7d || 0) > 0 ? "text-green-500" : "text-[var(--color-text-primary)]"
          }`}>
            {creator.growth_rate_7d ? `${creator.growth_rate_7d > 0 ? "+" : ""}${creator.growth_rate_7d.toFixed(1)}%` : "—"}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Growth/wk</p>
        </div>
      </div>

      {/* Estimated Reach */}
      {creator.estimated_reach_monthly && creator.estimated_reach_monthly > 0 && (
        <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
          <div className="flex justify-between items-center text-sm">
            <span className="text-[var(--color-text-secondary)]">Est. Monthly Reach</span>
            <span className="font-medium text-[var(--color-text-primary)]">
              {formatNumber(creator.estimated_reach_monthly)} views
            </span>
          </div>
        </div>
      )}

      {/* Brand Readiness Score */}
      {creator.brand_readiness_score && (
        <div className="mt-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-[var(--color-text-tertiary)]">Brand Readiness</span>
            <span className="text-[var(--color-text-secondary)]">{creator.brand_readiness_score}/100</span>
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