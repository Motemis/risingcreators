import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (!cronSecret) return true;
  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: NextRequest) {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Running snapshot update cron job...");

  try {
    // Get all discovered creators that need updating
    const { data: creators } = await supabase
      .from("discovered_creators")
      .select("id, platform, platform_user_id")
      .eq("platform", "youtube")
      .eq("status", "active")
      .order("last_scraped_at", { ascending: true, nullsFirst: true })
      .limit(50); // Process 50 at a time to stay within API limits

    if (!creators || creators.length === 0) {
      return NextResponse.json({ message: "No creators to update" });
    }

    let updated = 0;

    // Batch channel IDs for efficient API calls
    const channelIds = creators.map((c) => c.platform_user_id).join(",");

    const channelsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?` +
        `part=statistics&id=${channelIds}` +
        `&key=${process.env.GOOGLE_API_KEY}`
    );

    const channelsData = await channelsResponse.json();

    if (!channelsData.items) {
      return NextResponse.json({ error: "Failed to fetch channel data" }, { status: 500 });
    }

    // Create a map for quick lookup
    const statsMap: Record<string, any> = {};
    channelsData.items.forEach((item: any) => {
      statsMap[item.id] = item.statistics;
    });

    // Update each creator
    for (const creator of creators) {
      const stats = statsMap[creator.platform_user_id];
      if (!stats) continue;

      const followers = parseInt(stats.subscriberCount) || 0;
      const totalPosts = parseInt(stats.videoCount) || 0;
      const totalViews = parseInt(stats.viewCount) || 0;

      // Update discovered_creators
      await supabase
        .from("discovered_creators")
        .update({
          followers,
          total_posts: totalPosts,
          avg_views: Math.round(totalViews / Math.max(totalPosts, 1)),
          last_scraped_at: new Date().toISOString(),
        })
        .eq("id", creator.id);

      // Create snapshot
      await supabase.from("creator_snapshots").upsert(
        {
          discovered_creator_id: creator.id,
          platform: "youtube",
          platform_user_id: creator.platform_user_id,
          followers,
          total_posts: totalPosts,
          snapshot_date: new Date().toISOString().split("T")[0],
        },
        { onConflict: "discovered_creator_id,snapshot_date" }
      );

      updated++;
    }

    // Calculate growth rates
    await supabase.rpc("calculate_growth_rates");

    console.log(`Updated ${updated} creators`);

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Snapshot update error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}



