import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default async function CreatorProfile() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Get user's creator profile if they have one
  const { data: creator } = await supabase
    .from("creators")
    .select("*")
    .eq("claimed_by", user.id)
    .single();

  // Get user data
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <p className="text-gray-400 mt-1">
              This is what brands see when they unlock you
            </p>
          </div>
          <Link
            href="/dashboard/creator/profile/edit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Edit Profile
          </Link>
        </div>

        {/* Profile Preview */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-gray-400">{user.emailAddresses[0]?.emailAddress}</p>
            </div>
          </div>

          {creator ? (
            <>
              <div className="border-t border-gray-700 pt-6">
                <h3 className="text-gray-400 text-sm font-medium mb-2">BIO</h3>
                <p className="text-gray-300">
                  {creator.bio || "No bio added yet"}
                </p>
              </div>

              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-gray-400 text-sm font-medium mb-2">CONTACT EMAIL</h3>
                <p className="text-white">
                  {creator.contact_email || "Not set"}
                </p>
              </div>

              <div className="border-t border-gray-700 pt-6 mt-6">
                <h3 className="text-gray-400 text-sm font-medium mb-2">RATE CARD</h3>
                {creator.rate_card ? (
                  <div className="space-y-2">
                    {creator.rate_card.dedicated_video && (
                      <p className="text-gray-300">
                        Dedicated Video: <span className="text-white">${creator.rate_card.dedicated_video}</span>
                      </p>
                    )}
                    {creator.rate_card.integration && (
                      <p className="text-gray-300">
                        Integration: <span className="text-white">${creator.rate_card.integration}</span>
                      </p>
                    )}
                    {creator.rate_card.tiktok_post && (
                      <p className="text-gray-300">
                        TikTok Post: <span className="text-white">${creator.rate_card.tiktok_post}</span>
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No rates set</p>
                )}
              </div>
            </>
          ) : (
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-center py-8">
                You haven't claimed a creator profile yet.
              </p>
              <Link
                href="/dashboard/creator/claim"
                className="block text-center text-blue-400 hover:text-blue-300"
              >
                Claim your profile →
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}