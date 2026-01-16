"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  platform: string;
  post_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  views: number | null;
  likes: number | null;
  comments: number | null;
  posted_at: string | null;
  is_featured: boolean | null;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

function getPlatformIcon(platform: string): string {
  switch (platform?.toLowerCase()) {
    case "youtube": return "🎬";
    case "tiktok": return "📱";
    case "instagram": return "📸";
    case "twitch": return "🎮";
    default: return "📌";
  }
}

function getPlatformColor(platform: string): string {
  switch (platform?.toLowerCase()) {
    case "youtube": return "bg-red-500";
    case "tiktok": return "bg-black";
    case "instagram": return "bg-gradient-to-br from-purple-500 to-pink-500";
    case "twitch": return "bg-purple-600";
    default: return "bg-gray-500";
  }
}

export default function FeaturedContentManager({ posts }: { posts: Post[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  
  const featuredPosts = posts.filter((p) => p.is_featured);
  const unfeaturedPosts = posts.filter((p) => !p.is_featured);

  const toggleFeatured = async (postId: string, currentlyFeatured: boolean) => {
    // Check limit
    if (!currentlyFeatured && featuredPosts.length >= 10) {
      alert("You can only feature up to 10 posts. Remove one first.");
      return;
    }

    setSaving(true);
    
    const { error } = await supabase
      .from("creator_posts")
      .update({ is_featured: !currentlyFeatured })
      .eq("id", postId);

    if (error) {
      console.error("Error updating featured status:", error);
      alert("Failed to update. Please try again.");
    }

    setSaving(false);
    router.refresh();
  };

  if (posts.length === 0) {
    return (
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Featured Content</h3>
        <div className="text-center py-8">
          <p className="text-4xl mb-3">🎬</p>
          <p className="text-[var(--color-text-secondary)] mb-2">No content synced yet</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Connect your YouTube, TikTok, or Instagram to showcase your best work
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-[var(--color-text-primary)]">Featured Content</h3>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {featuredPosts.length}/10 featured • Click to add or remove
          </p>
        </div>
        {unfeaturedPosts.length > 0 && (
          <button
            onClick={() => setShowAllPosts(!showAllPosts)}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {showAllPosts ? "Show less" : `Browse all (${posts.length})`}
          </button>
        )}
      </div>

      {/* Featured Posts */}
      {featuredPosts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          {featuredPosts.map((post) => (
            <button
              key={post.id}
              onClick={() => toggleFeatured(post.id, true)}
              disabled={saving}
              className="group relative aspect-video rounded-lg overflow-hidden border-2 border-[var(--color-accent)] bg-[var(--color-bg-tertiary)]"
            >
              {post.thumbnail_url ? (
                <img
                  src={post.thumbnail_url}
                  alt={post.caption || "Post"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-2xl">
                  {getPlatformIcon(post.platform)}
                </div>
              )}
              
              {/* Platform badge */}
              <div className={`absolute top-1 left-1 w-5 h-5 rounded-full ${getPlatformColor(post.platform)} flex items-center justify-center`}>
                <span className="text-xs text-white">{getPlatformIcon(post.platform)}</span>
              </div>

              {/* Featured checkmark */}
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-medium">Remove</span>
              </div>

              {/* Views */}
              {post.views && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                  {formatNumber(post.views)} views
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 mb-4 border border-dashed border-[var(--color-border)] rounded-lg">
          <p className="text-[var(--color-text-tertiary)]">No featured content selected</p>
          <p className="text-sm text-[var(--color-text-tertiary)]">Click posts below to feature them</p>
        </div>
      )}

      {/* All Posts (expandable) */}
      {(showAllPosts || featuredPosts.length === 0) && unfeaturedPosts.length > 0 && (
        <>
          <div className="border-t border-[var(--color-border)] pt-4 mt-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3">
              Available to feature ({unfeaturedPosts.length})
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {unfeaturedPosts.map((post) => (
                <button
                  key={post.id}
                  onClick={() => toggleFeatured(post.id, false)}
                  disabled={saving || featuredPosts.length >= 10}
                  className={`group relative aspect-video rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] ${
                    featuredPosts.length >= 10 ? "opacity-50 cursor-not-allowed" : "hover:border-[var(--color-accent)]"
                  }`}
                >
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      {getPlatformIcon(post.platform)}
                    </div>
                  )}

                  {/* Platform badge */}
                  <div className={`absolute top-1 left-1 w-5 h-5 rounded-full ${getPlatformColor(post.platform)} flex items-center justify-center`}>
                    <span className="text-xs text-white">{getPlatformIcon(post.platform)}</span>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {featuredPosts.length >= 10 ? "Limit reached" : "Add to featured"}
                    </span>
                  </div>

                  {/* Views */}
                  {post.views && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-xs text-white">
                      {formatNumber(post.views)} views
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
