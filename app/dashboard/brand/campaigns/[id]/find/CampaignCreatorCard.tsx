"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  display_name: string;
  profile_image_url: string | null;
  bio: string | null;
  niche: string[] | null;
  followers: number;
  platform: string;
  engagement_rate: number | null;
  brand_readiness_score: number | null;
  campaignMatchScore: number;
  campaignMatchGrade: string;
  campaignMatchReasons: string[];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function CampaignMatchCircle({ score }: { score: number }) {
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
      <div className="relative w-12 h-12" title={`Campaign Match: ${displayScore}/10`}>
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
        Campaign Match
      </span>
    </div>
  );
}

export default function CampaignCreatorCard({
  creator,
  campaignId,
  isPremium = false,
  isUnlocked = false,
  brandProfileId,
}: {
  creator: Creator;
  campaignId: string;
  isPremium?: boolean;
  isUnlocked?: boolean;
  brandProfileId: string;
}) {
  const [adding, setAdding] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [added, setAdded] = useState(false);
  const [unlocked, setUnlocked] = useState(isUnlocked || isPremium);

  const handleAddToCampaign = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);

    const { error } = await supabase.from("campaign_creators").insert({
      campaign_id: campaignId,
      discovered_creator_id: creator.id,
      status: "lead",
      match_score: creator.campaignMatchScore,
    });

    if (!error) {
      setAdded(true);
    }
    setAdding(false);
  };

  const handleUnlockAndAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setUnlocking(true);

    // First, record the unlock
    const { error: unlockError } = await supabase.from("unlocked_creators").insert({
      brand_profile_id: brandProfileId,
      discovered_creator_id: creator.id,
    });

    if (unlockError && !unlockError.message.includes("duplicate")) {
      console.error("Unlock error:", unlockError);
      setUnlocking(false);
      return;
    }

    // Then add to campaign as unlocked
    const { error: addError } = await supabase.from("campaign_creators").insert({
      campaign_id: campaignId,
      discovered_creator_id: creator.id,
      status: "unlocked",
      match_score: creator.campaignMatchScore,
    });

    if (!addError) {
      setAdded(true);
      setUnlocked(true);
    }
    setUnlocking(false);
  };

  const canSeeDetails = isPremium || unlocked;

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 hover:border-[var(--color-accent)] transition-colors">
      {/* Creator Info Row with Match Score */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {creator.profile_image_url ? (
            <img
              src={creator.profile_image_url}
              alt="Creator"
              className={`w-14 h-14 rounded-full object-cover ${!canSeeDetails ? "blur-[2px]" : ""}`}
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl ${
                !canSeeDetails ? "blur-[2px]" : ""
              }`}
            >
              {creator.platform === "youtube" && "🎬"}
              {creator.platform === "tiktok" && "📱"}
              {creator.platform === "instagram" && "📸"}
            </div>
          )}
          {!canSeeDetails && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg">🔒</span>
            </div>
          )}
        </div>

        {/* Name and Niches */}
        <div className="flex-1 min-w-0">
          {canSeeDetails ? (
            <Link
              href={`/dashboard/brand/discovered/${creator.id}`}
              className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)] truncate block"
            >
              {creator.display_name}
            </Link>
          ) : (
            <span className="text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] px-3 py-1 rounded-full">
              Unlock to reveal
            </span>
          )}

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

        {/* Match Score */}
        <CampaignMatchCircle score={creator.campaignMatchScore} />
      </div>

      {/* Match Reasons */}
      {creator.campaignMatchReasons && creator.campaignMatchReasons.length > 0 && (
        <div className="mt-3 p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
          <p className="text-xs text-green-600">
            ✓ {creator.campaignMatchReasons.slice(0, 2).join(" • ")}
          </p>
        </div>
      )}

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
          <p className="text-sm font-bold text-[var(--color-text-primary)]">
            {creator.brand_readiness_score || "—"}
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Brand Ready</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 space-y-2">
        {added ? (
          <div className="w-full py-2 text-center text-sm font-medium text-green-500 bg-green-500/10 rounded-lg">
            ✓ Added to Campaign
          </div>
        ) : (
          <>
            {/* If already unlocked or premium, just show Add button */}
            {canSeeDetails ? (
              <button
                onClick={handleAddToCampaign}
                disabled={adding}
                className="w-full py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
              >
                {adding ? "Adding..." : "+ Add to Campaign"}
              </button>
            ) : (
              <>
                {/* Unlock & Add button */}
                <button
                  onClick={handleUnlockAndAdd}
                  disabled={unlocking}
                  className="w-full py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
                >
                  {unlocking ? "Unlocking..." : "🔓 Unlock & Add to Campaign"}
                </button>
                {/* Just add as lead (without unlocking) */}
                <button
                  onClick={handleAddToCampaign}
                  disabled={adding}
                  className="w-full py-2 border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] rounded-lg font-medium hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50 transition-colors text-sm"
                >
                  {adding ? "Adding..." : "Add as Lead (unlock later)"}
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
