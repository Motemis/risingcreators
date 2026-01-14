import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// GET - Get single conversation with messages
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  // Get conversation
  const { data: conversation, error } = await supabase
    .from("conversations")
    .select(`
      *,
      brand_profile:brand_profiles(
        id,
        company_name,
        logo_url
      ),
      creator_profile:creator_profiles(
        id,
        display_name,
        profile_photo_url,
        youtube_profile_image_url
      ),
      campaign:campaigns(
        id,
        name
      )
    `)
    .eq("id", id)
    .single();

  if (error || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Verify user has access
  let hasAccess = false;
  let profileId: string | null = null;

  if (dbUser.user_type === "brand") {
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();
    
    hasAccess = brandProfile?.id === conversation.brand_profile_id;
    profileId = brandProfile?.id || null;
  } else {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();
    
    hasAccess = creatorProfile?.id === conversation.creator_profile_id;
    profileId = creatorProfile?.id || null;
  }

  if (!hasAccess) {
    return NextResponse.json({ error: "Access denied" }, { status: 403 });
  }

  // Get messages
  const { data: messages } = await supabase
    .from("messages")
    .select(`
      *,
      attachments:message_attachments(*)
    `)
    .eq("conversation_id", id)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  // Mark messages as read
  const otherSenderType = dbUser.user_type === "brand" ? "creator" : "brand";
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .eq("sender_type", otherSenderType)
    .is("read_at", null);

  // Update last read timestamp
  const updateField = dbUser.user_type === "brand" ? "brand_last_read_at" : "creator_last_read_at";
  await supabase
    .from("conversations")
    .update({ [updateField]: new Date().toISOString() })
    .eq("id", id);

  return NextResponse.json({ 
    conversation, 
    messages, 
    userType: dbUser.user_type,
    profileId 
  });
}
