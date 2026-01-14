import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CreatorOnboardingForm from "./CreatorOnboardingForm";

export default async function CreatorOnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user from database
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser) {
    redirect("/onboarding");
  }

  if (dbUser.user_type !== "creator") {
    redirect("/onboarding");
  }

  // Check if they already have a profile
  const { data: existingProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (existingProfile) {
    redirect("/dashboard/creator");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Set Up Your Creator Profile
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Help brands discover you by completing your profile
          </p>
        </div>

        <CreatorOnboardingForm 
          userId={dbUser.id} 
          email={dbUser.email}
          firstName={dbUser.first_name}
          lastName={dbUser.last_name}
        />
      </div>
    </div>
  );
}
