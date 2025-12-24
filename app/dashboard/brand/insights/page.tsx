import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function InsightsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get counts
  const { count: unlockCount } = await supabase
    .from("unlocks")
    .select("*", { count: "exact", head: true })
    .eq("brand_clerk_id", user.id);

  const { count: watchlistCount } = await supabase
    .from("watchlists")
    .select("*", { count: "exact", head: true })
    .eq("brand_clerk_id", user.id);

  const { data: watchlistCreators } = await supabase
    .from("watchlists")
    .select(`
      watchlist_creators(count)
    `)
    .eq("brand_clerk_id", user.id);

  const totalSaved = watchlistCreators?.reduce((sum, wl) => {
    return sum + (wl.watchlist_creators?.[0]?.count || 0);
  }, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Insights</h1>
          <p className="text-gray-400 mt-1">
            Your activity on Rising Creators
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-white">{unlockCount || 0}</p>
            <p className="text-gray-400 mt-2">Creators Unlocked</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-white">{watchlistCount || 0}</p>
            <p className="text-gray-400 mt-2">Watchlists</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-6 text-center">
            <p className="text-4xl font-bold text-white">{totalSaved}</p>
            <p className="text-gray-400 mt-2">Creators Saved</p>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="bg-gray-800 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-white mb-4">Coming Soon</h2>
          <ul className="space-y-3 text-gray-400">
            <li>📊 See trending niches and creators</li>
            <li>📈 Track creator growth over time</li>
            <li>🎯 Get personalized recommendations</li>
            <li>💰 Rate benchmarks for your industry</li>
          </ul>
        </div>

      </div>
    </div>
  );
}