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
  const { conversation_id, content, attachments } = body;

  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Get conversation to verify access
  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversation_id)
    .single();

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  // Get user's profile and verify access
  let senderId: string;
  let senderType: "brand" | "creator";

  if (dbUser.user_type === "brand") {
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!brandProfile || brandProfile.id !== conversation.brand_profile_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    senderId = brandProfile.id;
    senderType = "brand";
  } else {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!creatorProfile || creatorProfile.id !== conversation.creator_profile_id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if creator is allowed to message (brand must have sent first)
    const { data: brandMessages } = await supabase
      .from("messages")
      .select("id")
      .eq("conversation_id", conversation_id)
      .eq("sender_type", "brand")
      .limit(1);

    if (!brandMessages || brandMessages.length === 0) {
      return NextResponse.json({ 
        error: "You cannot send the first message. Please wait for the brand to reach out." 
      }, { status: 403 });
    }

    senderId = creatorProfile.id;
    senderType = "creator";
  }

  // Create message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_type: senderType,
      sender_id: senderId,
      content: content.trim(),
    })
    .select()
    .single();

  if (messageError) {
    return NextResponse.json({ error: messageError.message }, { status: 500 });
  }

  // Add attachments if any
  if (attachments && attachments.length > 0) {
    const attachmentRecords = attachments.map((att: any) => ({
      message_id: message.id,
      file_name: att.file_name,
      file_type: att.file_type,
      file_size: att.file_size,
      file_url: att.file_url,
    }));

    await supabase.from("message_attachments").insert(attachmentRecords);
  }

  // Clear typing indicator
  await supabase
    .from("typing_indicators")
    .delete()
    .eq("conversation_id", conversation_id)
    .eq("user_id", senderId);

  return NextResponse.json({ message });
}
