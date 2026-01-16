import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Rate limit: Process max 50 creators per run to stay within API limits
const BATCH_SIZE = 50;
const SYNC_INTERVAL_HOURS = 6;

Deno.serve(async (req) => {
  try {
    // Get creators that need syncing (last synced > 6 hours ago or never synced)
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - SYNC_INTERVAL_HOURS);

    const { data: creators, error: fetchError } = await supabase
      .from("creator_profiles")
      .select(`
        id,
        youtube_channel_id,
        tiktok_handle,
        instagram_handle,
        twitch_handle,
        twitter_handle,
        pinterest_handle,
        spotify_url,
        youtube_subscribers,
        tiktok_followers,
        instagram_followers,
        twitch_followers,
        twitter_followers,
        pinterest_followers,
        spotify_followers,
        last_synced_at
      `)
      .or(`last_synced_at.is.null,last_synced_at.lt.${cutoffTime.toISOString()}`)
      .limit(BATCH_SIZE);

    if (fetchError) {
      console.error("Error fetching creators:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), { status: 500 });
    }

    if (!creators || creators.length === 0) {
      return new Response(JSON.stringify({ message: "No creators need syncing" }), { status: 200 });
    }

    console.log(`Processing ${creators.length} creators`);

    const results = {
      processed: 0,
      errors: 0,
      snapshots_created: 0,
    };

    for (const creator of creators) {
      try {
        // Get social connections for API tokens
        const { data: connections } = await supabase
          .from("social_connections")
          .select("*")
          .eq("user_id", creator.id);

        const connectionMap = new Map(
          (connections || []).map((c) => [c.platform, c])
        );

        // Calculate aggregates
        const totalFollowers =
          (creator.youtube_subscribers || 0) +
          (creator.tiktok_followers || 0) +
          (creator.instagram_followers || 0) +
          (creator.twitch_followers || 0) +
          (creator.twitter_followers || 0) +
          (creator.pinterest_followers || 0) +
          (creator.spotify_followers || 0);

        // Get previous snapshot for growth calculation
        const { data: previousSnapshot } = await supabase
          .from("creator_analytics_snapshots")
          .select("*")
          .eq("creator_profile_id", creator.id)
          .order("snapshot_date", { ascending: false })
          .limit(1)
          .single();

        // Calculate growth rates
        let followerGrowth7d = null;
        let followerGrowth30d = null;
        let followerGrowth90d = null;

        // Get snapshots for growth calculation
        const now = new Date();
        const dates = {
          d7: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          d30: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          d90: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        };

        const { data: historicalSnapshots } = await supabase
          .from("creator_analytics_snapshots")
          .select("snapshot_date, total_followers")
          .eq("creator_profile_id", creator.id)
          .gte("snapshot_date", dates.d90.toISOString().split("T")[0])
          .order("snapshot_date", { ascending: true });

        if (historicalSnapshots && historicalSnapshots.length > 0) {
          // Find closest snapshots to each date
          const findClosest = (targetDate: Date) => {
            return historicalSnapshots.reduce((closest, snapshot) => {
              const snapshotDate = new Date(snapshot.snapshot_date);
              const closestDate = closest ? new Date(closest.snapshot_date) : null;
              const targetTime = targetDate.getTime();

              if (!closestDate) return snapshot;

              const currentDiff = Math.abs(snapshotDate.getTime() - targetTime);
              const closestDiff = Math.abs(closestDate.getTime() - targetTime);

              return currentDiff < closestDiff ? snapshot : closest;
            }, null as any);
          };

          const snapshot7d = findClosest(dates.d7);
          const snapshot30d = findClosest(dates.d30);
          const snapshot90d = findClosest(dates.d90);

          if (snapshot7d?.total_followers && totalFollowers) {
            followerGrowth7d = ((totalFollowers - snapshot7d.total_followers) / snapshot7d.total_followers) * 100;
          }
          if (snapshot30d?.total_followers && totalFollowers) {
            followerGrowth30d = ((totalFollowers - snapshot30d.total_followers) / snapshot30d.total_followers) * 100;
          }
          if (snapshot90d?.total_followers && totalFollowers) {
            followerGrowth90d = ((totalFollowers - snapshot90d.total_followers) / snapshot90d.total_followers) * 100;
          }
        }

        // Determine if trending (growth > 5% in 7 days)
        const isTrending = (followerGrowth7d || 0) > 5;

        // Get posts for engagement calculation
        const { data: posts } = await supabase
          .from("creator_posts")
          .select("views, likes, comments, posted_at")
          .eq("creator_profile_id", creator.id)
          .order("posted_at", { ascending: false })
          .limit(20);

        // Calculate engagement metrics
        let totalEngagementRate = null;
        let avgPostPerformance = null;
        let postsPerWeek = null;
        let viralPostCount = 0;
        let viewToFollowerRatio = null;
        let likeToViewRatio = null;
        let commentToViewRatio = null;

        if (posts && posts.length > 0) {
          const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
          const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
          const totalComments = posts.reduce((sum, p) => sum + (p.comments || 0), 0);
          
          avgPostPerformance = Math.round(totalViews / posts.length);

          if (totalViews > 0) {
            totalEngagementRate = ((totalLikes + totalComments) / totalViews) * 100;
            likeToViewRatio = (totalLikes / totalViews) * 100;
            commentToViewRatio = (totalComments / totalViews) * 100;
          }

          if (totalFollowers > 0) {
            viewToFollowerRatio = (avgPostPerformance / totalFollowers) * 100;
          }

          // Calculate posts per week
          if (posts.length >= 2) {
            const oldestPost = new Date(posts[posts.length - 1].posted_at);
            const newestPost = new Date(posts[0].posted_at);
            const weeksBetween = (newestPost.getTime() - oldestPost.getTime()) / (7 * 24 * 60 * 60 * 1000);
            if (weeksBetween > 0) {
              postsPerWeek = posts.length / weeksBetween;
            }
          }

          // Count viral posts (> 2x average)
          viralPostCount = posts.filter((p) => (p.views || 0) > avgPostPerformance * 2).length;
        }

        // Calculate estimated post value based on followers and engagement
        let estimatedPostValue = null;
        let estimatedCpm = null;

        if (totalFollowers > 0) {
          // Industry standard: $10-20 CPM for mid-tier, adjusted by engagement
          const baseCpm = 15;
          const engagementMultiplier = totalEngagementRate ? Math.min(2, totalEngagementRate / 5) : 1;
          estimatedCpm = baseCpm * engagementMultiplier;
          
          // Estimated reach is ~10-30% of followers per post
          const estimatedReach = totalFollowers * 0.2;
          estimatedPostValue = Math.round((estimatedReach / 1000) * estimatedCpm);
        }

        // Calculate consistency score (0-100)
        let consistencyScore = null;
        if (postsPerWeek !== null) {
          // Ideal is 3-5 posts per week
          if (postsPerWeek >= 3 && postsPerWeek <= 7) {
            consistencyScore = 100;
          } else if (postsPerWeek >= 2) {
            consistencyScore = 80;
          } else if (postsPerWeek >= 1) {
            consistencyScore = 60;
          } else if (postsPerWeek >= 0.5) {
            consistencyScore = 40;
          } else {
            consistencyScore = 20;
          }
        }

        // Update creator profile with calculated metrics
        const updateData: any = {
          total_followers: totalFollowers,
          total_engagement_rate: totalEngagementRate,
          follower_growth_7d: followerGrowth7d,
          follower_growth_30d: followerGrowth30d,
          follower_growth_90d: followerGrowth90d,
          is_trending: isTrending,
          estimated_post_value: estimatedPostValue,
          estimated_cpm: estimatedCpm,
          view_to_follower_ratio: viewToFollowerRatio,
          like_to_view_ratio: likeToViewRatio,
          comment_to_view_ratio: commentToViewRatio,
          posts_per_week: postsPerWeek,
          consistency_score: consistencyScore,
          viral_post_count: viralPostCount,
          avg_post_performance: avgPostPerformance,
          last_synced_at: new Date().toISOString(),
        };

        await supabase
          .from("creator_profiles")
          .update(updateData)
          .eq("id", creator.id);

        // Create daily snapshot (only one per day)
        const today = new Date().toISOString().split("T")[0];

        const { data: existingSnapshot } = await supabase
          .from("creator_analytics_snapshots")
          .select("id")
          .eq("creator_profile_id", creator.id)
          .eq("snapshot_date", today)
          .single();

        if (!existingSnapshot) {
          await supabase.from("creator_analytics_snapshots").insert({
            creator_profile_id: creator.id,
            snapshot_date: today,
            total_followers: totalFollowers,
            total_views: avgPostPerformance ? avgPostPerformance * (posts?.length || 0) : null,
            total_engagement: totalEngagementRate,
            youtube_subscribers: creator.youtube_subscribers,
            tiktok_followers: creator.tiktok_followers,
            instagram_followers: creator.instagram_followers,
          });
          results.snapshots_created++;
        }

        results.processed++;
      } catch (err) {
        console.error(`Error processing creator ${creator.id}:`, err);
        results.errors++;
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sync error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
