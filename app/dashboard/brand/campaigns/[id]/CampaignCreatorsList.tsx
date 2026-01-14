"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

interface CampaignCreator {
  id: string;
  status: string;
  match_score: number | null;
  notes: string | null;
  added_at: string;
  contacted_at: string | null;
  creator_profile: any;
  discovered_creator: any;
}

const STATUS_OPTIONS = [
  { value: "matched", label: "Matched", color: "bg-gray-500/10 text-gray-400" },
  { value: "saved", label: "Saved", color: "bg-blue-500/10 text-blue-500" },
  { value: "contacted", label: "Contacted", color: "bg-yellow-500/10 text-yellow-500" },
  { value: "negotiating", label: "Negotiating", color: "bg-orange-500/10 text-orange-500" },
  { value: "confirmed", label: "Confirmed", color: "bg-green-500/10 text-green-500" },
  { value: "declined", label: "Declined", color: "bg-red-500/10 text-red-500" },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function CampaignCreatorsList({
  campaignId,
  creators,
}: {
  campaignId: string;
  creators: CampaignCreator[];
}) {
  const [creatorList, setCreatorList] = useState(creators);

  const updateStatus = async (creatorId: string, newStatus: string) => {
    const updates: any = { status: newStatus };
    if (newStatus === "contacted") {
      updates.contacted_at = new Date().toISOString();
    }

    await supabase
      .from("campaign_creators")
      .update(updates)
      .eq("id", creatorId);

    setCreatorList((prev) =>
      prev.map((c) =>
        c.id === creatorId ? { ...c, status: newStatus, ...updates } : c
      )
    );
  };

  const removeCreator = async (creatorId: string) => {
    await supabase.from("campaign_creators").delete().eq("id", creatorId);
    setCreatorList((prev) => prev.filter((c) => c.id !== creatorId));
  };

  const getCreatorData = (creator: CampaignCreator) => {
    if (creator.creator_profile) {
      return {
        id: creator.creator_profile.id,
        name: creator.creator_profile.display_name,
        image: creator.creator_profile.profile_photo_url,
        followers:
          (creator.creator_profile.youtube_subscribers || 0) +
          (creator.creator_profile.tiktok_followers || 0) +
          (creator.creator_profile.instagram_followers || 0),
        niche: creator.creator_profile.niche,
        type: "claimed",
      };
    } else if (creator.discovered_creator) {
      return {
        id: creator.discovered_creator.id,
        name: creator.discovered_creator.display_name,
        image: creator.discovered_creator.profile_image_url,
        followers: creator.discovered_creator.followers,
        niche: creator.discovered_creator.niche,
        engagement: creator.discovered_creator.engagement_rate,
        type: "discovered",
      };
    }
    return null;
  };

  const getStatusColor = (status: string) => {
    return STATUS_OPTIONS.find((s) => s.value === status)?.color || "bg-gray-500/10 text-gray-400";
  };

  return (
    <div className="divide-y divide-[var(--color-border)]">
      {creatorList.map((creator) => {
        const data = getCreatorData(creator);
        if (!data) return null;

        return (
          <div key={creator.id} className="p-4 flex items-center gap-4">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {data.image ? (
                <img
                  src={data.image}
                  alt={data.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl">
                  👤
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <Link
                href={
                  data.type === "claimed"
                    ? `/dashboard/brand/creator/${data.id}`
                    : `/dashboard/brand/discovered/${data.id}`
                }
                className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
              >
                {data.name}
              </Link>
              <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <span>{formatNumber(data.followers)} followers</span>
                {data.niche && data.niche.length > 0 && (
                  <span>{data.niche.slice(0, 2).join(", ")}</span>
                )}
              </div>
            </div>

            {/* Match Score */}
            {creator.match_score && (
              <div className="text-center px-3">
                <p className="text-lg font-bold text-[var(--color-accent)]">
                  {Math.round(creator.match_score / 10)}/10
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Match</p>
              </div>
            )}

            {/* Status Dropdown */}
            <select
              value={creator.status}
              onChange={(e) => updateStatus(creator.id, e.target.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border-0 cursor-pointer ${getStatusColor(
                creator.status
              )}`}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Remove */}
            <button
              onClick={() => removeCreator(creator.id)}
              className="p-2 text-[var(--color-text-tertiary)] hover:text-red-500 transition-colors"
              title="Remove from campaign"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
