import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

// GET - List watchlist items with filters
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

  if (!dbUser || dbUser.user_type !== "brand") {
    return NextResponse.json({ error: "Not a brand" }, { status: 403 });
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get("campaign_id");
  const source = searchParams.get("source");
  const status = searchParams.get("status");
  const isUnlocked = searchParams.get("is_unlocked");
  const niche = searchParams.get("niche");
  const tag = searchParams.get("tag");
  const noCampaign = searchParams.get("no_campaign");

  // Build query - use brand_id (existing column)
  let query = supabase
    .from("watchlist_items")
    .select(
      `
      *,
      creator_profile:creator_profiles(
        id,
        display_name,
        profile_photo_url,
        youtube_profile_image_url,
        youtube_subscribers,
        tiktok_followers,
        instagram_followers,
        niche,
        contact_email,
        engagement_rate,
        brand_readiness_score
      ),
      discovered_creator:discovered_creators(
        id,
        name,
        channel_title,
        thumbnail_url,
        subscriber_count,
        platform,
        primary_niche
      ),
      campaign:campaigns(
        id,
        name
      )
    `
    )
    .eq("brand_id", brandProfile.id)
    .order("created_at", { ascending: false });

  // Apply filters
  if (campaignId) {
    query = query.eq("campaign_id", campaignId);
  }

  if (noCampaign === "true") {
    query = query.is("campaign_id", null);
  }

  if (source) {
    query = query.eq("source", source);
  }

  if (status) {
    query = query.eq("status", status);
  }

  if (isUnlocked === "true") {
    query = query.eq("is_unlocked", true);
  } else if (isUnlocked === "false") {
    query = query.eq("is_unlocked", false);
  }

  if (tag) {
    query = query.contains("tags", [tag]);
  }

  const { data: items, error } = await query;

  if (error) {
    console.error("Watchlist query error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter by niche if specified
  let filteredItems = items || [];
  if (niche) {
    filteredItems = filteredItems.filter((item) => {
      const creatorNiche = item.creator_profile?.niche || [];
      const discoveredNiche = item.discovered_creator?.primary_niche;
      return creatorNiche.includes(niche) || discoveredNiche === niche;
    });
  }

  // Get unique tags and campaigns for filter options
  const allTags = new Set<string>();
  const allCampaigns = new Map<string, string>();

  (items || []).forEach((item) => {
    item.tags?.forEach((t: string) => allTags.add(t));
    if (item.campaign) {
      allCampaigns.set(item.campaign.id, item.campaign.name);
    }
  });

  return NextResponse.json({
    items: filteredItems,
    filterOptions: {
      tags: Array.from(allTags),
      campaigns: Array.from(allCampaigns.entries()).map(([id, name]) => ({ id, name })),
    },
  });
}

// POST - Add to watchlist
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
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const {
    creator_profile_id,
    discovered_creator_id,
    source = "manual",
    campaign_id,
    status = "watching",
    is_unlocked = false,
    notes,
    tags,
  } = body;

  if (!creator_profile_id && !discovered_creator_id) {
    return NextResponse.json(
      { error: "Must provide creator_profile_id or discovered_creator_id" },
      { status: 400 }
    );
  }

  // Check if already exists
  let existingQuery = supabase
    .from("watchlist_items")
    .select("id")
    .eq("brand_id", brandProfile.id);

  if (creator_profile_id) {
    existingQuery = existingQuery.eq("creator_profile_id", creator_profile_id);
  } else {
    existingQuery = existingQuery.eq("discovered_creator_id", discovered_creator_id);
  }

  const { data: existing } = await existingQuery.single();

  if (existing) {
    // Update existing item
    const updateData: Record<string, any> = {};
    if (source !== "manual") updateData.source = source;
    if (campaign_id) updateData.campaign_id = campaign_id;
    if (status) updateData.status = status;
    if (is_unlocked) {
      updateData.is_unlocked = true;
      updateData.unlocked_at = new Date().toISOString();
    }
    if (notes) updateData.notes = notes;
    if (tags) updateData.tags = tags;

    const { data: updated, error } = await supabase
      .from("watchlist_items")
      .update(updateData)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: updated, updated: true });
  }

  // Create new item
  const { data: item, error } = await supabase
    .from("watchlist_items")
    .insert({
      brand_id: brandProfile.id,
      creator_profile_id: creator_profile_id || null,
      discovered_creator_id: discovered_creator_id || null,
      source,
      campaign_id: campaign_id || null,
      status,
      is_unlocked,
      unlocked_at: is_unlocked ? new Date().toISOString() : null,
      notes: notes || null,
      tags: tags || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Watchlist insert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item, created: true });
}

// PUT - Update watchlist item
export async function PUT(request: Request) {
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
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const body = await request.json();
  const { id, status, notes, tags, is_unlocked, campaign_id } = body;

  if (!id) {
    return NextResponse.json({ error: "Item ID required" }, { status: 400 });
  }

  const updateData: Record<string, any> = {};
  if (status !== undefined) updateData.status = status;
  if (notes !== undefined) updateData.notes = notes;
  if (tags !== undefined) updateData.tags = tags;
  if (campaign_id !== undefined) updateData.campaign_id = campaign_id;
  if (is_unlocked !== undefined) {
    updateData.is_unlocked = is_unlocked;
    if (is_unlocked) updateData.unlocked_at = new Date().toISOString();
  }

  const { data: item, error } = await supabase
    .from("watchlist_items")
    .update(updateData)
    .eq("id", id)
    .eq("brand_id", brandProfile.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item });
}

// DELETE - Remove from watchlist
export async function DELETE(request: Request) {
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
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Item ID required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("watchlist_items")
    .delete()
    .eq("id", id)
    .eq("brand_id", brandProfile.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
