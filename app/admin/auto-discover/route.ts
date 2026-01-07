import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  
  const adminEmails = ["justin.motes@me.com", "motemis@gmail.com"];
  if (!user || !adminEmails.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { ruleId } = await request.json();

  // Get the rule
  const { data: rule, error: ruleError } = await supabase
    .from("auto_discovery_rules")
    .select("*")
    .eq("id", ruleId)
    .single();

  if (ruleError || !rule) {
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  let totalFound = 0;
  let totalImported = 0;

  try {
    // Run search for each query
    for (const query of rule.search_queries) {
      // Search YouTube
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?` +
          `part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}` +
          `&key=${process.env.GOOGLE_API_KEY}`
      );

      const searchData = await searchResponse.json();

      if (!searchData.items || searchData.items.length === 0) continue;

      // Get channel details
      const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(",");
      
      const channelsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?` +
          `part=snippet,statistics&id=${channelIds}` +
          `&key=${process.env.GOOGLE_API_KEY}`
      );

      const channelsData = await channelsResponse.json();

      if (!channelsData.items) continue;

      // Filter by criteria
      const matchingChannels = channelsData.items.filter((channel: any) => {
        const subs = parseInt(channel.statistics.subscriberCount) || 0;
        return subs >= rule.min_followers && subs <= rule.max_followers;
      });

      totalFound += matchingChannels.length;

      // Import each matching channel
      for (const channel of matchingChannels) {
        const { error } = await supabase.from("discovered_creators").upsert(
          {
            platform: "youtube",
            platform_user_id: channel.id,
            platform_username: channel.snippet.customUrl || channel.id,
            display_name: channel.snippet.title,
            profile_image_url: channel.snippet.thumbnails?.medium?.url,
            bio: channel.snippet.description?.substring(0, 500),
            followers: parseInt(channel.statistics.subscriberCount) || 0,
            total_posts: parseInt(channel.statistics.videoCount) || 0,
            avg_views: Math.round(
              (parseInt(channel.statistics.viewCount) || 0) /
                Math.max(parseInt(channel.statistics.videoCount) || 1, 1)
            ),
            niche: rule.target_niches,
            status: "active",
            last_scraped_at: new Date().toISOString(),
          },
          { onConflict: "platform,platform_user_id" }
        );

        if (!error) {
          totalImported++;

          // Also create a snapshot for growth tracking
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
                followers: parseInt(channel.statistics.subscriberCount) || 0,
                total_posts: parseInt(channel.statistics.videoCount) || 0,
                snapshot_date: new Date().toISOString().split("T")[0],
              },
              { onConflict: "discovered_creator_id,snapshot_date" }
            );
          }
        }
      }

      // Small delay between queries to avoid rate limits
      await new Promise((r) => setTimeout(r, 500));
    }

    // Update rule's last run time
    await supabase
      .from("auto_discovery_rules")
      .update({ last_run_at: new Date().toISOString() })
      .eq("id", ruleId);

    return NextResponse.json({ found: totalFound, imported: totalImported });

  } catch (err) {
    console.error("Auto-discover error:", err);
    return NextResponse.json({ error: "Discovery failed" }, { status: 500 });
  }
}