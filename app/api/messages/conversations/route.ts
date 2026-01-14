import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { triggerCreatorOutreach } from "@/lib/creatorOutreach";

// GET - List conversations for current user
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

  let conversations;

  if (dbUser.user_type === "brand") {
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!brandProfile) {
      return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        creator_profile:creator_profiles(
          id,
          display_name,
          profile_photo_url,
          youtube_profile_image_url
        ),
        campaign:campaigns(
          id,
          name
        ),
        messages(
          id,
          content,
          sender_type,
          created_at,
          read_at
        )
      `
      )
      .eq("brand_profile_id", brandProfile.id)
      .eq("status", "active")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    conversations = data?.map((conv) => ({
      ...conv,
      unread_count:
        conv.messages?.filter((m: any) => m.sender_type === "creator" && !m.read_at).length || 0,
      last_message: conv.messages?.[conv.messages.length - 1] || null,
    }));
  } else {
    // Creator
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("conversations")
      .select(
        `
        *,
        brand_profile:brand_profiles(
          id,
          company_name,
          logo_url
        ),
        campaign:campaigns(
          id,
          name
        ),
        messages(
          id,
          content,
          sender_type,
          created_at,
          read_at
        )
      `
      )
      .eq("creator_profile_id", creatorProfile.id)
      .eq("status", "active")
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    conversations = data?.map((conv) => ({
      ...conv,
      unread_count:
        conv.messages?.filter((m: any) => m.sender_type === "brand" && !m.read_at).length || 0,
      last_message: conv.messages?.[conv.messages.length - 1] || null,
    }));
  }

  return NextResponse.json({ conversations, userType: dbUser.user_type });
}

// POST - Create new conversation (brand only)
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
    return NextResponse.json({ error: "Only brands can start conversations" }, { status: 403 });
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("id, company_name, logo_url")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { creator_profile_id, discovered_creator_id, campaign_id, title, initial_message } = body;

  if (!creator_profile_id && !discovered_creator_id) {
    return NextResponse.json(
      { error: "Must provide creator_profile_id or discovered_creator_id" },
      { status: 400 }
    );
  }

  if (!title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  // Determine if creator has joined
  let creatorHasJoined = false;
  let actualCreatorProfileId = creator_profile_id;

  if (creator_profile_id) {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id, user_id")
      .eq("id", creator_profile_id)
      .single();

    creatorHasJoined = !!creatorProfile?.user_id;
  } else if (discovered_creator_id) {
    // Check if discovered creator has been claimed
    const { data: discoveredCreator } = await supabase
      .from("discovered_creators")
      .select("*, creator_identity:creator_identities(creator_profile_id)")
      .eq("id", discovered_creator_id)
      .single();

    if (discoveredCreator?.creator_identity?.creator_profile_id) {
      actualCreatorProfileId = discoveredCreator.creator_identity.creator_profile_id;

      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("user_id")
        .eq("id", actualCreatorProfileId)
        .single();

      creatorHasJoined = !!creatorProfile?.user_id;
    }
  }

  if (creatorHasJoined && actualCreatorProfileId) {
    // Creator has joined - create real conversation
    // Check if conversation already exists for this campaign
    if (campaign_id) {
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("brand_profile_id", brandProfile.id)
        .eq("creator_profile_id", actualCreatorProfileId)
        .eq("campaign_id", campaign_id)
        .single();

      if (existing) {
        return NextResponse.json({
          error: "Conversation already exists",
          conversation_id: existing.id,
        });
      }
    }

    // Create conversation
    const { data: conversation, error: convError } = await supabase
      .from("conversations")
      .insert({
        brand_profile_id: brandProfile.id,
        creator_profile_id: actualCreatorProfileId,
        campaign_id: campaign_id || null,
        title,
        last_message_at: initial_message ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (convError) {
      return NextResponse.json({ error: convError.message }, { status: 500 });
    }

    // Add initial message if provided
    if (initial_message) {
      await supabase.from("messages").insert({
        conversation_id: conversation.id,
        sender_type: "brand",
        sender_id: brandProfile.id,
        content: initial_message,
      });
    }

    // Add to watchlist
    await supabase.from("watchlist_items").upsert(
      {
        brand_profile_id: brandProfile.id,
        creator_profile_id: actualCreatorProfileId,
        source: "direct_outreach",
        status: "reached_out",
        is_unlocked: true,
      },
      { onConflict: "brand_profile_id,creator_profile_id" }
    );

    return NextResponse.json({ conversation });
  } else {
    // Creator has NOT joined - queue message and trigger outreach
    if (!discovered_creator_id) {
      return NextResponse.json(
        { error: "Cannot message unclaimed creator without discovered_creator_id" },
        { status: 400 }
      );
    }

    // Get discovered creator info for watchlist
    const { data: discoveredCreator } = await supabase
      .from("discovered_creators")
      .select("*")
      .eq("id", discovered_creator_id)
      .single();

    // Queue the message in creator_invites
    const { data: invite, error: inviteError } = await supabase
      .from("creator_invites")
      .upsert(
        {
          brand_profile_id: brandProfile.id,
          creator_identity_id: discoveredCreator?.creator_identity_id,
          queued_message: initial_message,
          queued_conversation_title: title,
          queued_campaign_id: campaign_id || null,
          status: "pending",
        },
        {
          onConflict: "brand_profile_id,creator_identity_id",
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    // Trigger outreach email
    const outreachResult = await triggerCreatorOutreach({
      discoveredCreatorId: discovered_creator_id,
      brandProfileId: brandProfile.id,
      action: "message",
      campaignId: campaign_id,
      campaignName: campaign_id
        ? (await supabase.from("campaigns").select("name").eq("id", campaign_id).single()).data
            ?.name
        : undefined,
      messagePreview: initial_message,
    });

    // Add to watchlist
    await supabase.from("watchlist_items").upsert(
      {
        brand_profile_id: brandProfile.id,
        discovered_creator_id: discovered_creator_id,
        source: "direct_outreach",
        status: "reached_out",
        is_unlocked: true,
      },
      { onConflict: "brand_profile_id,discovered_creator_id" }
    );

    return NextResponse.json({
      queued: true,
      message: outreachResult.sent
        ? "Message sent! We've notified the creator."
        : "Message queued! We'll deliver it when the creator joins.",
      outreach: outreachResult,
    });
  }
}
