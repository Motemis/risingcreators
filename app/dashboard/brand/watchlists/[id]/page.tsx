import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function WatchlistDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get watchlist
  const { data: watchlist } = await supabase
    .from("watchlists")
    .select("*")
    .eq("id", id)
    .eq("brand_clerk_id", user.id)
    .single();

  if (!watchlist) {
    return <div className="p-8 text-white">Watchlist not found</div>;
  }

  // Get creators in watchlist
  const { data: watchlistCreators } = await supabase
    .from("watchlist_creators")
    .select(`
      *,
      creators(*)
    `)
    .eq("watchlist_id", id);

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/brand/watchlists"
            className="text-gray-400 hover:text-white text-sm mb-2 inline-block"
          >
            ← Back to Watchlists
          </Link>
          <h1 className="text-3xl font-bold text-white">{watchlist.name}</h1>
          <p className="text-gray-400 mt-1">
            {watchlistCreators?.length || 0} creators
          </p>
        </div>

        {/* Creators */}
        {watchlistCreators && watchlistCreators.length > 0 ? (
          <div className="space-y-4">
            {watchlistCreators.map((item) => (
              <Link
                key={item.id}
                href={`/dashboard/brand/creator/${item.creators.id}`}
                className="bg-gray-800 rounded-xl p-6 flex justify-between items-center hover:bg-gray-700 transition block"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {item.creators.niche} Creator
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {item.creators.platform} · {item.creators.followers?.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-green-400">
                    {item.creators.engagement_rate}% eng
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No creators in this watchlist</p>
            <Link
              href="/dashboard/brand"
              className="text-blue-400 hover:text-blue-300"
            >
              Discover creators →
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}