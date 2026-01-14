import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

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

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = await request.json();
  const { conversation_id, is_typing } = body;

  if (!conversation_id) {
    return NextResponse.json({ error: "Missing conversation_id" }, { status: 400 });
  }

  // Get user's profile
  let profileId: string;
  let userType: "brand" | "creator";

  if (dbUser.user_type === "brand") {
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!brandProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    profileId = brandProfile.id;
    userType = "brand";
  } else {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!creatorProfile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    profileId = creatorProfile.id;
    userType = "creator";
  }

  if (is_typing) {
    // Upsert typing indicator
    await supabase
      .from("typing_indicators")
      .upsert({
        conversation_id,
        user_type: userType,
        user_id: profileId,
        started_at: new Date().toISOString(),
      }, {
        onConflict: "conversation_id,user_type,user_id"
      });
  } else {
    // Remove typing indicator
    await supabase
      .from("typing_indicators")
      .delete()
      .eq("conversation_id", conversation_id)
      .eq("user_id", profileId);
  }

  return NextResponse.json({ success: true });
}
