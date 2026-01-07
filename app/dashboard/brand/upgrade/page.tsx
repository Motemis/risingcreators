import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import UpgradeOptions from "./UpgradeOptions";

export default async function UpgradePage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    redirect("/");
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  const isPremium =
    brandProfile?.is_premium &&
    (!brandProfile.premium_until ||
      new Date(brandProfile.premium_until) > new Date());

  if (isPremium) {
    redirect("/dashboard/brand/discover");
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-4">
            Unlock Rising Creators
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            Get full access to creator profiles and connect with rising stars
            before your competitors.
          </p>
        </div>

        <UpgradeOptions brandProfileId={brandProfile?.id} userId={dbUser.id} />
      </div>
    </div>
  );
}

