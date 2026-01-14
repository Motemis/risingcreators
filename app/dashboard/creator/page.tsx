import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculateCreatorCampaignMatch } from "@/lib/creatorCampaignMatch";

export default async function CreatorDashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    redirect("/onboarding/creator");
  }

  const creatorFollowers =
    (creatorProfile.youtube_subscribers || 0) +
    (creatorProfile.tiktok_followers || 0) +
    (creatorProfile.instagram_followers || 0);

  // Get campaign stats
  const { data: allCampaigns } = await supabase
    .from("campaigns")
    .select("*")
    .eq("status", "active");

  // Calculate matches
  const campaignStats = {
    total: allCampaigns?.length || 0,
    matching: 0,
    strongMatches: 0,
    inYourNiche: 0,
    totalBudget: 0,
    missedBudget: 0,
  };

  const matchingNiches = new Set<string>();

  (allCampaigns || []).forEach((campaign) => {
    const match = calculateCreatorCampaignMatch(campaign, creatorProfile);
    const minF = campaign.min_followers || 0;
    const maxF = campaign.max_followers || 10000000;
    const meetsFollowerReq = creatorFollowers >= minF && creatorFollowers <= maxF;

    // Check niche overlap
    const hasNicheOverlap = campaign.target_niches?.some((n: string) =>
      creatorProfile.niche?.includes(n)
    );

    if (hasNicheOverlap) {
      campaignStats.inYourNiche++;
      campaign.target_niches?.forEach((n: string) => {
        if (creatorProfile.niche?.includes(n)) {
          matchingNiches.add(n);
        }
      });
    }

    if (meetsFollowerReq) {
      campaignStats.matching++;
      campaignStats.totalBudget += campaign.budget_per_creator || 0;
      if (match.score >= 50) {
        campaignStats.strongMatches++;
      }
    } else {
      campaignStats.missedBudget += campaign.budget_per_creator || 0;
    }
  });

  // Get recent campaign interest
  const { data: recentInterests } = await supabase
    .from("campaign_interest")
    .select("*, campaign:campaigns(name)")
    .eq("creator_profile_id", creatorProfile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Calculate brand readiness score
  let readinessScore = 0;
  if (creatorProfile.profile_photo_url) readinessScore += 10;
  if (creatorProfile.bio && creatorProfile.bio.length > 50) readinessScore += 15;
  if (creatorProfile.niche && creatorProfile.niche.length > 0) readinessScore += 15;
  if (creatorProfile.youtube_channel_id) readinessScore += 20;
  if (creatorProfile.contact_email) readinessScore += 15;
  if (creatorProfile.rate_youtube_integration || creatorProfile.rate_tiktok_post) readinessScore += 15;
  if (creatorProfile.media_kit_url) readinessScore += 10;

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Welcome back, {creatorProfile.display_name || "Creator"}!
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Here's what's happening with brand opportunities
          </p>
        </div>

        {/* Campaign Opportunity Alert */}
        {campaignStats.matching > 0 ? (
          <Link
            href="/dashboard/creator/opportunities"
            className="block bg-[var(--color-accent)] rounded-xl p-6 mb-6 text-white hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎯</div>
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {campaignStats.strongMatches > 0
                      ? `${campaignStats.strongMatches} campaigns are a great match for you!`
                      : `${campaignStats.matching} campaigns you qualify for`}
                  </h2>
                  <p className="text-white/80">
                    {campaignStats.totalBudget > 0
                      ? `Up to $${campaignStats.totalBudget.toLocaleString()} in potential earnings`
                      : "Brands are looking for creators like you"}
                  </p>
                </div>
              </div>
              <div className="text-white/80">
                View all →
              </div>
            </div>
          </Link>
        ) : campaignStats.inYourNiche > 0 ? (
          <Link
            href="/dashboard/creator/opportunities"
            className="block bg-[var(--color-headline)] rounded-xl p-6 mb-6 text-white hover:opacity-90 transition-opacity"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">📈</div>
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    {campaignStats.inYourNiche} brands looking for {[...matchingNiches].slice(0, 2).join(" & ")} creators
                  </h2>
                  <p className="text-white/80">
                    You're close! Grow your audience to unlock ${campaignStats.missedBudget.toLocaleString()}+ in opportunities
                  </p>
                </div>
              </div>
              <div className="text-white/80">
                See what you need →
              </div>
            </div>
          </Link>
        ) : (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">📋</div>
              <div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {campaignStats.total} active campaigns on Rising Creators
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  Complete your profile to start matching with brands
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Your Followers</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {creatorFollowers.toLocaleString()}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Brand Readiness</p>
            <p className={`text-2xl font-bold ${readinessScore >= 70 ? "text-[var(--color-accent)]" : readinessScore >= 50 ? "text-[var(--color-headline)]" : "text-[var(--color-headline)]"}`}>
              {readinessScore}/100
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Campaigns You Match</p>
            <p className="text-2xl font-bold text-[var(--color-accent)]">
              {campaignStats.matching}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)] mb-1">Just Out of Reach</p>
            <p className="text-2xl font-bold text-[var(--color-headline)]">
              {campaignStats.total - campaignStats.matching}
            </p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Brand Readiness Card */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                Brand Readiness
              </h3>
              <Link
                href="/dashboard/creator/readiness"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                Improve score →
              </Link>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[var(--color-text-secondary)]">Your score</span>
                <span className={`font-medium ${readinessScore >= 70 ? "text-[var(--color-accent)]" : "text-[var(--color-headline)]"}`}>
                  {readinessScore}/100
                </span>
              </div>
              <div className="h-2 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${readinessScore >= 70 ? "bg-[var(--color-accent)]" : "bg-[var(--color-headline)]"}`}
                  style={{ width: `${readinessScore}%` }}
                />
              </div>
            </div>

            {readinessScore < 70 && (
              <div className="text-sm text-[var(--color-text-secondary)]">
                <p className="mb-2">Quick wins to improve:</p>
                <ul className="space-y-1">
                  {!creatorProfile.profile_photo_url && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-headline)]"></span>
                      Add a profile photo (+10)
                    </li>
                  )}
                  {!creatorProfile.contact_email && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-headline)]"></span>
                      Add contact email (+15)
                    </li>
                  )}
                  {(!creatorProfile.bio || creatorProfile.bio.length < 50) && (
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-headline)]"></span>
                      Write a compelling bio (+15)
                    </li>
                  )}
                </ul>
              </div>
            )}

            {readinessScore >= 70 && (
              <p className="text-sm text-[var(--color-accent)]">
                ✓ Your profile is brand-ready! Brands can see you're professional.
              </p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--color-text-primary)]">
                Your Interest History
              </h3>
            </div>

            {recentInterests && recentInterests.length > 0 ? (
              <div className="space-y-3">
                {recentInterests.map((interest: any) => (
                  <div
                    key={interest.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {interest.campaign?.name || "Campaign"}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {new Date(interest.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        interest.status === "interested"
                          ? "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                          : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
                      }`}
                    >
                      {interest.status === "interested" ? "Interest sent" : interest.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-[var(--color-text-tertiary)] mb-2">
                  No activity yet
                </p>
                <Link
                  href="/dashboard/creator/opportunities"
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Browse campaigns →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* FOMO Section - Campaigns in Your Niche */}
        {campaignStats.inYourNiche > 0 && campaignStats.matching < campaignStats.inYourNiche && (
          <div className="mt-8 bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-semibold text-[var(--color-text-primary)] mb-2">
                  You're missing out on {campaignStats.inYourNiche - campaignStats.matching} campaigns in your niche
                </h3>
                <p className="text-[var(--color-text-secondary)] mb-3">
                  Brands posted {campaignStats.inYourNiche} campaigns looking for{" "}
                  <span className="font-medium text-[var(--color-accent)]">
                    {[...matchingNiches].join(", ")}
                  </span>{" "}
                  creators, but you don't meet their follower requirements yet.
                </p>
                <div className="flex gap-3">
                  <Link
                    href="/dashboard/creator/opportunities"
                    className="text-sm text-[var(--color-accent)] hover:underline"
                  >
                    See what you need to qualify →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
