import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function UnlockedPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get all unlocked creators for this brand
  const { data: unlocks } = await supabase
    .from("unlocks")
    .select(`
      *,
      creators(*)
    `)
    .eq("brand_clerk_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Unlocked Creators</h1>
          <p className="text-gray-400 mt-1">
            Creators you've unlocked ({unlocks?.length || 0})
          </p>
        </div>

        {/* Unlocked Creators */}
        {unlocks && unlocks.length > 0 ? (
          <div className="space-y-4">
            {unlocks.map((unlock) => (
              <div
                key={unlock.id}
                className="bg-gray-800 rounded-xl p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        {unlock.creators.display_name}
                      </h3>
                      <p className="text-gray-400">
                        @{unlock.creators.username} · {unlock.creators.platform}
                      </p>
                      <p className="text-gray-500 text-sm mt-1">
                        {unlock.creators.niche} · {unlock.creators.followers?.toLocaleString()} followers
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <Link
                      href={`/dashboard/brand/creator/${unlock.creators.id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700"
                    >
                      View Profile
                    </Link>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-400 text-sm">Email</p>
                      <p className="text-white">
                        {unlock.creators.contact_email || "Not provided"}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm">Unlocked</p>
                      <p className="text-white">
                        {new Date(unlock.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {unlock.creators.rate_card && (
                    <div className="mt-4">
                      <p className="text-gray-400 text-sm mb-2">Rates</p>
                      <div className="flex gap-4 text-sm">
                        {unlock.creators.rate_card.dedicated_video && (
                          <span className="text-white">
                            Video: ${unlock.creators.rate_card.dedicated_video}
                          </span>
                        )}
                        {unlock.creators.rate_card.integration && (
                          <span className="text-white">
                            Integration: ${unlock.creators.rate_card.integration}
                          </span>
                        )}
                        {unlock.creators.rate_card.tiktok_post && (
                          <span className="text-white">
                            TikTok: ${unlock.creators.rate_card.tiktok_post}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-800 rounded-xl p-12 text-center">
            <p className="text-gray-400 mb-4">No unlocked creators yet</p>
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