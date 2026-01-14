import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { calculateCampaignMatchScore } from "@/lib/campaignMatch";
import CampaignCreatorCard from "./CampaignCreatorCard";

export default async function FindCreatorsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    redirect("/");
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  // Get campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("brand_profile_id", brandProfile?.id)
    .single();

  if (!campaign) {
    notFound();
  }

  // Get already added creator IDs
  const { data: existingCreators } = await supabase
    .from("campaign_creators")
    .select("discovered_creator_id, creator_profile_id")
    .eq("campaign_id", id);

  const addedDiscoveredIds = new Set(
    existingCreators?.map((c) => c.discovered_creator_id).filter(Boolean) || []
  );
  const addedClaimedIds = new Set(
    existingCreators?.map((c) => c.creator_profile_id).filter(Boolean) || []
  );

  // Build query with campaign parameters
  let query = supabase
    .from("discovered_creators")
    .select("*")
    .eq("is_hidden", false)
    .eq("status", "active")
    .is("claimed_by", null)
    .gte("followers", campaign.min_followers || 1000)
    .lte("followers", campaign.max_followers || 10000000);

  // Filter by campaign niches if set
  if (campaign.target_niches && campaign.target_niches.length > 0) {
    query = query.overlaps("niche", campaign.target_niches);
  }

  // Filter by engagement rate if set
  if (campaign.target_engagement_rate) {
    query = query.gte("engagement_rate", campaign.target_engagement_rate);
  }

  // Filter by platform if set
  if (campaign.preferred_platforms && campaign.preferred_platforms.length > 0) {
    query = query.in("platform", campaign.preferred_platforms);
  }

  const { data: discoveredCreators } = await query
    .order("brand_readiness_score", { ascending: false, nullsFirst: false })
    .limit(100);

  // Calculate campaign match scores and filter out already added
  const creatorsWithMatch = (discoveredCreators || [])
    .filter((creator) => !addedDiscoveredIds.has(creator.id))
    .map((creator) => {
      const match = calculateCampaignMatchScore(campaign, creator);
      return {
        ...creator,
        campaignMatchScore: match.score,
        campaignMatchGrade: match.grade,
        campaignMatchReasons: match.reasons,
      };
    })
    .sort((a, b) => b.campaignMatchScore - a.campaignMatchScore);

  const isPremium =
    brandProfile?.is_premium &&
    (!brandProfile.premium_until ||
      new Date(brandProfile.premium_until) > new Date());

  // Get unlocked creators
  const { data: unlockedCreators } = await supabase
    .from("unlocked_creators")
    .select("discovered_creator_id")
    .eq("brand_profile_id", brandProfile?.id);

  const unlockedIds = new Set(
    unlockedCreators?.map((u) => u.discovered_creator_id) || []
  );

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={`/dashboard/brand/campaigns/${id}`}
            className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4"
          >
            ← Back to {campaign.name}
          </Link>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Find Creators for "{campaign.name}"
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Showing creators that match your campaign criteria
          </p>
        </div>

        {/* Campaign Filters Applied */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 mb-6">
          <p className="text-sm text-[var(--color-text-tertiary)] mb-2">Filtering by:</p>
          <div className="flex flex-wrap gap-2">
            {campaign.target_niches?.map((niche: string) => (
              <span
                key={niche}
                className="px-3 py-1 rounded-full text-xs bg-[var(--color-accent-light)] text-[var(--color-accent)]"
              >
                {niche}
              </span>
            ))}
            <span className="px-3 py-1 rounded-full text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
              {campaign.min_followers?.toLocaleString()} - {campaign.max_followers?.toLocaleString()} followers
            </span>
            {campaign.target_engagement_rate && (
              <span className="px-3 py-1 rounded-full text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]">
                {campaign.target_engagement_rate}%+ engagement
              </span>
            )}
            {campaign.preferred_platforms?.map((platform: string) => (
              <span
                key={platform}
                className="px-3 py-1 rounded-full text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] capitalize"
              >
                {platform}
              </span>
            ))}
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          {creatorsWithMatch.length} creators found • Sorted by campaign match
        </p>

        {/* Creator Grid */}
        {creatorsWithMatch.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {creatorsWithMatch.map((creator) => (
              <CampaignCreatorCard
                key={creator.id}
                creator={creator}
                campaignId={id}
                isPremium={isPremium}
                isUnlocked={unlockedIds.has(creator.id)}
                brandProfileId={brandProfile?.id || ""}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No matching creators found
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Try adjusting your campaign criteria to see more results
            </p>
            <Link
              href={`/dashboard/brand/campaigns/${id}/edit`}
              className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
            >
              Edit Campaign Criteria
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
