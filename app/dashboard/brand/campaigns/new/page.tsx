import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CampaignForm from "./CampaignForm";

export default async function NewCampaignPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
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

  if (!brandProfile) {
    redirect("/onboarding/brand");
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Create New Campaign
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Define what you're looking for and we'll match you with the best creators
          </p>
        </div>

        <CampaignForm brandProfileId={brandProfile.id} />
      </div>
    </div>
  );
}

