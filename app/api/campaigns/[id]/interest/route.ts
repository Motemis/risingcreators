import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    return NextResponse.json({ error: "Not a creator" }, { status: 403 });
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    return NextResponse.json({ error: "No creator profile" }, { status: 404 });
  }

  // Check if already expressed interest in campaign_interest
  const { data: existingInterest } = await supabase
    .from("campaign_interest")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("creator_profile_id", creatorProfile.id)
    .single();

  if (existingInterest) {
    return NextResponse.json({ error: "Already expressed interest" }, { status: 400 });
  }

  // Add to campaign_interest table
  const { error: interestError } = await supabase
    .from("campaign_interest")
    .insert({
      campaign_id: campaignId,
      creator_profile_id: creatorProfile.id,
      status: "interested",
    });

  if (interestError) {
    console.error("Error adding interest:", interestError);
    return NextResponse.json({ error: interestError.message }, { status: 500 });
  }

  // Check if already exists in campaign_creators (from auto-matching)
  const { data: existingCreator } = await supabase
    .from("campaign_creators")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("creator_profile_id", creatorProfile.id)
    .single();

  if (existingCreator) {
    // UPDATE existing record to "interested" status
    await supabase
      .from("campaign_creators")
      .update({ 
        status: "interested", 
        notes: "Creator expressed interest" 
      })
      .eq("id", existingCreator.id);
  } else {
    // INSERT new record with "interested" status
    await supabase
      .from("campaign_creators")
      .insert({
        campaign_id: campaignId,
        creator_profile_id: creatorProfile.id,
        status: "interested",
        match_score: 80,
        notes: "Creator expressed interest",
      });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    return NextResponse.json({ error: "Not a creator" }, { status: 403 });
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    return NextResponse.json({ error: "No creator profile" }, { status: 404 });
  }

  // Remove from campaign_interest
  await supabase
    .from("campaign_interest")
    .delete()
    .eq("campaign_id", campaignId)
    .eq("creator_profile_id", creatorProfile.id);

  // Update campaign_creators back to "matched" (don't delete, just revert status)
  await supabase
    .from("campaign_creators")
    .update({ status: "matched", notes: null })
    .eq("campaign_id", campaignId)
    .eq("creator_profile_id", creatorProfile.id)
    .eq("status", "interested");

  return NextResponse.json({ success: true });
}
