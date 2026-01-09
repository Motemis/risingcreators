import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BrandOnboardingForm from "./BrandOnboardingForm";

export default async function BrandOnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser) {
    redirect("/onboarding");
  }

  if (dbUser.user_type !== "brand") {
    redirect("/dashboard/creator");
  }

  // Check if already completed onboarding
  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (brandProfile?.onboarding_completed) {
    redirect("/dashboard/brand/discover");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-8">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Tell us about your brand
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            We'll use this to match you with the perfect creators
          </p>
        </div>

        <BrandOnboardingForm userId={dbUser.id} existingProfile={brandProfile} />
      </div>
    </div>
  );
}


