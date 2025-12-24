import { supabase } from "@/lib/supabase";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import QuickSaveButton from "./QuickSaveButton";
import Filters from "./Filters";

export default async function BrandDashboard({
  searchParams,
}: {
  searchParams: Promise<{ platform?: string; niche?: string; minFollowers?: string; maxFollowers?: string }>;
}) {
  const user = await currentUser();
  const params = await searchParams;

  if (!user) {
    redirect("/");
  }

  // Fetch ALL creators first to test
  const { data: creators, error } = await supabase
    .from("creators")
    .select("*")
    .order("followers", { ascending: false });

  // Log for debugging
  console.log("Params:", params);
  console.log("Creators:", creators);
  console.log("Error:", error);

  // Filter in JavaScript for now
  let filteredCreators = creators || [];

  if (params.platform && params.platform !== "all") {
    filteredCreators = filteredCreators.filter(c => c.platform === params.platform);
  }

  if (params.niche && params.niche !== "all") {
    filteredCreators = filteredCreators.filter(c => c.niche === params.niche);
  }

  if (params.minFollowers) {
    filteredCreators = filteredCreators.filter(c => c.followers >= parseInt(params.minFollowers!));
  }

  if (params.maxFollowers) {
    filteredCreators = filteredCreators.filter(c => c.followers <= parseInt(params.maxFollowers!));
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Discover Creators</h1>
          <p className="text-gray-400 mt-1">
            Find rising creators before they blow up
          </p>
        </div>

        {/* Filters */}
        <Filters 
          currentPlatform={params.platform}
          currentNiche={params.niche}
          currentMinFollowers={params.minFollowers}
          currentMaxFollowers={params.maxFollowers}
        />

        {/* Results Count */}
        <p className="text-gray-400 mb-4">{filteredCreators.length} creators found</p>

        {/* Creator Cards */}
        <div className="space-y-4">
          {filteredCreators.map((creator) => (
            <div
              key={creator.id}
              className="bg-gray-800 rounded-xl p-6 flex justify-between items-center"
            >
              <Link
                href={`/dashboard/brand/creator/${creator.id}`}
                className="flex items-center gap-4 flex-1 hover:opacity-80 transition"
              >
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    {creator.niche} Creator
                  </h3>
                  <p className="text-gray-400">
                    {creator.platform} · {creator.niche}
                  </p>
                  <div className="flex gap-4 mt-2">
                    <span className="text-green-400 text-sm">
                      {creator.engagement_rate}% engagement
                    </span>
                    <span className="text-blue-400 text-sm">
                      Score: {creator.score}/100
                    </span>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-4">
                <div className="text-right mr-4">
                  <p className="text-2xl font-bold text-white">
                    {creator.followers?.toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">followers</p>
                </div>
                
                <QuickSaveButton creatorId={creator.id} brandClerkId={user.id} />
                
                <Link
                  href={`/dashboard/brand/creator/${creator.id}`}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700"
                >
                  View
                </Link>
              </div>
            </div>
          ))}

          {filteredCreators.length === 0 && (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-400">No creators match your filters</p>
              <p className="text-gray-500 text-sm mt-2">Error: {error?.message || "None"}</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}