"use client";

import { useState } from "react";
import Link from "next/link";

interface Creator {
  id: string;
  campaign_id: string;
  creator_profile_id: string;
  status: string;
  match_score: number | null;
  agreed_rate: number | null;
  notes: string | null;
  added_at: string;
  contacted_at: string | null;
  completed_at: string | null;
  declined_reason: string | null;
  declined_message: string | null;
  payment_status: string | null;
  creator_profile: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    youtube_profile_image_url: string | null;
    youtube_subscribers: number | null;
    tiktok_followers: number | null;
    instagram_followers: number | null;
    contact_email: string | null;
    niche: string[] | null;
  } | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  brief: string | null;
  target_niches: string[] | null;
  min_followers: number | null;
  max_followers: number | null;
  budget_per_creator: number | null;
  preferred_platforms: string[] | null;
  deliverables: string | null;
  start_date: string | null;
  end_date: string | null;
}

type FilterType = "all" | "interested" | "matched" | "active" | "completed" | "declined";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function CampaignDashboard({ 
  campaign, 
  creators 
}: { 
  campaign: Campaign; 
  creators: Creator[];
}) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // Group creators by status
  const interestedCreators = creators.filter((c) => c.status === "interested");
  const matchedCreators = creators.filter((c) => c.status === "matched" || c.status === "lead");
  const activeCreators = creators.filter((c) => 
    ["contacted", "negotiating", "confirmed", "content_submitted"].includes(c.status)
  );
  const completedCreators = creators.filter((c) => c.status === "completed");
  const declinedCreators = creators.filter((c) => c.status === "declined");

  // Get filtered creators based on active filter
  const getFilteredCreators = () => {
    switch (activeFilter) {
      case "interested": return interestedCreators;
      case "matched": return matchedCreators;
      case "active": return activeCreators;
      case "completed": return completedCreators;
      case "declined": return declinedCreators;
      default: return [];
    }
  };

  const filteredCreators = getFilteredCreators();

  // Stats tiles config
  const tiles = [
    { 
      key: "interested" as FilterType, 
      label: "Interested", 
      count: interestedCreators.length, 
      borderColor: "border-purple-500/30",
      textColor: "text-purple-500",
      bgActive: "bg-purple-500",
    },
    { 
      key: "matched" as FilterType, 
      label: "Matched", 
      count: matchedCreators.length, 
      borderColor: "border-[var(--color-border)]",
      textColor: "text-gray-400",
      bgActive: "bg-gray-500",
    },
    { 
      key: "active" as FilterType, 
      label: "In Progress", 
      count: activeCreators.length, 
      borderColor: "border-[var(--color-border)]",
      textColor: "text-blue-500",
      bgActive: "bg-blue-500",
    },
    { 
      key: "completed" as FilterType, 
      label: "Completed", 
      count: completedCreators.length, 
      borderColor: "border-[var(--color-border)]",
      textColor: "text-green-500",
      bgActive: "bg-green-500",
    },
    { 
      key: "declined" as FilterType, 
      label: "Declined", 
      count: declinedCreators.length, 
      borderColor: "border-[var(--color-border)]",
      textColor: "text-red-400",
      bgActive: "bg-red-500",
    },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      interested: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Interested" },
      matched: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Matched" },
      lead: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Lead" },
      contacted: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Contacted" },
      negotiating: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Negotiating" },
      confirmed: { bg: "bg-green-500/10", text: "text-green-500", label: "Confirmed" },
      content_submitted: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Content Submitted" },
      completed: { bg: "bg-green-500/10", text: "text-green-600", label: "Completed" },
      declined: { bg: "bg-red-500/10", text: "text-red-500", label: "Declined" },
    };
    const c = config[status] || { bg: "bg-gray-500/10", text: "text-gray-500", label: status };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  const handleTileClick = (key: FilterType) => {
    if (activeFilter === key) {
      setActiveFilter("all"); // Toggle off
    } else {
      setActiveFilter(key);
    }
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard/brand/campaigns"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          ← Back to Campaigns
        </Link>

        {/* Campaign Header */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                  {campaign.name}
                </h1>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
                    campaign.status === "active"
                      ? "bg-green-500/10 text-green-500"
                      : campaign.status === "draft"
                      ? "bg-gray-500/10 text-gray-500"
                      : "bg-blue-500/10 text-blue-500"
                  }`}
                >
                  {campaign.status}
                </span>
              </div>
              {campaign.brief && (
                <p className="text-[var(--color-text-secondary)] max-w-2xl">{campaign.brief}</p>
              )}
            </div>
            <Link
              href="/dashboard/brand/discover"
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
            >
              + Add Creators
            </Link>
          </div>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3">
              <p className="text-[var(--color-text-tertiary)] text-xs mb-1">Niches</p>
              <p className="text-[var(--color-text-primary)] font-medium">
                {campaign.target_niches?.join(", ") || "—"}
              </p>
            </div>
            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3">
              <p className="text-[var(--color-text-tertiary)] text-xs mb-1">Followers</p>
              <p className="text-[var(--color-text-primary)] font-medium">
                {formatNumber(campaign.min_followers || 0)} - {formatNumber(campaign.max_followers || 0)}
              </p>
            </div>
            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3">
              <p className="text-[var(--color-text-tertiary)] text-xs mb-1">Budget/Creator</p>
              <p className="text-[var(--color-text-primary)] font-medium">
                {campaign.budget_per_creator ? `$${campaign.budget_per_creator}` : "—"}
              </p>
            </div>
            <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3">
              <p className="text-[var(--color-text-tertiary)] text-xs mb-1">Platforms</p>
              <p className="text-[var(--color-text-primary)] font-medium capitalize">
                {campaign.preferred_platforms?.join(", ") || "—"}
              </p>
            </div>
          </div>
        </div>

        {/* Clickable Stats Tiles */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {tiles.map((tile) => {
            const isActive = activeFilter === tile.key;
            return (
              <button
                key={tile.key}
                onClick={() => handleTileClick(tile.key)}
                className={`rounded-xl p-4 text-center transition-all ${
                  isActive
                    ? `${tile.bgActive} text-white shadow-lg scale-105`
                    : `bg-[var(--color-bg-secondary)] border ${tile.borderColor} hover:scale-102 hover:shadow-md`
                }`}
              >
                <p className={`text-3xl font-bold ${isActive ? "text-white" : tile.textColor}`}>
                  {tile.count}
                </p>
                <p className={`text-sm ${isActive ? "text-white/80" : "text-[var(--color-text-tertiary)]"}`}>
                  {tile.label}
                </p>
              </button>
            );
          })}
        </div>

        {/* Filtered Results */}
        {activeFilter !== "all" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {tiles.find(t => t.key === activeFilter)?.label} ({filteredCreators.length})
              </h2>
              <button
                onClick={() => setActiveFilter("all")}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Clear filter ✕
              </button>
            </div>

            {filteredCreators.length === 0 ? (
              <div className="text-center py-12 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
                <p className="text-[var(--color-text-tertiary)]">No creators in this category</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredCreators.map((cc) => {
                  const creatorName = cc.creator_profile?.display_name || "Unknown Creator";
                  const creatorImage = cc.creator_profile?.profile_photo_url || cc.creator_profile?.youtube_profile_image_url;
                  const followers = cc.creator_profile
                    ? (cc.creator_profile.youtube_subscribers || 0) +
                      (cc.creator_profile.tiktok_followers || 0) +
                      (cc.creator_profile.instagram_followers || 0)
                    : 0;

                  return (
                    <div
                      key={cc.id}
                      className={`bg-[var(--color-bg-secondary)] border rounded-xl p-5 ${
                        cc.status === "interested" 
                          ? "border-purple-500/30 bg-gradient-to-r from-purple-500/5 to-transparent" 
                          : cc.status === "declined"
                          ? "border-[var(--color-border)] opacity-70"
                          : "border-[var(--color-border)]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {creatorImage ? (
                            <img
                              src={creatorImage}
                              alt={creatorName}
                              className={`w-12 h-12 rounded-full object-cover ${cc.status === "declined" ? "grayscale" : ""}`}
                            />
                          ) : (
                            <div className={`w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl ${cc.status === "declined" ? "grayscale" : ""}`}>
                              👤
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-[var(--color-text-primary)]">
                                {creatorName}
                              </h3>
                              {getStatusBadge(cc.status)}
                              {cc.status === "interested" && (
                                <span className="text-purple-500 text-sm">wants to work with you!</span>
                              )}
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)]">
                              {formatNumber(followers)} followers
                              {cc.creator_profile?.niche && cc.creator_profile.niche.length > 0 && 
                                ` • ${cc.creator_profile.niche.slice(0, 2).join(", ")}`
                              }
                            </p>
                            {cc.creator_profile?.contact_email && cc.status !== "declined" && (
                              <p className="text-xs text-[var(--color-text-tertiary)]">
                                {cc.creator_profile.contact_email}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Show rate info for active/completed */}
                          {cc.agreed_rate && (
                            <div className="text-right mr-4">
                              <p className="text-lg font-bold text-green-500">${cc.agreed_rate}</p>
                              <p className="text-xs text-[var(--color-text-tertiary)]">Agreed</p>
                            </div>
                          )}
                          
                          {/* Show match score for matched */}
                          {cc.status === "matched" && cc.match_score && (
                            <div className="text-right mr-4">
                              <p className="text-lg font-bold text-[var(--color-text-primary)]">{cc.match_score}%</p>
                              <p className="text-xs text-[var(--color-text-tertiary)]">Match</p>
                            </div>
                          )}

                          <Link
                            href={`/dashboard/brand/deals/${cc.id}`}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                              cc.status === "interested"
                                ? "bg-purple-500 text-white hover:bg-purple-600"
                                : cc.status === "declined"
                                ? "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                                : "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                            }`}
                          >
                            {cc.status === "interested" ? "Review & Respond" : 
                             cc.status === "declined" ? "View History" : "Manage"}
                          </Link>
                        </div>
                      </div>

                      {/* Show declined info */}
                      {cc.status === "declined" && (cc.declined_reason || cc.declined_message) && (
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-2">
                          {cc.declined_reason && (
                            <p className="text-sm text-[var(--color-text-tertiary)]">
                              <span className="font-medium">🔒 Internal:</span> {cc.declined_reason}
                            </p>
                          )}
                          {cc.declined_message && (
                            <p className="text-sm text-[var(--color-text-tertiary)]">
                              <span className="font-medium">💬 Sent:</span> "{cc.declined_message}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Show payment status for active deals */}
                      {["confirmed", "content_submitted", "completed"].includes(cc.status) && (
                        <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-4 text-xs text-[var(--color-text-tertiary)]">
                          {cc.payment_status && (
                            <span className={cc.payment_status === "paid" ? "text-green-500" : ""}>
                              💰 Payment: {cc.payment_status}
                            </span>
                          )}
                          {cc.completed_at && (
                            <span>✅ Completed: {new Date(cc.completed_at).toLocaleDateString()}</span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Default View - Show Interested (priority) and Active (in progress) */}
        {activeFilter === "all" && (
          <>
            {/* Interested - Always show if any */}
            {interestedCreators.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                    🙋 Interested Creators
                  </h2>
                  <span className="px-3 py-1 bg-purple-500/10 text-purple-500 rounded-full text-sm font-medium animate-pulse">
                    {interestedCreators.length} waiting for your response!
                  </span>
                </div>
                <div className="space-y-4">
                  {interestedCreators.map((cc) => {
                    const creatorName = cc.creator_profile?.display_name || "Unknown Creator";
                    const creatorImage = cc.creator_profile?.profile_photo_url || cc.creator_profile?.youtube_profile_image_url;
                    const followers = cc.creator_profile
                      ? (cc.creator_profile.youtube_subscribers || 0) +
                        (cc.creator_profile.tiktok_followers || 0) +
                        (cc.creator_profile.instagram_followers || 0)
                      : 0;

                    return (
                      <div
                        key={cc.id}
                        className="bg-gradient-to-r from-purple-500/10 to-purple-500/5 border border-purple-500/30 rounded-xl p-5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {creatorImage ? (
                              <img
                                src={creatorImage}
                                alt={creatorName}
                                className="w-14 h-14 rounded-full object-cover border-2 border-purple-500/30"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl border-2 border-purple-500/30">
                                👤
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-[var(--color-text-primary)] text-lg">
                                  {creatorName}
                                </h3>
                                <span className="text-purple-500 text-sm">wants to work with you!</span>
                              </div>
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                {formatNumber(followers)} followers
                              </p>
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/brand/deals/${cc.id}`}
                            className="px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600"
                          >
                            Review & Respond
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Deals - Always show if any */}
            {activeCreators.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  🔥 In Progress ({activeCreators.length})
                </h2>
                <div className="space-y-3">
                  {activeCreators.map((cc) => {
                    const creatorName = cc.creator_profile?.display_name || "Unknown Creator";
                    const creatorImage = cc.creator_profile?.profile_photo_url || cc.creator_profile?.youtube_profile_image_url;

                    return (
                      <div
                        key={cc.id}
                        className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {creatorImage ? (
                              <img src={creatorImage} alt={creatorName} className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">👤</div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-[var(--color-text-primary)]">{creatorName}</p>
                                {getStatusBadge(cc.status)}
                              </div>
                              {cc.agreed_rate && (
                                <p className="text-sm text-green-500">${cc.agreed_rate} agreed</p>
                              )}
                            </div>
                          </div>
                          <Link
                            href={`/dashboard/brand/deals/${cc.id}`}
                            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
                          >
                            Manage
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {creators.length === 0 && (
              <div className="text-center py-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
                <div className="text-5xl mb-4">👥</div>
                <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                  No creators yet
                </h2>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Creators who express interest will appear here
                </p>
                <Link
                  href="/dashboard/brand/discover"
                  className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
                >
                  Discover Creators
                </Link>
              </div>
            )}

            {/* Hint to click tiles */}
            {creators.length > 0 && interestedCreators.length === 0 && activeCreators.length === 0 && (
              <div className="text-center py-12 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
                <p className="text-[var(--color-text-tertiary)]">
                  👆 Click on the tiles above to view creators in each category
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
