"use client";

import { useState } from "react";
import Link from "next/link";

interface CreatorProfile {
  id: string;
  display_name?: string;
  bio?: string;
  profile_photo_url?: string;
  niche?: string[];
  contact_email?: string;
  youtube_channel_id?: string;
  tiktok_handle?: string;
  instagram_handle?: string;
  twitch_handle?: string;
  rate_youtube_integration?: number;
  rate_youtube_dedicated?: number;
  rate_tiktok_post?: number;
  rate_instagram_post?: number;
  rate_instagram_story?: number;
  rate_instagram_reel?: number;
  media_kit_url?: string;
  location?: string;
}

interface ReadinessItem {
  id: string;
  label: string;
  description: string;
  points: number;
  completed: boolean;
  action?: {
    label: string;
    href: string;
  };
}

export default function BrandReadinessTile({ profile }: { profile: CreatorProfile }) {

  // Define all readiness items with their completion status
  const readinessItems: ReadinessItem[] = [
    {
      id: "photo",
      label: "Add a profile photo",
      description: "Profiles with photos get 2x more brand interest",
      points: 10,
      completed: !!profile.profile_photo_url,
      action: { label: "Upload photo", href: "/dashboard/creator/profile" },
    },
    {
      id: "bio",
      label: "Write a compelling bio",
      description: "At least 50 characters describing who you are",
      points: 10,
      completed: !!profile.bio && profile.bio.length >= 50,
      action: { label: "Edit bio", href: "/dashboard/creator/profile" },
    },
    {
      id: "niche",
      label: "Select your niches",
      description: "Help brands find you by category",
      points: 15,
      completed: !!profile.niche && profile.niche.length > 0,
      action: { label: "Set niches", href: "/dashboard/creator/profile" },
    },
    {
      id: "social",
      label: "Connect a social account",
      description: "YouTube, TikTok, or Instagram",
      points: 20,
      completed: !!profile.youtube_channel_id || !!profile.tiktok_handle || !!profile.instagram_handle,
      action: { label: "Connect accounts", href: "/dashboard/creator/profile" },
    },
    {
      id: "email",
      label: "Add contact email",
      description: "How brands will reach you",
      points: 15,
      completed: !!profile.contact_email,
      action: { label: "Add email", href: "/dashboard/creator/profile" },
    },
    {
      id: "rates",
      label: "Set your rates",
      description: "Let brands know your pricing",
      points: 15,
      completed: !!(
        profile.rate_youtube_integration ||
        profile.rate_youtube_dedicated ||
        profile.rate_tiktok_post ||
        profile.rate_instagram_post ||
        profile.rate_instagram_story ||
        profile.rate_instagram_reel
      ),
      action: { label: "Set rates", href: "/dashboard/creator/profile" },
    },
    {
      id: "location",
      label: "Add your location",
      description: "Many campaigns are geo-targeted",
      points: 5,
      completed: !!profile.location,
      action: { label: "Add location", href: "/dashboard/creator/profile" },
    },
    {
      id: "mediakit",
      label: "Upload a media kit",
      description: "Showcase your stats and past work",
      points: 10,
      completed: !!profile.media_kit_url,
      action: { label: "Upload kit", href: "/dashboard/creator/profile" },
    },
  ];

  // Calculate score
  const totalPossible = readinessItems.reduce((sum, item) => sum + item.points, 0);
  const currentScore = readinessItems
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.points, 0);
  const completedCount = readinessItems.filter((item) => item.completed).length;
  const incompleteItems = readinessItems.filter((item) => !item.completed);
  const isFullyComplete = incompleteItems.length === 0;

  // Default to collapsed
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl mb-8 overflow-hidden">
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-6 flex items-center justify-between hover:bg-[var(--color-bg-tertiary)] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="text-3xl">{isFullyComplete ? "🎉" : "✅"}</div>
          <div className="text-left">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Brand Readiness
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {isFullyComplete 
                ? "All tasks completed!" 
                : `${completedCount}/${readinessItems.length} tasks completed`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Score */}
          <div className="text-right">
            <p className={`text-2xl font-bold ${currentScore >= 70 ? "text-green-500" : currentScore >= 50 ? "text-yellow-500" : "text-[var(--color-headline)]"}`}>
              {currentScore}/{totalPossible}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {currentScore >= 70 ? "Brand ready!" : currentScore >= 50 ? "Almost there" : "Needs work"}
            </p>
          </div>

          {/* Expand/Collapse icon */}
          <svg
            className={`w-5 h-5 text-[var(--color-text-tertiary)] transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Progress bar */}
      <div className="px-6 pb-4">
        <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${currentScore >= 70 ? "bg-green-500" : currentScore >= 50 ? "bg-yellow-500" : "bg-[var(--color-headline)]"}`}
            style={{ width: `${(currentScore / totalPossible) * 100}%` }}
          />
        </div>
      </div>

      {/* Expandable checklist */}
      {isExpanded && (
        <div className="border-t border-[var(--color-border)] px-6 py-4">
          <div className="space-y-3">
            {readinessItems.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  item.completed ? "bg-green-500/5" : "bg-[var(--color-bg-tertiary)]"
                }`}
              >
                {/* Checkbox indicator */}
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    item.completed
                      ? "bg-green-500 text-white"
                      : "border-2 border-[var(--color-border-strong)]"
                  }`}
                >
                  {item.completed && (
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`font-medium ${
                        item.completed
                          ? "text-[var(--color-text-tertiary)] line-through"
                          : "text-[var(--color-text-primary)]"
                      }`}
                    >
                      {item.label}
                    </p>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        item.completed
                          ? "bg-green-500/10 text-green-500"
                          : "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                      }`}
                    >
                      +{item.points} pts
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
                    {item.description}
                  </p>
                  {!item.completed && item.action && (
                    <Link
                      href={item.action.href}
                      className="inline-block text-sm text-[var(--color-accent)] hover:underline mt-2"
                    >
                      {item.action.label} →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Tip at bottom */}
          {!isFullyComplete && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)]">
                💡 <strong>Tip:</strong> Creators with 80+ readiness scores get 2x more brand outreach.
              </p>
            </div>
          )}

          {isFullyComplete && (
            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <p className="text-sm text-green-500">
                🎉 <strong>Amazing!</strong> Your profile is fully optimized for brand partnerships.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
