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

  // Check if API key exists
  if (!process.env.GOOGLE_API_KEY) {
    console.error("GOOGLE_API_KEY is not set");
    return NextResponse.json({ error: "GOOGLE_API_KEY is not configured" }, { status: 500 });
  }

  // Get the rule
  const { data: rule, error: ruleError } = await supabase
    .from("auto_discovery_rules")
    .select("*")
    .eq("id", ruleId)
    .single();

  if (ruleError || !rule) {
    console.error("Rule error:", ruleError);
    return NextResponse.json({ error: "Rule not found" }, { status: 404 });
  }

  console.log("Running rule:", rule.name);
  console.log("Search queries:", rule.search_queries);

  let totalFound = 0;
  let totalImported = 0;
  const errors: string[] = [];

  try {
    // Run search for each query
    for (const query of rule.search_queries || []) {
      console.log("Searching for:", query);
      
      // Search YouTube
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
        `part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}` +
        `&key=${process.env.GOOGLE_API_KEY}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.error) {
        console.error("YouTube API error:", searchData.error);
        errors.push(`YouTube API error: ${searchData.error.message}`);
        continue;
      }

      if (!searchData.items || searchData.items.length === 0) {
        console.log("No results for query:", query);
        continue;
      }

      console.log(`Found ${searchData.items.length} channels for "${query}"`);

      // Get channel details
      const channelIds = searchData.items
        .map((item: any) => item.snippet?.channelId || item.id?.channelId)
        .filter(Boolean)
        .join(",");
      
      if (!channelIds) {
        console.log("No valid channel IDs found");
        continue;
      }

      const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?` +
        `part=snippet,statistics&id=${channelIds}` +
        `&key=${process.env.GOOGLE_API_KEY}`;
      
      const channelsResponse = await fetch(channelsUrl);
      const channelsData = await channelsResponse.json();

      if (channelsData.error) {
        console.error("YouTube channels API error:", channelsData.error);
        errors.push(`Channels API error: ${channelsData.error.message}`);
        continue;
      }

      if (!channelsData.items) {
        console.log("No channel details returned");
        continue;
      }

      // Filter by criteria
      const matchingChannels = channelsData.items.filter((channel: any) => {
        const subs = parseInt(channel.statistics?.subscriberCount) || 0;
        const meetsMin = subs >= (rule.min_followers || 0);
        const meetsMax = subs <= (rule.max_followers || 10000000);
        console.log(`Channel ${channel.snippet?.title}: ${subs} subs, meets criteria: ${meetsMin && meetsMax}`);
        return meetsMin && meetsMax;
      });

      totalFound += matchingChannels.length;
      console.log(`${matchingChannels.length} channels match follower criteria`);

      // Import each matching channel
      for (const channel of matchingChannels) {
        const subscriberCount = parseInt(channel.statistics?.subscriberCount) || 0;
        const videoCount = parseInt(channel.statistics?.videoCount) || 1;
        const viewCount = parseInt(channel.statistics?.viewCount) || 0;

        const creatorData = {
          platform: "youtube",
          platform_user_id: channel.id,
          platform_username: channel.snippet?.customUrl?.replace("@", "") || channel.id,
          display_name: channel.snippet?.title || "Unknown",
          profile_image_url: channel.snippet?.thumbnails?.medium?.url || null,
          bio: channel.snippet?.description?.substring(0, 500) || null,
          followers: subscriberCount,
          total_posts: videoCount,
          avg_views: Math.round(viewCount / Math.max(videoCount, 1)),
          niche: rule.target_niches || [],
          status: "active",
          is_hidden: false,
          discovered_at: new Date().toISOString(),
          last_scraped_at: new Date().toISOString(),
        };

        console.log("Importing:", creatorData.display_name);

        const { error: upsertError } = await supabase
          .from("discovered_creators")
          .upsert(creatorData, { 
            onConflict: "platform,platform_user_id",
            ignoreDuplicates: false 
          });

        if (upsertError) {
          console.error("Upsert error:", upsertError);
          errors.push(`Import error for ${channel.snippet?.title}: ${upsertError.message}`);
        } else {
          totalImported++;

          // Create snapshot for growth tracking
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
                followers: subscriberCount,
                total_posts: videoCount,
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
      .update({ 
        last_run_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("id", ruleId);

    console.log("Discovery complete:", { found: totalFound, imported: totalImported, errors });

    return NextResponse.json({ 
      found: totalFound, 
      imported: totalImported,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (err) {
    console.error("Auto-discover error:", err);
    return NextResponse.json({ 
      error: "Discovery failed: " + (err instanceof Error ? err.message : String(err)) 
    }, { status: 500 });
  }
}
