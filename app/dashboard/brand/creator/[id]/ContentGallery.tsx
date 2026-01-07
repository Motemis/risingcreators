"use client";

import { useState } from "react";

interface Post {
  id: string;
  platform: string;
  post_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes: number;
  comments: number;
  views: number;
  posted_at: string;
}

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

export default function ContentGallery({ posts }: { posts: Post[] }) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const platformIcon: Record<string, string> = {
    YouTube: "🎬",
    TikTok: "📱",
    Instagram: "📸",
    Twitter: "🐦",
  };

  const platforms = [...new Set(posts.map((p) => p.platform))];

  const handlePrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedIndex !== null && selectedIndex < posts.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") handlePrev();
    if (e.key === "ArrowRight") handleNext();
    if (e.key === "Escape") setSelectedIndex(null);
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Gallery Grid */}
      <div className="space-y-6">
        {platforms.map((platform) => {
          const platformPosts = posts.filter((p) => p.platform === platform);

          return (
            <div key={platform}>
              <h3 className="text-[var(--color-text-primary)] font-medium mb-3 flex items-center gap-2">
                <span>{platformIcon[platform] || "📹"}</span>
                {platform}
                <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                  ({platformPosts.length})
                </span>
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {platformPosts.map((post, idx) => {
                  const globalIndex = posts.findIndex((p) => p.id === post.id);

                  return (
                    <button
                      key={post.id}
                      onClick={() => setSelectedIndex(globalIndex)}
                      className="text-left rounded-lg overflow-hidden border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all group"
                    >
                      <div className="aspect-video bg-[var(--color-bg-tertiary)] relative">
                        {post.thumbnail_url ? (
                          <img
                            src={post.thumbnail_url}
                            alt={post.caption || "Content"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">
                            {platformIcon[platform] || "📹"}
                          </div>
                        )}

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                            View Details
                          </span>
                        </div>
                      </div>

                      <div className="p-2">
                        {post.caption && (
                          <p className="text-sm text-[var(--color-text-primary)] line-clamp-2 mb-1">
                            {post.caption}
                          </p>
                        )}
                        <div className="flex gap-2 text-xs text-[var(--color-text-tertiary)]">
                          {post.views > 0 && <span>👁 {formatNumber(post.views)}</span>}
                          {post.likes > 0 && <span>❤️ {formatNumber(post.likes)}</span>}
                          {post.comments > 0 && <span>💬 {formatNumber(post.comments)}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div
            className="bg-[var(--color-bg-secondary)] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2">
                <span>{platformIcon[posts[selectedIndex].platform] || "📹"}</span>
                <span className="font-medium text-[var(--color-text-primary)]">
                  {posts[selectedIndex].platform}
                </span>
                <span className="text-sm text-[var(--color-text-tertiary)]">
                  {selectedIndex + 1} of {posts.length}
                </span>
              </div>
              <button
                onClick={() => setSelectedIndex(null)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-2xl"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="flex flex-col md:flex-row">
              {/* Thumbnail */}
              <div className="md:w-2/3 bg-black flex items-center justify-center">
                {posts[selectedIndex].thumbnail_url ? (
                  <img
                    src={posts[selectedIndex].thumbnail_url}
                    alt={posts[selectedIndex].caption || "Content"}
                    className="max-h-[60vh] w-full object-contain"
                  />
                ) : (
                  <div className="text-6xl py-20">
                    {platformIcon[posts[selectedIndex].platform] || "📹"}
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="md:w-1/3 p-4 space-y-4">
                {posts[selectedIndex].caption && (
                  <div>
                    <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Title</p>
                    <p className="text-[var(--color-text-primary)]">
                      {posts[selectedIndex].caption}
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Published</p>
                  <p className="text-[var(--color-text-primary)]">
                    {formatDate(posts[selectedIndex].posted_at)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                      {formatNumber(posts[selectedIndex].views)}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Views</p>
                  </div>
                  <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                      {formatNumber(posts[selectedIndex].likes)}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Likes</p>
                  </div>
                  <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-[var(--color-text-primary)]">
                      {formatNumber(posts[selectedIndex].comments)}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">Comments</p>
                  </div>
                </div>

                <a
                  href={posts[selectedIndex].post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[var(--color-accent)] text-white text-center py-2.5 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
                >
                  Watch on {posts[selectedIndex].platform} ↗
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--color-border)]">
              <button
                onClick={handlePrev}
                disabled={selectedIndex === 0}
                className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-bg-primary)]"
              >
                ← Previous
              </button>
              <button
                onClick={handleNext}
                disabled={selectedIndex === posts.length - 1}
                className="px-4 py-2 rounded-lg bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--color-bg-primary)]"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
