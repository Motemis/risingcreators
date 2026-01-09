import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import BrandProfileForm from "./BrandProfileForm";

export default async function BrandProfilePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  // If user doesn't exist, redirect to onboarding
  if (!dbUser || !dbUser.onboarded) {
    redirect("/onboarding");
  }

  // Verify user is a brand
  if (dbUser.user_type !== "brand") {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Brand Profile
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Tell creators about your brand
        </p>

        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <BrandProfileForm userId={dbUser.id} existingProfile={profile} />
        </div>
      </div>
    </div>
  );
}




