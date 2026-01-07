import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CreatorProfileForm from "./CreatorProfileForm";
import ConnectYouTube from "./ConnectYouTube";
import FeaturedContentManager from "./FeaturedContentManager";

export default async function CreatorProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; error?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  // Get social connections
  const { data: youtubeConnection } = await supabase
    .from("social_connections")
    .select("*")
    .eq("user_id", dbUser.id)
    .eq("platform", "youtube")
    .single();

  // Get all posts for featured content selection
  const { data: posts } = await supabase
    .from("creator_posts")
    .select("*")
    .eq("creator_profile_id", profile?.id)
    .order("views", { ascending: false });

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Your Profile
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          This is how brands will see you. Make it count.
        </p>

        {/* Success/Error Messages */}
        {params.success === "youtube_connected" && (
          <div className="bg-green-500/10 border border-green-500 rounded-lg p-4 mb-6">
            <p className="text-green-500 font-medium">
              ✓ YouTube connected and videos synced!
            </p>
          </div>
        )}
        {params.error && (
          <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-500 font-medium">
              Error connecting. Please try again.
            </p>
          </div>
        )}

        {/* Social Connections */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
            Connected Accounts
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4">
            Connect your social accounts to verify your profile and sync your best content.
          </p>

          <div className="space-y-3">
            <ConnectYouTube existingConnection={youtubeConnection} />

            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border)] opacity-50">
              <span className="text-xl">📱</span>
              <span className="text-[var(--color-text-secondary)]">TikTok - Coming Soon</span>
            </div>
            <div className="flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border)] opacity-50">
              <span className="text-xl">📸</span>
              <span className="text-[var(--color-text-secondary)]">Instagram - Coming Soon</span>
            </div>
          </div>
        </div>

        {/* Featured Content Manager */}
        {posts && posts.length > 0 && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Featured Content
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              Select up to 15 pieces of content to showcase to brands. These will appear on your profile.
            </p>

            <FeaturedContentManager posts={posts} />
          </div>
        )}

        {/* Profile Details */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            Profile Details
          </h2>
          <CreatorProfileForm userId={dbUser.id} existingProfile={profile} />
        </div>
      </div>
    </div>
  );
}