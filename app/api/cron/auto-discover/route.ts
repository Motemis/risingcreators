import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { categorizeCreator, calculateRisingScore } from "@/lib/categorize";

const SWEEP_QUERIES = [
  "vlog", "tutorial", "review", "tips", "how to",
  "day in the life", "routine", "challenge", "reaction",
  "gameplay", "cooking", "workout", "travel", "haul"
];

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

  console.log("Running auto-discovery cron...");

  const minSubs = 10000;
  const maxSubs = 500000;
  let totalFound = 0;
  let totalImported = 0;
  const seenChannels = new Set<string>();

  try {
    for (const query of SWEEP_QUERIES) {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}` +
          `&key=${process.env.GOOGLE_API_KEY}`
      );

      const searchData = await searchResponse.json();
      if (!searchData.items) continue;

      const newChannelIds = searchData.items
        .map((item: any) => item.snippet.channelId)
        .filter((id: string) => !seenChannels.has(id));

      newChannelIds.forEach((id: string) => seenChannels.add(id));
      if (newChannelIds.length === 0) continue;

      const channelsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?` +
          `part=snippet,statistics&id=${newChannelIds.join(",")}` +
          `&key=${process.env.GOOGLE_API_KEY}`
      );

      const channelsData = await channelsResponse.json();
      if (!channelsData.items) continue;

      for (const channel of channelsData.items) {
        const subs = parseInt(channel.statistics.subscriberCount) || 0;
        if (subs < minSubs || subs > maxSubs) continue;

        totalFound++;

        const title = channel.snippet.title || "";
        const bio = channel.snippet.description || "";
        const niches = categorizeCreator(title, bio);
        const totalPosts = parseInt(channel.statistics.videoCount) || 0;
        const totalViews = parseInt(channel.statistics.viewCount) || 0;
        const avgViews = Math.round(totalViews / Math.max(totalPosts, 1));

        const { error } = await supabase.from("discovered_creators").upsert(
          {
            platform: "youtube",
            platform_user_id: channel.id,
            platform_username: channel.snippet.customUrl || channel.id,
            display_name: title,
            profile_image_url: channel.snippet.thumbnails?.medium?.url,
            bio: bio.substring(0, 500),
            followers: subs,
            total_posts: totalPosts,
            avg_views: avgViews,
            niche: niches,
            status: "active",
            last_scraped_at: new Date().toISOString(),
          },
          { onConflict: "platform,platform_user_id" }
        );

        if (!error) {
          totalImported++;

          const { data: creator } = await supabase
            .from("discovered_creators")
            .select("id")
            .eq("platform", "youtube")
            .eq("platform_user_id", channel.id)
            .single();

          if (creator) {
            await supabase.from("creator_snapshots").upsert(
              {
                discovered_creator_id: creator.id,
                platform: "youtube",
                platform_user_id: channel.id,
                followers: subs,
                total_posts: totalPosts,
                avg_views: avgViews,
                snapshot_date: new Date().toISOString().split("T")[0],
              },
              { onConflict: "discovered_creator_id,snapshot_date" }
            );
          }
        }
      }

      await new Promise((r) => setTimeout(r, 500));
    }

    // Calculate growth rates
    await supabase.rpc("calculate_growth_rates");

    // Update rising scores for all creators
    const { data: creators } = await supabase
      .from("discovered_creators")
      .select("id, followers, growth_rate_7d, growth_rate_30d, avg_views, total_posts");

    if (creators) {
      for (const creator of creators) {
        const score = calculateRisingScore(
          creator.followers,
          creator.growth_rate_7d,
          creator.growth_rate_30d,
          creator.avg_views || 0,
          creator.total_posts || 0
        );

        await supabase
          .from("discovered_creators")
          .update({ rising_score: score })
          .eq("id", creator.id);
      }
    }

    console.log(`Cron complete: ${totalFound} found, ${totalImported} imported`);

    return NextResponse.json({ success: true, found: totalFound, imported: totalImported });
  } catch (err) {
    console.error("Cron error:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}


