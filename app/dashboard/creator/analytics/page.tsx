import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import AnalyticsDashboard from "./AnalyticsDashboard";

export default async function AnalyticsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!profile) {
    redirect("/onboarding/creator");
  }

  // Get historical snapshots for trend charts (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: snapshots } = await supabase
    .from("creator_analytics_snapshots")
    .select("*")
    .eq("creator_profile_id", profile.id)
    .gte("snapshot_date", thirtyDaysAgo.toISOString().split("T")[0])
    .order("snapshot_date", { ascending: true });

  // Get niche benchmarks for comparison
  const primaryNiche = profile.niche?.[0] || "lifestyle";
  const followerTier = getFollowerTier(
    (profile.youtube_subscribers || 0) +
    (profile.tiktok_followers || 0) +
    (profile.instagram_followers || 0)
  );

  const { data: benchmarks } = await supabase
    .from("niche_benchmarks")
    .select("*")
    .eq("niche", primaryNiche)
    .eq("follower_tier", followerTier)
    .single();

  // Get top posts for content analysis
  const { data: topPosts } = await supabase
    .from("creator_posts")
    .select("*")
    .eq("creator_profile_id", profile.id)
    .order("views", { ascending: false })
    .limit(10);

  return (
    <AnalyticsDashboard
      profile={profile}
      snapshots={snapshots || []}
      benchmarks={benchmarks}
      topPosts={topPosts || []}
    />
  );
}

function getFollowerTier(totalFollowers: number): string {
  if (totalFollowers < 10000) return "nano";
  if (totalFollowers < 50000) return "micro";
  if (totalFollowers < 100000) return "mid";
  if (totalFollowers < 500000) return "macro";
  return "mega";
}
