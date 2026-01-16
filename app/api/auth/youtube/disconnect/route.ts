import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST() {
  const user = await currentUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Delete all creator posts
  await supabase
    .from("creator_posts")
    .delete()
    .eq("creator_profile_id", creatorProfile.id)
    .eq("platform", "YouTube");

  // Delete social connection
  await supabase
    .from("social_connections")
    .delete()
    .eq("user_id", dbUser.id)
    .eq("platform", "youtube");

  // Clear YouTube data from profile
  await supabase
    .from("creator_profiles")
    .update({
      youtube_channel_id: null,
      youtube_handle: null,
      youtube_subscribers: null,
      youtube_profile_image_url: null,
    })
    .eq("id", creatorProfile.id);

  return NextResponse.json({ success: true });
}
