import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UnlockButton from "./UnlockButton";

export default async function CreatorDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get creator
  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("id", id)
    .single();

  if (!creator) {
    return <div className="p-8 text-white">Creator not found</div>;
  }

  // Check if already unlocked
  const { data: unlock } = await supabase
    .from("unlocks")
    .select("*")
    .eq("brand_clerk_id", user.id)
    .eq("creator_id", id)
    .single();

  const isUnlocked = !!unlock;

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
              {isUnlocked ? (
                <span className="text-3xl">👤</span>
              ) : (
                <span className="text-3xl blur-sm">👤</span>
              )}
            </div>
            <div>
              {isUnlocked ? (
                <>
                  <h1 className="text-2xl font-bold text-white">
                    {creator.display_name}
                  </h1>
                  <p className="text-gray-400">@{creator.username}</p>
                </>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white">
                    {creator.niche} Creator
                  </h1>
                  <p className="text-gray-400">{creator.platform}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-white">
              {creator.followers?.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm">Followers</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-400">
              {creator.engagement_rate}%
            </p>
            <p className="text-gray-400 text-sm">Engagement</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-400">
              {creator.score}/100
            </p>
            <p className="text-gray-400 text-sm">Score</p>
          </div>
        </div>

        {/* Bio */}
        {creator.bio && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h2 className="text-gray-400 text-sm font-medium mb-2">ABOUT</h2>
            <p className="text-gray-300">{creator.bio}</p>
          </div>
        )}

        {/* Contact & Rates - Gated */}
        <div className="bg-gray-800 rounded-xl p-6">
          <h2 className="text-gray-400 text-sm font-medium mb-4">
            CONTACT & RATES {!isUnlocked && "🔒"}
          </h2>

          {isUnlocked ? (
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-sm">Email</p>
                <p className="text-white">{creator.contact_email || "Not provided"}</p>
              </div>
              {creator.rate_card && (
                <div>
                  <p className="text-gray-400 text-sm mb-2">Rate Card</p>
                  <div className="space-y-1">
                    {creator.rate_card.dedicated_video && (
                      <p className="text-white">
                        Dedicated Video: ${creator.rate_card.dedicated_video}
                      </p>
                    )}
                    {creator.rate_card.integration && (
                      <p className="text-white">
                        Integration: ${creator.rate_card.integration}
                      </p>
                    )}
                    {creator.rate_card.tiktok_post && (
                      <p className="text-white">
                        TikTok Post: ${creator.rate_card.tiktok_post}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-4">
                Unlock to see contact info and rates
              </p>
              <UnlockButton creatorId={id} brandClerkId={user.id} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}