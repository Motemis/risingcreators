import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { triggerCreatorOutreach } from "@/lib/creatorOutreach";

export async function POST(request: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    return NextResponse.json({ error: "Not a brand" }, { status: 403 });
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("id, company_name")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { discovered_creator_id } = body;

  if (!discovered_creator_id) {
    return NextResponse.json({ error: "discovered_creator_id required" }, { status: 400 });
  }

  // Create unlock record
  const { data: unlock, error: unlockError } = await supabase
    .from("discovered_creator_unlocks")
    .upsert(
      {
        discovered_creator_id,
        brand_user_id: dbUser.id,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "discovered_creator_id,brand_user_id" }
    )
    .select()
    .single();

  if (unlockError) {
    return NextResponse.json({ error: unlockError.message }, { status: 500 });
  }

  // Add to watchlist
  await supabase.from("watchlist_items").upsert(
    {
      brand_profile_id: brandProfile.id,
      discovered_creator_id,
      source: "discovery",
      status: "watching",
      is_unlocked: true,
      unlocked_at: new Date().toISOString(),
    },
    { onConflict: "brand_profile_id,discovered_creator_id" }
  );

  // Trigger outreach email (interest_alert template)
  const outreachResult = await triggerCreatorOutreach({
    discoveredCreatorId: discovered_creator_id,
    brandProfileId: brandProfile.id,
    action: "unlock",
  });

  return NextResponse.json({
    unlock,
    outreach: outreachResult,
    message: outreachResult.sent
      ? "Creator unlocked! We've notified them about your interest."
      : "Creator unlocked! Added to your watchlist.",
  });
}
