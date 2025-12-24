import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ActivityPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Mock data
  const stats = {
    profileViews: 12,
    watchlistAdds: 6,
    unlocks: 2,
    lastMonthViews: 8,
  };

  const activities = [
    { type: "unlock", text: "A brand unlocked your profile", time: "2 days ago" },
    { type: "watchlist", text: "Added to a watchlist", time: "3 days ago" },
    { type: "view", text: "Profile viewed", time: "4 days ago" },
    { type: "view", text: "Profile viewed", time: "5 days ago" },
    { type: "watchlist", text: "Added to a watchlist", time: "1 week ago" },
    { type: "view", text: "Profile viewed", time: "1 week ago" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Brand Activity</h1>
          <p className="text-gray-400 mt-1">
            See how brands are interacting with your profile
          </p>
        </div>

        {/* Stats */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">THIS MONTH</h2>
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
          <p className="text-green-400 text-sm mt-4 text-center">
            ↑ {Math.round(((stats.profileViews - stats.lastMonthViews) / stats.lastMonthViews) * 100)}% more activity than last month
          </p>
        </div>

        {/* Activity Feed */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">RECENT ACTIVITY</h2>
          <div className="space-y-3">
            {activities.map((activity, i) => (
              <div 
                key={i}
                className="flex items-center justify-between py-3 border-b border-gray-700 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">
                    {activity.type === "unlock" && "🔓"}
                    {activity.type === "watchlist" && "⭐"}
                    {activity.type === "view" && "👁"}
                  </span>
                  <span className="text-white">{activity.text}</span>
                </div>
                <span className="text-gray-500 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">HOW YOU COMPARE</h2>
          <p className="text-gray-300">
            Creators your size in outdoor/hiking:
          </p>
          <div className="mt-4">
            <p className="text-gray-400">Average profile views/month: <span className="text-white">8</span></p>
            <p className="text-gray-400">Your profile views/month: <span className="text-white">{stats.profileViews}</span></p>
          </div>
          <p className="text-green-400 mt-4">
            You're getting {Math.round((stats.profileViews / 8 - 1) * 100)}% more brand attention than average.
          </p>
        </div>

      </div>
    </div>
  );
}
