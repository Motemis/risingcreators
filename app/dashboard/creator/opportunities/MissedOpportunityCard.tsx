"use client";

import Link from "next/link";

interface Campaign {
  id: string;
  name: string;
  target_niches: string[] | null;
  min_followers: number | null;
  max_followers: number | null;
  budget_per_creator: number | null;
  preferred_platforms: string[] | null;
  brand_profile: {
    company_name: string | null;
    logo_url: string | null;
    industry: string[] | null;
  } | null;
  matchScore: number;
  followerGap: {
    type: "below" | "above";
    needed?: number;
    max?: number;
    current: number;
  } | null;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getBrandCategory(industry: string[] | null, niches: string[] | null): string {
  if (industry && industry.length > 0) {
    return `${industry[0]} Brand`;
  }
  if (niches && niches.length > 0) {
    return `${niches[0]} Brand`;
  }
  return "Brand";
}

export default function MissedOpportunityCard({
  campaign,
  creatorFollowers,
}: {
  campaign: Campaign;
  creatorFollowers: number;
}) {
  const brandCategory = getBrandCategory(
    campaign.brand_profile?.industry || null,
    campaign.target_niches
  );

  const getAdvice = () => {
    if (!campaign.followerGap) return null;

    if (campaign.followerGap.type === "below") {
      const needed = campaign.followerGap.needed || 0;
      const gap = needed - creatorFollowers;
      const percentGrowth = Math.round((gap / creatorFollowers) * 100);

      return {
        icon: "📈",
        title: "Grow your audience",
        description: `You need ${formatNumber(gap)} more followers to qualify. That's ${percentGrowth}% growth from where you are now.`,
        tips: [
          "Post consistently (3-5x per week)",
          "Engage with your community in comments",
          "Collaborate with creators in your niche",
          "Optimize your titles and thumbnails",
        ],
      };
    } else {
      // Creator is too big for this campaign
      return {
        icon: "🎯",
        title: "Different target audience",
        description: `This brand is looking for smaller creators (up to ${formatNumber(campaign.followerGap.max || 0)}). You're above their target!`,
        tips: [
          "This is actually good news - you're growing!",
          "Look for campaigns targeting larger creators",
          "Some brands prefer micro-influencers for authenticity",
        ],
      };
    }
  };

  const advice = getAdvice();

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5 opacity-80 hover:opacity-100 transition-opacity">
      <div className="flex items-start justify-between gap-4">
        {/* Left side - Campaign Info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-lg flex-shrink-0">
            🏢
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium text-[var(--color-text-primary)]">
                {brandCategory}
              </h3>
              {campaign.budget_per_creator && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                  ${campaign.budget_per_creator.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-tertiary)]">
              {campaign.target_niches && (
                <span>{campaign.target_niches.slice(0, 2).join(", ")}</span>
              )}
              <span>•</span>
              <span>
                {formatNumber(campaign.min_followers || 0)} - {formatNumber(campaign.max_followers || 0)} followers
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Gap indicator */}
        {campaign.followerGap && (
          <div className="text-right flex-shrink-0">
            {campaign.followerGap.type === "below" ? (
              <div>
                <p className="text-sm font-medium text-[var(--color-headline)]">
                  Need {formatNumber((campaign.followerGap.needed || 0) - creatorFollowers)} more
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">followers</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-[var(--color-headline)]">Too big</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">for this campaign</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Advice Section */}
      {advice && (
        <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
          <div className="flex items-start gap-2">
            <span className="text-lg">{advice.icon}</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                {advice.title}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                {advice.description}
              </p>
              {campaign.followerGap?.type === "below" && (
                <div className="space-y-1">
                  <p className="text-xs font-medium text-[var(--color-text-tertiary)]">Tips to grow:</p>
                  <ul className="text-xs text-[var(--color-text-tertiary)] space-y-0.5">
                    {advice.tips.slice(0, 2).map((tip, i) => (
                      <li key={i}>• {tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
