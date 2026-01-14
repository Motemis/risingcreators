import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
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

  let unreadCount = 0;

  if (dbUser.user_type === "brand") {
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (brandProfile) {
      // Get all conversations for this brand
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("brand_profile_id", brandProfile.id)
        .eq("status", "active");

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        
        // Count unread messages from creators
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .eq("sender_type", "creator")
          .is("read_at", null);

        unreadCount = count || 0;
      }
    }
  } else {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (creatorProfile) {
      // Get all conversations for this creator
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .eq("creator_profile_id", creatorProfile.id)
        .eq("status", "active");

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        
        // Count unread messages from brands
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .in("conversation_id", conversationIds)
          .eq("sender_type", "brand")
          .is("read_at", null);

        unreadCount = count || 0;
      }
    }
  }

  return NextResponse.json({ unreadCount });
}
