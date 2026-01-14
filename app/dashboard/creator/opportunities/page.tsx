import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { calculateCreatorCampaignMatch } from "@/lib/creatorCampaignMatch";
import CampaignOpportunityCard from "./CampaignOpportunityCard";
import MissedOpportunityCard from "./MissedOpportunityCard";

export default async function CreatorOpportunitiesPage() {
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

  // Get ALL active campaigns (we'll filter and sort by match score)
  const { data: allCampaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      brand_profile:brand_profiles(company_name, logo_url, industry)
    `)
    .eq("status", "active");

  // Get creator's existing interests
  const { data: existingInterests } = await supabase
    .from("campaign_interest")
    .select("campaign_id, status")
    .eq("creator_profile_id", creatorProfile.id);

  const interestMap = new Map(
    existingInterests?.map((i) => [i.campaign_id, i.status]) || []
  );

  // Calculate match scores for ALL campaigns
  const scoredCampaigns = (allCampaigns || []).map((campaign) => {
    const match = calculateCreatorCampaignMatch(campaign, creatorProfile);
    
    // Check why they don't match (for advice)
    const minF = campaign.min_followers || 0;
    const maxF = campaign.max_followers || 10000000;
    const meetsFollowerReq = creatorFollowers >= minF && creatorFollowers <= maxF;
    
    return {
      ...campaign,
      matchScore: match.score,
      matchTier: match.tier,
      matchReasons: match.reasons,
      matchHighlights: match.highlights,
      matchMisses: match.misses,
      interestStatus: interestMap.get(campaign.id) || null,
      meetsFollowerReq,
      followerGap: !meetsFollowerReq 
        ? creatorFollowers < minF 
          ? { type: "below" as const, needed: minF, current: creatorFollowers }
          : { type: "above" as const, max: maxF, current: creatorFollowers }
        : null,
    };
  });

  // Split into matching and non-matching
  const matchingCampaigns = scoredCampaigns
    .filter((c) => c.meetsFollowerReq)
    .sort((a, b) => b.matchScore - a.matchScore);

  const nonMatchingCampaigns = scoredCampaigns
    .filter((c) => !c.meetsFollowerReq)
    .sort((a, b) => b.matchScore - a.matchScore);

  // Separate matching into tiers
  const perfectMatches = matchingCampaigns.filter((c) => c.matchTier === "perfect");
  const strongMatches = matchingCampaigns.filter((c) => c.matchTier === "strong");
  const potentialMatches = matchingCampaigns.filter((c) => c.matchTier === "potential");

  const totalBudget = matchingCampaigns.reduce(
    (sum, c) => sum + (c.budget_per_creator || 0),
    0
  );

  // Calculate missed opportunity value
  const missedBudget = nonMatchingCampaigns.reduce(
    (sum, c) => sum + (c.budget_per_creator || 0),
    0
  );

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Campaign Opportunities
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Brands looking for creators like you. Express interest to get noticed!
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[var(--color-accent)]">
              {matchingCampaigns.length}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              You Qualify For
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[var(--color-accent)]">
              {perfectMatches.length + strongMatches.length}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Strong+ Matches
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">
              {totalBudget > 0 ? `$${totalBudget.toLocaleString()}` : "—"}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Available to You
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-[var(--color-headline)]">
              {nonMatchingCampaigns.length}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Just Out of Reach
            </p>
          </div>
        </div>

        {/* Perfect Matches */}
        {perfectMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🎯</span>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Perfect Matches
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                {perfectMatches.length}
              </span>
            </div>
            <div className="space-y-4">
              {perfectMatches.map((campaign) => (
                <CampaignOpportunityCard
                  key={campaign.id}
                  campaign={campaign}
                  creatorProfileId={creatorProfile.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Strong Matches */}
        {strongMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💪</span>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Strong Matches
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]">
                {strongMatches.length}
              </span>
            </div>
            <div className="space-y-4">
              {strongMatches.map((campaign) => (
                <CampaignOpportunityCard
                  key={campaign.id}
                  campaign={campaign}
                  creatorProfileId={creatorProfile.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Potential Matches */}
        {potentialMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">👀</span>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Other Opportunities
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]">
                {potentialMatches.length}
              </span>
            </div>
            <div className="space-y-4">
              {potentialMatches.map((campaign) => (
                <CampaignOpportunityCard
                  key={campaign.id}
                  campaign={campaign}
                  creatorProfileId={creatorProfile.id}
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State for Matching */}
        {matchingCampaigns.length === 0 && (
          <div className="text-center py-12 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl mb-8">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No matching campaigns right now
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              But there are {nonMatchingCampaigns.length} campaigns you could qualify for with some growth!
            </p>
          </div>
        )}

        {/* Non-Matching Campaigns - Opportunities to Grow Into */}
        {nonMatchingCampaigns.length > 0 && (
          <div className="mb-8">
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="text-3xl">🚀</div>
                <div>
                  <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                    {nonMatchingCampaigns.length} campaigns just out of reach
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-2">
                    These brands are looking for creators in your niche, but you don't quite meet their requirements yet.
                    {missedBudget > 0 && (
                      <span className="font-medium text-[var(--color-headline)]">
                        {" "}That's ${missedBudget.toLocaleString()} in potential earnings!
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    See what you'd need to change to qualify 👇
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {nonMatchingCampaigns.slice(0, 5).map((campaign) => (
                <MissedOpportunityCard
                  key={campaign.id}
                  campaign={campaign}
                  creatorFollowers={creatorFollowers}
                />
              ))}
              
              {nonMatchingCampaigns.length > 5 && (
                <p className="text-center text-sm text-[var(--color-text-tertiary)]">
                  + {nonMatchingCampaigns.length - 5} more campaigns you could grow into
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
