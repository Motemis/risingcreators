import { supabase } from "@/lib/supabase";

interface Post {
  id: string;
  platform: string;
  post_url: string;
  thumbnail_url: string | null;
  caption: string | null;
  likes: number;
  comments: number;
  views: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function CreatorPostsPreview({
  creatorProfileId,
}: {
  creatorProfileId: string;
}) {
  const { data: posts } = await supabase
    .from("creator_posts")
    .select("*")
    .eq("creator_profile_id", creatorProfileId)
    .order("posted_at", { ascending: false })
    .limit(12);

  if (!posts || posts.length === 0) {
    return (
      <p className="text-[var(--color-text-secondary)] text-sm">
        No posts yet. Sync your YouTube videos to showcase your content.
      </p>
    );
  }

  // Group posts by platform
  const postsByPlatform: Record<string, Post[]> = {};
  posts.forEach((post) => {
    if (!postsByPlatform[post.platform]) {
      postsByPlatform[post.platform] = [];
    }
    if (postsByPlatform[post.platform].length < 3) {
      postsByPlatform[post.platform].push(post);
    }
  });

  const platforms = Object.keys(postsByPlatform);

  return (
    <div className="space-y-6">
      {platforms.map((platform) => (
        <div key={platform}>
          <h3 className="text-[var(--color-text-primary)] font-medium mb-3 flex items-center gap-2">
            {platform === "TikTok" && "📱"}
            {platform === "Instagram" && "📸"}
            {platform === "YouTube" && "🎬"}
            {platform === "Twitter" && "🐦"}
            {platform}
          </h3>

          <div className="grid grid-cols-3 gap-4">
            {postsByPlatform[platform].map((post) => (
              <a
                key={post.id}
                href={post.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="aspect-video rounded-lg overflow-hidden bg-[var(--color-bg-tertiary)] relative">
                  {post.thumbnail_url ? (
                    <img
                      src={post.thumbnail_url}
                      alt={post.caption || "Post"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">
                      {platform === "YouTube" && "🎬"}
                    </div>
                  )}
                </div>

                {/* Title */}
                {post.caption && (
                  <p className="text-sm text-[var(--color-text-primary)] mt-2 line-clamp-2 group-hover:text-[var(--color-accent)]">
                    {post.caption}
                  </p>
                )}

                {/* Stats */}
                <div className="flex gap-3 mt-1 text-xs text-[var(--color-text-tertiary)]">
                  {post.views > 0 && (
                    <span>👁 {formatNumber(post.views)}</span>
                  )}
                  {post.likes > 0 && (
                    <span>❤️ {formatNumber(post.likes)}</span>
                  )}
                  {post.comments > 0 && (
                    <span>💬 {formatNumber(post.comments)}</span>
                  )}
                </div>
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}