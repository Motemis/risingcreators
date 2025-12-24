import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ClaimSearch from "./ClaimSearch";

export default async function ClaimProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Check if already claimed
  const { data: existingClaim } = await supabase
    .from("creators")
    .select("*")
    .eq("claimed_by", user.id)
    .single();

  if (existingClaim) {
    redirect("/dashboard/creator/profile");
  }

  // Get unclaimed creators
  const { data: creators } = await supabase
    .from("creators")
    .select("*")
    .is("claimed_by", null)
    .order("followers", { ascending: false });

  const userName = [user.firstName, user.lastName].filter(Boolean).join(" ") || "";

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        
        <h1 className="text-3xl font-bold text-white mb-2">Claim Your Profile</h1>
        <p className="text-gray-400 mb-8">
          Find and claim your creator profile to unlock analytics and brand visibility
        </p>

        <ClaimSearch 
          creators={creators || []} 
          clerkId={user.id} 
          userEmail={user.emailAddresses[0]?.emailAddress || ""}
          userName={userName}
        />

      </div>
    </div>
  );
}