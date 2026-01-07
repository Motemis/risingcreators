import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";
import { categorizeCreator, calculateRisingScore } from "@/lib/categorize";

// Broad search terms that cover most creators
const SWEEP_QUERIES = [
  "vlog", "tutorial", "review", "tips", "how to",
  "day in the life", "routine", "challenge", "reaction",
  "gameplay", "cooking", "workout", "travel", "haul"
];

export async function POST(request: NextRequest) {
  const user = await currentUser();

  const adminEmails = ["justin.motes@me.com", "motemis@gmail.com"];
  if (!user || !adminEmails.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { minSubs = 10000, maxSubs = 500000 } = await request.json();

  console.log(`Starting broad sweep: ${minSubs} - ${maxSubs} subscribers`);

  let totalFound = 0;
  let totalImported = 0;
  const seenChannels = new Set<string>();

  try {
    for (const query of SWEEP_QUERIES) {
      console.log(`Sweeping: "${query}"`);

      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}` +
          `&key=${process.env.GOOGLE_API_KEY}`
      );

      const searchData = await searchResponse.json();

      if (searchData.error) {
        console.error("API error:", searchData.error);
        continue;
      }

      if (!searchData.items || searchData.items.length === 0) continue;

      // Filter out already seen channels
      const newChannelIds = searchData.items
        .map((item: any) => item.snippet.channelId)
        .filter((id: string) => !seenChannels.has(id));

      newChannelIds.forEach((id: string) => seenChannels.add(id));

      if (newChannelIds.length === 0) continue;

      // Get channel details
      const channelsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?` +
          `part=snippet,statistics&id=${newChannelIds.join(",")}` +
          `&key=${process.env.GOOGLE_API_KEY}`
      );

      const channelsData = await channelsResponse.json();

      if (!channelsData.items) continue;

      // Filter and import
      for (const channel of channelsData.items) {
        const subs = parseInt(channel.statistics.subscriberCount) || 0;

        if (subs < minSubs || subs > maxSubs) continue;

        totalFound++;

        const title = channel.snippet.title || "";
        const bio = channel.snippet.description || "";
        const niches = categorizeCreator(title, bio);

        const followers = subs;
        const totalPosts = parseInt(channel.statistics.videoCount) || 0;
        const totalViews = parseInt(channel.statistics.viewCount) || 0;
        const avgViews = Math.round(totalViews / Math.max(totalPosts, 1));

        const risingScore = calculateRisingScore(followers, null, null, avgViews, totalPosts);

        const { error } = await supabase.from("discovered_creators").upsert(
          {
            platform: "youtube",
            platform_user_id: channel.id,
            platform_username: channel.snippet.customUrl || channel.id,
            display_name: title,
            profile_image_url: channel.snippet.thumbnails?.medium?.url,
            bio: bio.substring(0, 500),
            followers,
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

          // Create snapshot
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
                followers,
                total_posts: totalPosts,
                avg_views: avgViews,
                snapshot_date: new Date().toISOString().split("T")[0],
              },
              { onConflict: "discovered_creator_id,snapshot_date" }
            );
          }
        }
      }

      // Rate limit protection
      await new Promise((r) => setTimeout(r, 500));
    }

    console.log(`Sweep complete: ${totalFound} found, ${totalImported} imported`);

    return NextResponse.json({
      success: true,
      found: totalFound,
      imported: totalImported,
      queries: SWEEP_QUERIES.length,
    });
  } catch (err) {
    console.error("Sweep error:", err);
    return NextResponse.json({ error: "Sweep failed" }, { status: 500 });
  }
}