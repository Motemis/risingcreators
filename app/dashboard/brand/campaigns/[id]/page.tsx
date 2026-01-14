import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CampaignDashboard from "./CampaignDashboard";

export default async function CampaignDetailPage({
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

  if (!brandProfile) {
    redirect("/onboarding/brand");
  }

  // Get campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("brand_profile_id", brandProfile.id)
    .single();

  if (!campaign) {
    notFound();
  }

  // Get ALL campaign_creators for this campaign
  const { data: campaignCreators } = await supabase
    .from("campaign_creators")
    .select("*")
    .eq("campaign_id", id);

  // Get creator profiles separately
  const creatorProfileIds = campaignCreators?.map(cc => cc.creator_profile_id).filter(Boolean) || [];
  
  let creatorProfiles: any[] = [];
  if (creatorProfileIds.length > 0) {
    const { data } = await supabase
      .from("creator_profiles")
      .select("*")
      .in("id", creatorProfileIds);
    creatorProfiles = data || [];
  }

  // Merge data
  const enrichedCreators = campaignCreators?.map(cc => ({
    ...cc,
    creator_profile: creatorProfiles.find(cp => cp.id === cc.creator_profile_id) || null
  })) || [];

  return (
    <CampaignDashboard 
      campaign={campaign} 
      creators={enrichedCreators} 
    />
  );
}
