import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const user = await currentUser();
  
  const adminEmails = ["justin.motes@me.com", "motemis@gmail.com"];
  if (!user || !adminEmails.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { query, minSubs, maxSubs } = await request.json();
  console.log("Search params:", { query, minSubs, maxSubs });

  if (!query) {
    return NextResponse.json({ error: "Query required" }, { status: 400 });
  }

  try {
    // Search for channels
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&maxResults=50&q=${encodeURIComponent(query)}&key=${process.env.GOOGLE_API_KEY}`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.error) {
      console.error("YouTube API error:", searchData.error);
      return NextResponse.json({ error: searchData.error.message }, { status: 500 });
    }

    console.log("Search results count:", searchData.items?.length || 0);

    if (!searchData.items || searchData.items.length === 0) {
      return NextResponse.json({ channels: [] });
    }

    // Get channel IDs
    const channelIds = searchData.items.map((item: any) => item.snippet.channelId).join(",");

    // Get detailed channel stats
    const channelsResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelIds}&key=${process.env.GOOGLE_API_KEY}`
    );

    const channelsData = await channelsResponse.json();
    console.log("Channels with stats:", channelsData.items?.length || 0);

    if (!channelsData.items) {
      return NextResponse.json({ channels: [] });
    }

    // Log subscriber counts before filtering
    const allChannels = channelsData.items.map((channel: any) => ({
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails?.medium?.url || channel.snippet.thumbnails?.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      customUrl: channel.snippet.customUrl,
    }));

    console.log("Subscriber counts:", allChannels.map((c: any) => ({ title: c.title, subs: c.subscriberCount })));

    // Filter by subscriber count
    const channels = allChannels
      .filter((channel: any) => {
        return channel.subscriberCount >= minSubs && channel.subscriberCount <= maxSubs;
      })
      .sort((a: any, b: any) => b.subscriberCount - a.subscriberCount);

    console.log("After filtering:", channels.length);

    return NextResponse.json({ channels });

  } catch (err) {
    console.error("Search error:", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}


