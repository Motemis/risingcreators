"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface Campaign {
  id: string;
  name: string;
  brief: string | null;
  ideal_creator_description: string | null;
  content_requirements: string | null;
  target_niches: string[] | null;
  min_followers: number | null;
  max_followers: number | null;
  budget_per_creator: number | null;
  budget_total: number | null;
  preferred_platforms: string[] | null;
  content_style: string[] | null;
  deliverables: string | null;
  start_date: string | null;
  end_date: string | null;
  brand_profile: {
    company_name: string | null;
    logo_url: string | null;
    industry: string[] | null;
  } | null;
  matchScore: number;
  matchTier: "perfect" | "strong" | "potential";
  matchReasons: string[];
  matchHighlights: string[];
  matchMisses: string[];
  interestStatus: string | null;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getBrandCategory(industry: string[] | null, niches: string[] | null): string {
  // Show category instead of brand name for privacy
  if (industry && industry.length > 0) {
    return `${industry[0]} Brand`;
  }
  if (niches && niches.length > 0) {
    return `${niches[0]} Brand`;
  }
  return "Brand";
}

export default function CampaignOpportunityCard({
  campaign,
  creatorProfileId,
}: {
  campaign: Campaign;
  creatorProfileId: string;
}) {
  const [status, setStatus] = useState(campaign.interestStatus);
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleExpressInterest = async () => {
    setSubmitting(true);

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/interest`, {
        method: "POST",
      });

      if (response.ok) {
        setStatus("interested");
      } else {
        const data = await response.json();
        console.error("Error expressing interest:", data.error);
        alert("Failed to express interest: " + data.error);
      }
    } catch (error) {
      console.error("Error expressing interest:", error);
      alert("Failed to express interest");
    }

    setSubmitting(false);
  };

  const handleDismiss = async () => {
    setSubmitting(true);

    const { error } = await supabase.from("campaign_interest").upsert({
      campaign_id: campaign.id,
      creator_profile_id: creatorProfileId,
      status: "dismissed",
    });

    if (!error) {
      setStatus("dismissed");
    }
    setSubmitting(false);
  };

  if (status === "dismissed") {
    return null;
  }

  const tierConfig = {
    perfect: {
      border: "border-[var(--color-accent)]",
      badge: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
      label: "Perfect Match",
    },
    strong: {
      border: "border-[var(--color-accent)]",
      badge: "bg-[var(--color-accent-light)] text-[var(--color-accent)]",
      label: "Strong Match",
    },
    potential: {
      border: "border-[var(--color-border)]",
      badge: "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]",
      label: "Potential",
    },
  };

  const config = tierConfig[campaign.matchTier];
  const brandCategory = getBrandCategory(
    campaign.brand_profile?.industry || null,
    campaign.target_niches
  );

  // Parse deliverables into bullet points
  const deliverablesList = campaign.deliverables
    ? campaign.deliverables.split(/[,+]/).map((d) => d.trim()).filter(Boolean)
    : [];

  return (
    <div
      className={`bg-[var(--color-bg-secondary)] border ${config.border} rounded-xl overflow-hidden`}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Brand Logo Placeholder */}
            <div className="w-12 h-12 rounded-lg bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl flex-shrink-0">
              {campaign.brand_profile?.logo_url ? (
                <img
                  src={campaign.brand_profile.logo_url}
                  alt="Brand"
                  className="w-full h-full object-cover rounded-lg"
                />
              ) : (
                "🏢"
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-semibold text-[var(--color-text-primary)]">
                  {brandCategory}
                </h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${config.badge}`}>
                  {config.label}
                </span>
                {status === "interested" && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                    ✓ Interest Sent
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {campaign.name}
              </p>
            </div>
          </div>

          {/* Match Score */}
          <div className="text-center flex-shrink-0">
            <div
              className={`text-2xl font-bold ${
                campaign.matchScore >= 75
                  ? "text-[var(--color-accent)]"
                  : campaign.matchScore >= 50
                  ? "text-[var(--color-accent)]"
                  : "text-[var(--color-headline)]"
              }`}
            >
              {campaign.matchScore}%
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">Match</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-2 mt-4">
          {campaign.budget_per_creator && (
            <span className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-accent-light)] text-[var(--color-accent)] font-medium">
              💰 ${campaign.budget_per_creator.toLocaleString()}/creator
            </span>
          )}
          {campaign.preferred_platforms && campaign.preferred_platforms.length > 0 && (
            <span className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              🎬 {campaign.preferred_platforms.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
            </span>
          )}
          {campaign.min_followers && campaign.max_followers && (
            <span className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              👥 {formatNumber(campaign.min_followers)} - {formatNumber(campaign.max_followers)}
            </span>
          )}
          {campaign.start_date && campaign.end_date && (
            <span className="text-sm px-3 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              📅 {new Date(campaign.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - {new Date(campaign.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </span>
          )}
        </div>

        {/* Why You're a Great Fit */}
        {(campaign.matchHighlights.length > 0 || campaign.matchReasons.length > 0) && (
          <div className="mt-4 p-3 bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-lg">
            <p className="text-xs font-medium text-[var(--color-accent)] mb-2">Why you're a great fit:</p>
            <div className="space-y-1">
              {campaign.matchHighlights.map((highlight, i) => (
                <p key={i} className="text-sm text-[var(--color-accent)]">✓ {highlight}</p>
              ))}
              {campaign.matchReasons.slice(0, 2).map((reason, i) => (
                <p key={i} className="text-sm text-[var(--color-text-secondary)]">✓ {reason}</p>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Expandable Details */}
      {expanded && (
        <div className="px-6 pb-4 border-t border-[var(--color-border)] pt-4 space-y-4">
          {/* What they're looking for */}
          {campaign.ideal_creator_description && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
                What they're looking for:
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] p-3 rounded-lg">
                "{campaign.ideal_creator_description}"
              </p>
            </div>
          )}

          {/* Content Requirements */}
          {campaign.content_requirements && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
                Content needed:
              </p>
              <p className="text-sm text-[var(--color-text-secondary)]">
                {campaign.content_requirements}
              </p>
            </div>
          )}

          {/* Deliverables */}
          {deliverablesList.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
                Deliverables:
              </p>
              <ul className="space-y-1">
                {deliverablesList.map((d, i) => (
                  <li key={i} className="text-sm text-[var(--color-text-secondary)] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)]"></span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Content Style */}
          {campaign.content_style && campaign.content_style.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
                Content style:
              </p>
              <div className="flex flex-wrap gap-2">
                {campaign.content_style.map((style) => (
                  <span
                    key={style}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)] capitalize"
                  >
                    {style}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target Niches */}
          {campaign.target_niches && campaign.target_niches.length > 0 && (
            <div>
              <p className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
                Target niches:
              </p>
              <div className="flex flex-wrap gap-2">
                {campaign.target_niches.map((niche) => (
                  <span
                    key={niche}
                    className="text-xs px-2 py-1 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                  >
                    {niche}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* What's Hidden */}
          <div className="mt-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              🔒 Brand name and contact details will be shared after you express interest and the brand reviews your profile.
            </p>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-[var(--color-bg-tertiary)] flex items-center justify-between">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          {expanded ? "Show less" : "View full details"}
        </button>

        <div className="flex gap-2">
          {status !== "interested" && (
            <>
              <button
                onClick={handleDismiss}
                disabled={submitting}
                className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Not for me
              </button>
              <button
                onClick={handleExpressInterest}
                disabled={submitting}
                className="px-5 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
              >
                {submitting ? "..." : "Express Interest"}
              </button>
            </>
          )}
          {status === "interested" && (
            <span className="px-4 py-2 text-sm text-[var(--color-accent)] font-medium">
              ✓ Interest Sent — Waiting for brand review
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

