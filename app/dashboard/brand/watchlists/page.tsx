import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import CreateWatchlistButton from "./CreateWatchlistButton";

export default async function WatchlistsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user's watchlists with creator count
  const { data: watchlists } = await supabase
    .from("watchlists")
    .select(`
      *,
      watchlist_creators(count)
    `)
    .eq("brand_clerk_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Watchlists</h1>
            <p className="text-gray-400 mt-1">
              Track and organize creators you're interested in
            </p>
          </div>
          <CreateWatchlistButton brandClerkId={user.id} />
        </div>

        {/* Watchlists */}
        {watchlists && watchlists.length > 0 ? (
          <div className="grid gap-4">
            {watchlists.map((watchlist) => (
              <Link
                key={watchlist.id}
                href={`/dashboard/brand/watchlists/${watchlist.id}`}
                className="bg-gray-800 rounded-xl p-6 hover:bg-gray-700 transition block"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {watchlist.name}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                      {watchlist.watchlist_creators?.[0]?.count || 0} creators
                    </p>
                  </div>
                  <span className="text-gray-400">→</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No watchlists yet</p>
            <p className="text-gray-500 text-sm">
              Create a watchlist to start tracking creators
            </p>
          </div>
        )}

      </div>
    </div>
  );
}