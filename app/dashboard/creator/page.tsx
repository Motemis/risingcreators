import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function CreatorDashboard() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user data from our database
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  // Mock data for now — we'll connect real data later
  const stats = {
    score: 74,
    followers: 32847,
    growth: 15.2,
    engagement: 7.1,
    profileViews: 12,
    watchlistAdds: 6,
    unlocks: 2,
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Welcome back, {user.firstName || "Creator"}
          </h1>
          <p className="text-gray-400 mt-1">
            Here's how you're doing
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">YOUR CREATOR SCORE</h2>
          <div className="flex items-center gap-6">
            <div className="text-6xl font-bold text-white">{stats.score}</div>
            <div>
              <div className="text-xl text-gray-300">/100</div>
              <div className="text-green-400 text-sm mt-1">Ready for brand deals</div>
            </div>
          </div>
          <div className="mt-4 bg-gray-700 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full" 
              style={{ width: `${stats.score}%` }}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Followers</p>
            <p className="text-3xl font-bold text-white mt-1">
              {stats.followers.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Monthly Growth</p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              +{stats.growth}%
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Engagement Rate</p>
            <p className="text-3xl font-bold text-white mt-1">
              {stats.engagement}%
            </p>
          </div>
        </div>

        {/* Brand Activity */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">BRAND ACTIVITY THIS MONTH</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{stats.profileViews}</p>
              <p className="text-gray-400 text-sm mt-1">Profile Views</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{stats.watchlistAdds}</p>
              <p className="text-gray-400 text-sm mt-1">Watchlist Adds</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-white">{stats.unlocks}</p>
              <p className="text-gray-400 text-sm mt-1">Unlocks</p>
            </div>
          </div>
        </div>

        {/* Quick Tip */}
        <div className="bg-blue-900/30 border border-blue-800 rounded-xl p-6">
          <h2 className="text-blue-400 font-medium mb-2">THIS WEEK'S INSIGHT</h2>
          <p className="text-gray-300">
            Your engagement rate is strong (7.1%) but you're posting less than similar creators. 
            Creators in your niche who post 4x/week grow 2.3x faster.
          </p>
        </div>

      </div>
    </div>
  );
}