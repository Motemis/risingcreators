import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function GrowthPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Mock data for now
  const stats = {
    currentFollowers: 32847,
    lastMonthFollowers: 28500,
    growthRate: 15.2,
    percentile: 85,
    engagementRate: 7.1,
    avgEngagement: 5.2,
    postsPerWeek: 2.1,
    avgPostsPerWeek: 3.4,
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">My Growth</h1>
          <p className="text-gray-400 mt-1">
            Track your progress and see how you compare
          </p>
        </div>

        {/* Growth Chart Placeholder */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">FOLLOWER GROWTH</h2>
          <div className="flex items-end justify-between h-40 border-b border-gray-700 mb-4">
            {/* Simple bar chart placeholder */}
            <div className="flex items-end gap-2 h-full w-full">
              {[40, 45, 42, 55, 60, 65, 70, 75, 85, 90, 95, 100].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-blue-500 rounded-t"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between text-gray-500 text-sm">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
            <span>Jul</span>
            <span>Aug</span>
            <span>Sep</span>
            <span>Oct</span>
            <span>Nov</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Current Followers</p>
            <p className="text-3xl font-bold text-white mt-1">
              {stats.currentFollowers.toLocaleString()}
            </p>
            <p className="text-green-400 text-sm mt-2">
              +{(stats.currentFollowers - stats.lastMonthFollowers).toLocaleString()} this month
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6">
            <p className="text-gray-400 text-sm">Monthly Growth Rate</p>
            <p className="text-3xl font-bold text-green-400 mt-1">
              +{stats.growthRate}%
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Top {100 - stats.percentile}% in your niche
            </p>
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">HOW YOU COMPARE</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Monthly Growth</span>
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold">{stats.growthRate}%</span>
                <span className="text-gray-500">vs {stats.avgEngagement}% avg</span>
                <span className="text-green-400 text-sm">✓ Ahead</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-700">
              <span className="text-gray-300">Engagement Rate</span>
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold">{stats.engagementRate}%</span>
                <span className="text-gray-500">vs {stats.avgEngagement}% avg</span>
                <span className="text-green-400 text-sm">✓ Ahead</span>
              </div>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-gray-300">Posts per Week</span>
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold">{stats.postsPerWeek}</span>
                <span className="text-gray-500">vs {stats.avgPostsPerWeek} avg</span>
                <span className="text-red-400 text-sm">✗ Behind</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}