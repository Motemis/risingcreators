import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import CreatorPostsPreview from "./CreatorPostsPreview";

function formatFollowers(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function CreatorProfilePreview() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  // If user doesn't exist, redirect to onboarding
  if (!dbUser || !dbUser.onboarded) {
    redirect("/onboarding");
  }

  // Verify user is a creator
  if (dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
        <div className="max-w-2xl mx-auto text-center py-16">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-4">
            No Profile Yet
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-6">
            Create your profile to see how brands will view you.
          </p>
          <Link
            href="/dashboard/creator/profile/edit"
            className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Create Profile
          </Link>
        </div>
      </div>
    );
  }

  const displayName =
    profile.display_name ||
    `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim() ||
    "Creator";

  const totalFollowers =
    (profile.tiktok_followers || 0) +
    (profile.instagram_followers || 0) +
    (profile.youtube_subscribers || 0) +
    (profile.twitter_followers || 0);

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        {/* Preview Banner */}
        <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-xl p-4 mb-6 flex items-center justify-between">
          <div>
            <p className="text-[var(--color-accent)] font-medium">👁 Profile Preview</p>
            <p className="text-[var(--color-text-secondary)] text-sm">
              This is how brands see your profile
            </p>
          </div>
          <Link
            href="/dashboard/creator/profile/edit"
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Edit Profile
          </Link>
        </div>

        {/* Visibility Status */}
        {!profile.is_public && (
          <div className="bg-yellow-500/10 border border-yellow-500 rounded-xl p-4 mb-6">
            <p className="text-yellow-500 font-medium">⚠️ Profile Hidden</p>
            <p className="text-[var(--color-text-secondary)] text-sm">
              Your profile is not visible to brands. Enable visibility in settings.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
          <div className="flex items-start gap-4">
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={displayName}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 bg-[var(--color-accent)] rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
                {displayName}
              </h1>
              {profile.location && (
                <p className="text-[var(--color-text-secondary)]">
                  📍 {profile.location}
                </p>
              )}
              {profile.niche && profile.niche.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.niche.map((n: string) => (
                    <span
                      key={n}
                      className="px-2 py-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] text-xs rounded-full"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {profile.tiktok_followers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(profile.tiktok_followers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">TikTok</p>
            </div>
          )}
          {profile.instagram_followers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(profile.instagram_followers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">Instagram</p>
            </div>
          )}
          {profile.youtube_subscribers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(profile.youtube_subscribers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">YouTube</p>
            </div>
          )}
          {profile.twitter_followers > 0 && (
            <div className="bg-[var(--color-bg-secondary)] rounded-xl p-4 text-center border border-[var(--color-border)]">
              <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                {formatFollowers(profile.twitter_followers)}
              </p>
              <p className="text-[var(--color-text-tertiary)] text-sm">Twitter/X</p>
            </div>
          )}
        </div>

        {/* Total Reach */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
          <div className="text-center">
            <p className="text-4xl font-bold text-[var(--color-text-primary)]">
              {formatFollowers(totalFollowers)}
            </p>
            <p className="text-[var(--color-text-secondary)]">Total Reach</p>
          </div>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
            <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-2 uppercase">
              About
            </h2>
            <p className="text-[var(--color-text-primary)]">{profile.bio}</p>
          </div>
        )}

        {/* What brands see when unlocked */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 mb-6 border border-[var(--color-border)]">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            🔓 Shown After Unlock
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-[var(--color-text-tertiary)] text-sm">Email</p>
              <p className="text-[var(--color-text-primary)]">{dbUser.email}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border)]">
              <div>
                <p className="text-[var(--color-text-tertiary)] text-sm">Per Post</p>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {profile.rate_per_post ? `$${(profile.rate_per_post / 100).toFixed(0)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] text-sm">Per Video</p>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {profile.rate_per_video ? `$${(profile.rate_per_video / 100).toFixed(0)}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] text-sm">Per Story</p>
                <p className="text-xl font-semibold text-[var(--color-text-primary)]">
                  {profile.rate_per_story ? `$${(profile.rate_per_story / 100).toFixed(0)}` : "—"}
                </p>
              </div>
            </div>

            {/* Social Links */}
            <div className="pt-4 border-t border-[var(--color-border)]">
              <p className="text-[var(--color-text-tertiary)] text-sm mb-2">Social Links</p>
              <div className="flex flex-wrap gap-3">
                {profile.tiktok_url ? (
                  <span className="text-[var(--color-accent)]">TikTok ✓</span>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">TikTok —</span>
                )}
                {profile.instagram_url ? (
                  <span className="text-[var(--color-accent)]">Instagram ✓</span>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">Instagram —</span>
                )}
                {profile.youtube_url ? (
                  <span className="text-[var(--color-accent)]">YouTube ✓</span>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">YouTube —</span>
                )}
                {profile.twitter_url ? (
                  <span className="text-[var(--color-accent)]">Twitter/X ✓</span>
                ) : (
                  <span className="text-[var(--color-text-tertiary)]">Twitter/X —</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Completeness Tips */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)]">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            💡 Profile Tips
          </h2>
          <ul className="space-y-2 text-sm">
            {!profile.bio && (
              <li className="text-[var(--color-text-secondary)]">
                ⚠️ Add a bio to tell brands about yourself
              </li>
            )}
            {!profile.rate_per_post && !profile.rate_per_video && (
              <li className="text-[var(--color-text-secondary)]">
                ⚠️ Add your rates so brands know your pricing
              </li>
            )}
            {!profile.profile_photo_url && (
              <li className="text-[var(--color-text-secondary)]">
                ⚠️ Add a profile photo to stand out
              </li>
            )}
            {(!profile.niche || profile.niche.length === 0) && (
              <li className="text-[var(--color-text-secondary)]">
                ⚠️ Select your niche to help brands find you
              </li>
            )}
            {totalFollowers === 0 && (
              <li className="text-[var(--color-text-secondary)]">
                ⚠️ Add your follower counts from at least one platform
              </li>
            )}
            {profile.bio && profile.rate_per_post && profile.profile_photo_url && profile.niche?.length > 0 && totalFollowers > 0 && (
              <li className="text-green-500">
                ✓ Your profile looks great!
              </li>
            )}
          </ul>
        </div>

        {/* Featured Posts Preview */}
        <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)] mt-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            🔓 Featured Content (Shown After Unlock)
          </h2>
          <CreatorPostsPreview creatorProfileId={profile.id} />
        </div>
      </div>
    </div>
  );
}
