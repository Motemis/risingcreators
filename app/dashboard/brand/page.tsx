import { supabase } from "@/lib/supabase";

export default async function BrandDashboard() {
  // Fetch creators from database
  const { data: creators } = await supabase
    .from("creators")
    .select("*")
    .order("followers", { ascending: false });

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
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <div className="flex gap-4 flex-wrap">
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>All Platforms</option>
              <option>YouTube</option>
              <option>TikTok</option>
            </select>
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>All Niches</option>
              <option>Outdoor</option>
              <option>Gaming</option>
              <option>Beauty</option>
              <option>Fitness</option>
            </select>
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>Any Growth Rate</option>
              <option>10%+ monthly</option>
              <option>20%+ monthly</option>
              <option>50%+ monthly</option>
            </select>
            <select className="bg-gray-700 text-white px-4 py-2 rounded-lg">
              <option>Any Followers</option>
              <option>10k - 50k</option>
              <option>50k - 100k</option>
              <option>100k+</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-gray-400 mb-4">{creators?.length || 0} creators found</p>

        {/* Creator Cards */}
        <div className="space-y-4">
          {creators?.map((creator) => (
            <div 
              key={creator.id}
              className="bg-gray-800 rounded-xl p-6 flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                {/* Blurred avatar placeholder */}
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
              </div>

              <div className="text-right">
                <p className="text-2xl font-bold text-white">
                  {creator.followers?.toLocaleString()}
                </p>
                <p className="text-gray-400 text-sm">followers</p>
                
                <div className="flex gap-2 mt-3">
                  <button className="text-gray-300 hover:text-white px-3 py-1 border border-gray-600 rounded-lg text-sm">
                    ☆ Save
                  </button>
                  <button className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700">
                    🔓 Unlock
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}