import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const clerkUserId = searchParams.get("state");
  const error = searchParams.get("error");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  if (error) {
    console.error("YouTube OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=youtube_denied`);
  }

  if (!code || !clerkUserId) {
    return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=missing_params`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/youtube/callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (tokens.error) {
      console.error("Token exchange error:", tokens);
      return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=token_exchange`);
    }

    // Fetch YouTube channel info
    const channelResponse = await fetch(
      "https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    const channelData = await channelResponse.json();

    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=no_channel`);
    }

    const channel = channelData.items[0];
    const subscriberCount = parseInt(channel.statistics.subscriberCount) || 0;

    // Get user from database
    const { data: dbUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (!dbUser) {
      return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=user_not_found`);
    }

    // Save or update social connection
    const { error: upsertError } = await supabase
      .from("social_connections")
      .upsert({
        user_id: dbUser.id,
        platform: "youtube",
        platform_user_id: channel.id,
        platform_username: channel.snippet.title,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        followers: subscriberCount,
        profile_url: `https://youtube.com/channel/${channel.id}`,
        profile_image_url: channel.snippet.thumbnails?.default?.url,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id,platform",
      });

    if (upsertError) {
      console.error("Database error:", upsertError);
      return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=database`);
    }

    // Update creator profile with YouTube data
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("id")
      .eq("user_id", dbUser.id)
      .single();

    if (creatorProfile) {
      await supabase
        .from("creator_profiles")
        .update({
          youtube_channel_id: channel.id,
          youtube_handle: channel.snippet?.customUrl?.replace("@", "") || channel.snippet?.title,
          youtube_subscribers: subscriberCount,
          youtube_profile_image_url: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url,
          updated_at: new Date().toISOString(),
        })
        .eq("id", creatorProfile.id);
    }

    // Auto-sync videos after connecting
    if (creatorProfile) {
      try {
        // Get channel's upload playlist ID
        const channelDetailsResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true`,
          { headers: { Authorization: `Bearer ${tokens.access_token}` } }
        );
        const channelDetails = await channelDetailsResponse.json();
        
        if (channelDetails.items?.[0]) {
          const uploadsPlaylistId = channelDetails.items[0].contentDetails.relatedPlaylists.uploads;

          // Fetch recent videos
          const playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20`,
            { headers: { Authorization: `Bearer ${tokens.access_token}` } }
          );
          const playlistData = await playlistResponse.json();

          if (playlistData.items?.length > 0) {
            const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(",");

            // Fetch video details
            const videosResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${videoIds}`,
              { headers: { Authorization: `Bearer ${tokens.access_token}` } }
            );
            const videosData = await videosResponse.json();

            if (videosData.items) {
              const videos = videosData.items.map((video: any) => ({
                id: video.id,
                title: video.snippet.title,
                thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
                publishedAt: video.snippet.publishedAt,
                views: parseInt(video.statistics.viewCount) || 0,
                likes: parseInt(video.statistics.likeCount) || 0,
                comments: parseInt(video.statistics.commentCount) || 0,
              }));

              // Sort and pick top videos
              const topByViews = [...videos].sort((a: any, b: any) => b.views - a.views).slice(0, 5);
              const topByLikes = [...videos].sort((a: any, b: any) => b.likes - a.likes).slice(0, 5);
              const topByComments = [...videos].sort((a: any, b: any) => b.comments - a.comments).slice(0, 5);

              const seen = new Set<string>();
              const topVideos: Array<{
                id: string;
                title: string;
                thumbnail: string | undefined;
                publishedAt: string;
                views: number;
                likes: number;
                comments: number;
              }> = [];

              for (const video of [...topByViews, ...topByLikes, ...topByComments]) {
                if (!seen.has(video.id)) {
                  seen.add(video.id);
                  topVideos.push(video);
                }
              }

              // Insert posts
              const posts = topVideos.map((video: any, index: number) => ({
                creator_profile_id: creatorProfile.id,
                platform: "YouTube",
                post_url: `https://youtube.com/watch?v=${video.id}`,
                thumbnail_url: video.thumbnail,
                caption: video.title,
                views: video.views,
                likes: video.likes,
                comments: video.comments,
                posted_at: video.publishedAt,
                is_featured: index < 5,
              }));

              await supabase.from("creator_posts").insert(posts);
            }
          }
        }
      } catch (syncError) {
        console.error("Auto-sync error:", syncError);
        // Don't fail the whole flow if sync fails
      }
    }

    return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?youtube=connected`);

  } catch (err) {
    console.error("YouTube OAuth error:", err);
    return NextResponse.redirect(`${baseUrl}/dashboard/creator/profile?error=unknown`);
  }
}



