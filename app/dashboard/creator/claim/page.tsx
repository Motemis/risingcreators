import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function ClaimProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Check if user already has a creator profile
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

  const { data: existingProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Claim Your Profile
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Connect your social accounts to unlock analytics and brand visibility
        </p>

        {existingProfile ? (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                You already have a profile!
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Your creator profile is set up. You can edit it anytime.
              </p>
              <Link
                href="/dashboard/creator/profile/edit"
                className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Edit Your Profile
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Coming Soon Notice */}
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
              <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
                Connect Your Accounts
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Soon you'll be able to connect your social accounts to automatically import your stats and verify your profile.
              </p>
              
              <div className="space-y-3">
                <button
                  disabled
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] opacity-50 cursor-not-allowed"
                >
                  <span className="text-xl">📱</span>
                  <span className="text-[var(--color-text-secondary)]">Connect TikTok</span>
                  <span className="ml-auto text-xs text-[var(--color-text-tertiary)]">Coming Soon</span>
                </button>
                
                <button
                  disabled
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] opacity-50 cursor-not-allowed"
                >
                  <span className="text-xl">📸</span>
                  <span className="text-[var(--color-text-secondary)]">Connect Instagram</span>
                  <span className="ml-auto text-xs text-[var(--color-text-tertiary)]">Coming Soon</span>
                </button>
                
                <button
                  disabled
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-tertiary)] opacity-50 cursor-not-allowed"
                >
                  <span className="text-xl">🎬</span>
                  <span className="text-[var(--color-text-secondary)]">Connect YouTube</span>
                  <span className="ml-auto text-xs text-[var(--color-text-tertiary)]">Coming Soon</span>
                </button>
              </div>
            </div>

            {/* Manual Setup */}
            <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-xl p-6">
              <h2 className="text-[var(--color-accent)] font-medium mb-2">
                💡 Set Up Manually Instead
              </h2>
              <p className="text-[var(--color-text-secondary)] mb-4">
                While we work on social integrations, you can manually enter your stats and profile info.
              </p>
              <Link
                href="/dashboard/creator/profile/edit"
                className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
              >
                Set Up Profile Manually
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
