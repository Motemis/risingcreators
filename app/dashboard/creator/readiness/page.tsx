import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function ReadinessPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user and profile to calculate real score
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

  // Calculate profile completeness
  let profileScore = 0;
  if (profile) {
    if (profile.display_name) profileScore += 3;
    if (profile.bio) profileScore += 3;
    if (profile.location) profileScore += 2;
    if (profile.niche && profile.niche.length > 0) profileScore += 4;
    if (profile.rate_per_post || profile.rate_per_video) profileScore += 4;
    if (profile.tiktok_url || profile.instagram_url || profile.youtube_url) profileScore += 4;
  }

  // Mock other scores for now
  const score = {
    total: 14 + 16 + 10 + profileScore + 16,
    growth: 18,
    engagement: 16,
    consistency: 10,
    profile: profileScore,
    niche: 16,
  };

  const getBarColor = (value: number, max: number) => {
    const percent = (value / max) * 100;
    if (percent >= 70) return "bg-green-500";
    if (percent >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Brand Readiness</h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            See how ready you are for brand partnerships
          </p>
        </div>

        {/* Score */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Your Brand Readiness Score
          </h2>
          <div className="flex items-center gap-6">
            <div className="text-6xl font-bold text-[var(--color-text-primary)]">{score.total}</div>
            <div>
              <div className="text-xl text-[var(--color-text-secondary)]">/100</div>
              <div className={`text-sm mt-1 ${score.total >= 70 ? "text-green-500" : score.total >= 50 ? "text-yellow-500" : "text-red-500"}`}>
                {score.total >= 70 ? "Ready for brand deals" : score.total >= 50 ? "Almost there" : "Needs improvement"}
              </div>
            </div>
          </div>
          <div className="mt-4 bg-[var(--color-bg-tertiary)] rounded-full h-4">
            <div 
              className="bg-[var(--color-accent)] h-4 rounded-full transition-all" 
              style={{ width: `${score.total}%` }}
            />
          </div>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-2">
            Creators who hit 80+ get 2x more brand outreach
          </p>
        </div>

        {/* Score Breakdown */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Score Breakdown
          </h2>
          <div className="space-y-5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Growth Rate</span>
                <span className="text-[var(--color-text-primary)] font-medium">{score.growth}/20</span>
              </div>
              <div className="bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div className={`${getBarColor(score.growth, 20)} h-2 rounded-full`} style={{ width: `${(score.growth/20)*100}%` }} />
              </div>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-1">You're growing fast. Keep it up.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Engagement</span>
                <span className="text-[var(--color-text-primary)] font-medium">{score.engagement}/20</span>
              </div>
              <div className="bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div className={`${getBarColor(score.engagement, 20)} h-2 rounded-full`} style={{ width: `${(score.engagement/20)*100}%` }} />
              </div>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-1">Above average for your size.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Consistency</span>
                <span className="text-[var(--color-text-primary)] font-medium">{score.consistency}/20</span>
              </div>
              <div className="bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div className={`${getBarColor(score.consistency, 20)} h-2 rounded-full`} style={{ width: `${(score.consistency/20)*100}%` }} />
              </div>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-1">You've missed weeks recently. Brands want reliable.</p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Profile Completeness</span>
                <span className="text-[var(--color-text-primary)] font-medium">{score.profile}/20</span>
              </div>
              <div className="bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div className={`${getBarColor(score.profile, 20)} h-2 rounded-full`} style={{ width: `${(score.profile/20)*100}%` }} />
              </div>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-1">
                {score.profile < 16 ? "Complete your profile to improve this score." : "Your profile is looking good!"}
              </p>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[var(--color-text-secondary)]">Niche Clarity</span>
                <span className="text-[var(--color-text-primary)] font-medium">{score.niche}/20</span>
              </div>
              <div className="bg-[var(--color-bg-tertiary)] rounded-full h-2">
                <div className={`${getBarColor(score.niche, 20)} h-2 rounded-full`} style={{ width: `${(score.niche/20)*100}%` }} />
              </div>
              <p className="text-[var(--color-text-tertiary)] text-sm mt-1">Your content is clearly focused.</p>
            </div>
          </div>
        </div>

        {/* Top Opportunities */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
            Your Top Opportunities
          </h2>
          <div className="space-y-4">
            {score.profile < 20 && (
              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-[var(--color-text-primary)] font-medium">Complete Your Profile</h3>
                  <span className="text-green-500 text-sm">+{20 - score.profile} points</span>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                  Add your rates, bio, and social links. Brands filter for complete profiles.
                </p>
                <Link 
                  href="/dashboard/creator/profile/edit"
                  className="text-[var(--color-accent)] text-sm mt-2 inline-block hover:underline"
                >
                  Edit profile →
                </Link>
              </div>
            )}

            {score.consistency < 15 && (
              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-[var(--color-text-primary)] font-medium">Post More Consistently</h3>
                  <span className="text-green-500 text-sm">+{15 - score.consistency} points</span>
                </div>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                  You averaged 2.1 posts/week last month. Hit 3+/week to improve this score.
                </p>
              </div>
            )}

            {score.total >= 75 && (
              <div className="bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-lg p-4">
                <h3 className="text-[var(--color-accent)] font-medium">🎉 You're doing great!</h3>
                <p className="text-[var(--color-text-secondary)] text-sm mt-1">
                  Your profile is well-optimized for brand discovery. Keep up the consistent posting!
                </p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
