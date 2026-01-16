import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all active rules
  const { data: rules } = await supabase
    .from("auto_discovery_rules")
    .select("*")
    .eq("is_active", true);

  if (!rules || rules.length === 0) {
    return NextResponse.json({ message: "No active rules" });
  }

  const results = [];

  for (const rule of rules) {
    try {
      // Run discovery for each rule (reuse the logic)
      const result = await runDiscoveryForRule(rule);
      results.push({ rule: rule.name, ...result });
    } catch (err) {
      results.push({ rule: rule.name, error: String(err) });
    }
  }

  return NextResponse.json({ results });
}

async function runDiscoveryForRule(rule: any) {
  let totalFound = 0;
  let totalImported = 0;

  for (const query of rule.search_queries || []) {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}` +
      `&key=${process.env.GOOGLE_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.items) continue;

    const channelIds = searchData.items
      .map((item: any) => item.snippet?.channelId || item.id?.channelId)
      .filter(Boolean)
      .join(",");

    if (!channelIds) continue;

    const channelsUrl = `https://www.googleapis.com/youtube/v3/channels?` +
      `part=snippet,statistics&id=${channelIds}` +
      `&key=${process.env.GOOGLE_API_KEY}`;

    const channelsResponse = await fetch(channelsUrl);
    const channelsData = await channelsResponse.json();

    if (!channelsData.items) continue;

    const matchingChannels = channelsData.items.filter((channel: any) => {
      const subs = parseInt(channel.statistics?.subscriberCount) || 0;
      return subs >= (rule.min_followers || 0) && subs <= (rule.max_followers || 10000000);
    });

    totalFound += matchingChannels.length;

    for (const channel of matchingChannels) {
      const { error } = await supabase.from("discovered_creators").upsert(
        {
          platform: "youtube",
          platform_user_id: channel.id,
          platform_username: channel.snippet?.customUrl?.replace("@", "") || channel.id,
          display_name: channel.snippet?.title || "Unknown",
          profile_image_url: channel.snippet?.thumbnails?.medium?.url,
          bio: channel.snippet?.description?.substring(0, 500),
          followers: parseInt(channel.statistics?.subscriberCount) || 0,
          total_posts: parseInt(channel.statistics?.videoCount) || 1,
          avg_views: Math.round(
            (parseInt(channel.statistics?.viewCount) || 0) /
            Math.max(parseInt(channel.statistics?.videoCount) || 1, 1)
          ),
          niche: rule.target_niches || [],
          status: "active",
          is_hidden: false,
          discovered_at: new Date().toISOString(),
          last_scraped_at: new Date().toISOString(),
        },
        { onConflict: "platform,platform_user_id" }
      );

      if (!error) totalImported++;
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  await supabase
    .from("auto_discovery_rules")
    .update({ last_run_at: new Date().toISOString() })
    .eq("id", rule.id);

  return { found: totalFound, imported: totalImported };
}

export const dynamic = "force-dynamic";
export const maxDuration = 300;
