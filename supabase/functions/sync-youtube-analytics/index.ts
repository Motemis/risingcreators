import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BATCH_SIZE = 20; // YouTube API is more restrictive

async function refreshYouTubeToken(connection: any): Promise<string | null> {
  if (!connection.refresh_token) return null;

  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        refresh_token: connection.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    const tokens = await response.json();

    if (tokens.access_token) {
      // Update stored token
      await supabase
        .from("social_connections")
        .update({
          access_token: tokens.access_token,
          token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.id);

      return tokens.access_token;
    }
  } catch (err) {
    console.error("Token refresh error:", err);
  }

  return null;
}

Deno.serve(async (req) => {
  try {
    // Get YouTube connections that need syncing
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - 6);

    const { data: connections, error: fetchError } = await supabase
      .from("social_connections")
      .select(`
        *,
        user:users!inner(
          id,
          creator_profile:creator_profiles(*)
        )
      `)
      .eq("platform", "youtube")
      .or(`updated_at.is.null,updated_at.lt.${cutoffTime.toISOString()}`)
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("Error fetching connections:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!connections || connections.length === 0) {
      return new Response(JSON.stringify({ message: "No YouTube accounts need syncing" }), { status: 200 });
    }

    const results = { processed: 0, errors: 0, videos_synced: 0 };

    for (const connection of connections) {
      try {
        const creatorProfile = connection.user?.creator_profile?.[0];
        if (!creatorProfile) continue;

        // Check if token needs refresh
        let accessToken = connection.access_token;
        if (connection.token_expires_at && new Date(connection.token_expires_at) < new Date()) {
          accessToken = await refreshYouTubeToken(connection);
          if (!accessToken) {
            console.error(`Failed to refresh token for connection ${connection.id}`);
            results.errors++;
            continue;
          }
        }

        // Fetch channel statistics
        const channelResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&mine=true`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );

        const channelData = await channelResponse.json();

        if (!channelData.items?.[0]) {
          results.errors++;
          continue;
        }

        const channel = channelData.items[0];
        const stats = channel.statistics;

        // Fetch recent videos for engagement calculation
        const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
        let videoStats = { totalViews: 0, totalLikes: 0, totalComments: 0, videoCount: 0 };

        if (uploadsPlaylistId) {
          // Get playlist items
          const playlistResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&playlistId=${uploadsPlaylistId}&maxResults=20`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );
          const playlistData = await playlistResponse.json();

          if (playlistData.items?.length > 0) {
            const videoIds = playlistData.items.map((item: any) => item.contentDetails.videoId).join(",");

            // Fetch video details
            const videosResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${videoIds}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const videosData = await videosResponse.json();

            if (videosData.items) {
              for (const video of videosData.items) {
                videoStats.totalViews += parseInt(video.statistics.viewCount) || 0;
                videoStats.totalLikes += parseInt(video.statistics.likeCount) || 0;
                videoStats.totalComments += parseInt(video.statistics.commentCount) || 0;
                videoStats.videoCount++;

                // Upsert video to creator_posts
                await supabase.from("creator_posts").upsert(
                  {
                    creator_profile_id: creatorProfile.id,
                    platform: "YouTube",
                    post_url: `https://youtube.com/watch?v=${video.id}`,
                    thumbnail_url: video.snippet.thumbnails?.high?.url,
                    caption: video.snippet.title,
                    views: parseInt(video.statistics.viewCount) || 0,
                    likes: parseInt(video.statistics.likeCount) || 0,
                    comments: parseInt(video.statistics.commentCount) || 0,
                    posted_at: video.snippet.publishedAt,
                  },
                  { onConflict: "creator_profile_id,post_url" }
                );
                results.videos_synced++;
              }
            }
          }
        }

        // Calculate engagement rate
        const engagementRate = videoStats.totalViews > 0
          ? ((videoStats.totalLikes + videoStats.totalComments) / videoStats.totalViews) * 100
          : null;

        // Update creator profile
        await supabase
          .from("creator_profiles")
          .update({
            youtube_subscribers: parseInt(stats.subscriberCount) || 0,
            youtube_views: parseInt(stats.viewCount) || 0,
            youtube_engagement_rate: engagementRate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", creatorProfile.id);

        // Update social connection
        await supabase
          .from("social_connections")
          .update({
            followers: parseInt(stats.subscriberCount) || 0,
            updated_at: new Date().toISOString(),
          })
          .eq("id", connection.id);

        results.processed++;
      } catch (err) {
        console.error(`Error processing connection ${connection.id}:`, err);
        results.errors++;
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("YouTube sync error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
