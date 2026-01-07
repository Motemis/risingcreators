import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user and their YouTube connection
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", user.id)
      .single();

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: connection } = await supabase
      .from("social_connections")
      .select("*")
      .eq("user_id", dbUser.id)
      .eq("platform", "youtube")
      .single();

    if (!connection) {
      return NextResponse.json({ error: "YouTube not connected" }, { status: 400 });
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    if (new Date(connection.token_expires_at) < new Date()) {
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: connection.refresh_token,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await refreshResponse.json();
      if (tokens.access_token) {
        accessToken = tokens.access_token;
        await supabase
          .from("social_connections")
          .update({
            access_token: tokens.access_token,
            token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          })
          .eq("id", connection.id);
      }
    }

    // Get creator profile
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (!creatorProfile) {
      return NextResponse.json({ error: "Creator profile not found" }, { status: 404 });
    }

    // Get channel's upload playlist ID
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const channelData = await channelResponse.json();
    
    if (!channelData.items?.[0]) {
      return NextResponse.json({ error: "No channel found" }, { status: 404 });
    }

    const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

    // Fetch recent videos from uploads playlist (more reliable than search)
    const playlistResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const playlistData = await playlistResponse.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return NextResponse.json({ message: "No videos found", synced: 0 });
    }

    // Get video IDs
    const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(",");

    // Fetch full video details with statistics in ONE call
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const videosData = await videosResponse.json();

    if (!videosData.items) {
      return NextResponse.json({ error: "Failed to fetch video details" }, { status: 500 });
    }

    // Sort and pick top videos by different metrics
    const videos = videosData.items.map((video: any) => ({
      id: video.id,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
      publishedAt: video.snippet.publishedAt,
      views: parseInt(video.statistics.viewCount) || 0,
      likes: parseInt(video.statistics.likeCount) || 0,
      comments: parseInt(video.statistics.commentCount) || 0,
    }));

    // Get unique top videos across metrics
    const topByViews = [...videos].sort((a, b) => b.views - a.views).slice(0, 5);
    const topByLikes = [...videos].sort((a, b) => b.likes - a.likes).slice(0, 5);
    const topByComments = [...videos].sort((a, b) => b.comments - a.comments).slice(0, 5);

    // Combine and dedupe (keeping best rank)
    const seen = new Set<string>();
    const topVideos: typeof videos = [];

    for (const video of [...topByViews, ...topByLikes, ...topByComments]) {
      if (!seen.has(video.id)) {
        seen.add(video.id);
        topVideos.push(video);
      }
    }

    // Delete old YouTube posts for this creator
    await supabase
      .from("creator_posts")
      .delete()
      .eq("creator_profile_id", creatorProfile.id)
      .eq("platform", "YouTube");

    // Insert new posts
    const posts = topVideos.map((video, index) => ({
      creator_profile_id: creatorProfile.id,
      platform: "YouTube",
      post_url: `https://youtube.com/watch?v=${video.id}`,
      thumbnail_url: video.thumbnail,
      caption: video.title,
      views: video.views,
      likes: video.likes,
      comments: video.comments,
      posted_at: video.publishedAt,
      is_featured: index < 5, // Auto-feature top 5 by views initially
    }));

    const { error: insertError } = await supabase
      .from("creator_posts")
      .insert(posts);

    if (insertError) {
      console.error("Insert error:", insertError);
      return NextResponse.json({ error: "Failed to save posts" }, { status: 500 });
    }

    return NextResponse.json({ 
      message: "Videos synced", 
      synced: posts.length,
      breakdown: {
        total: topVideos.length,
        autoFeatured: Math.min(5, topVideos.length),
      }
    });

  } catch (err) {
    console.error("Sync error:", err);
    return NextResponse.json({ error: "Sync failed" }, { status: 500 });
  }
}