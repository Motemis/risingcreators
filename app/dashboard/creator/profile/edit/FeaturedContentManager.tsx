"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Post {
  id: string;
  platform: string;
  post_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes: number;
  comments: number;
  views: number;
  is_featured: boolean;
  posted_at: string;
}

const MAX_FEATURED = 15;

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function FeaturedContentManager({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState<Set<string>>(
    new Set(posts.filter((p) => p.is_featured).map((p) => p.id))
  );

  const platforms = [...new Set(posts.map((p) => p.platform))];
  const featuredCount = selected.size;

  const toggleFeatured = (postId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(postId)) {
      newSelected.delete(postId);
    } else if (newSelected.size < MAX_FEATURED) {
      newSelected.add(postId);
    }
    setSelected(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    try {
      // Update all posts
      for (const post of posts) {
        await supabase
          .from("creator_posts")
          .update({ is_featured: selected.has(post.id) })
          .eq("id", post.id);
      }

      setMessage("✓ Featured content saved!");
      router.refresh();
    } catch (err) {
      setMessage("Error saving. Please try again.");
    }

    setSaving(false);
  };

  const selectTopByMetric = (metric: "views" | "likes" | "comments", count: number) => {
    const sorted = [...posts].sort((a, b) => b[metric] - a[metric]);
    const topIds = sorted.slice(0, count).map((p) => p.id);
    setSelected(new Set(topIds));
  };

  const clearAll = () => setSelected(new Set());

  const platformIcon: Record<string, string> = {
    YouTube: "🎬",
    TikTok: "📱",
    Instagram: "📸",
    Twitter: "🐦",
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[var(--color-text-secondary)]">
          No content synced yet. Connect your social accounts above to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with count and actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">
            {featuredCount}
          </span>
          <span className="text-[var(--color-text-secondary)]">
            /{MAX_FEATURED} featured
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => selectTopByMetric("views", 15)}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
          >
            Top by Views
          </button>
          <button
            onClick={() => selectTopByMetric("likes", 15)}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
          >
            Top by Likes
          </button>
          <button
            onClick={() => selectTopByMetric("comments", 15)}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)] hover:text-[var(--color-accent)]"
          >
            Top by Comments
          </button>
          <button
            onClick={clearAll}
            className="text-xs px-3 py-1.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${(featuredCount / MAX_FEATURED) * 100}%` }}
        />
      </div>

      {/* Content by platform */}
      {platforms.map((platform) => {
        const platformPosts = posts.filter((p) => p.platform === platform);
        const platformFeaturedCount = platformPosts.filter((p) =>
          selected.has(p.id)
        ).length;

        return (
          <div key={platform} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[var(--color-text-primary)] font-medium flex items-center gap-2">
                <span>{platformIcon[platform] || "📹"}</span>
                {platform}
                <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                  ({platformPosts.length} videos)
                </span>
              </h3>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {platformFeaturedCount} featured
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {platformPosts.map((post) => {
                const isSelected = selected.has(post.id);
                const canSelect = isSelected || featuredCount < MAX_FEATURED;

                return (
                  <button
                    key={post.id}
                    onClick={() => canSelect && toggleFeatured(post.id)}
                    disabled={!canSelect && !isSelected}
                    className={`text-left rounded-lg overflow-hidden border-2 transition-all ${
                      isSelected
                        ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent-light)]"
                        : canSelect
                        ? "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                        : "border-[var(--color-border)] opacity-40 cursor-not-allowed"
                    }`}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-[var(--color-bg-tertiary)] relative">
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt={post.caption || "Video"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">
                          {platformIcon[platform] || "📹"}
                        </div>
                      )}

                      {/* Selection badge */}
                      <div
                        className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isSelected
                            ? "bg-[var(--color-accent)] text-white"
                            : "bg-black/50 text-white/70"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </div>

                      {/* Stats overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                        <div className="flex gap-2 text-xs text-white">
                          {post.views > 0 && (
                            <span>👁 {formatNumber(post.views)}</span>
                          )}
                          {post.likes > 0 && (
                            <span>❤️ {formatNumber(post.likes)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-2">
                      {post.caption && (
                        <p className="text-xs text-[var(--color-text-primary)] line-clamp-2 mb-1">
                          {post.caption}
                        </p>
                      )}
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {formatDate(post.posted_at)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Save button */}
      <div className="sticky bottom-0 bg-[var(--color-bg-secondary)] pt-4 pb-2 border-t border-[var(--color-border)] flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[var(--color-accent)] text-white px-6 py-2.5 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Featured Content"}
        </button>
        {message && (
          <span
            className={`text-sm ${
              message.startsWith("✓") ? "text-green-500" : "text-red-500"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}


