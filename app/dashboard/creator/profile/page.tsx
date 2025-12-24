import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import ProfileForm from "./ProfileForm";

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

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-gray-400 mb-8">
          This is what brands see when they unlock your profile
        </p>

        <ProfileForm 
          clerkId={user.id} 
          existingProfile={creator}
          userEmail={user.emailAddresses[0]?.emailAddress}
        />
      </div>
    </div>
  );
}