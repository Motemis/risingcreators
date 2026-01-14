import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import CampaignForm from "../../new/CampaignForm";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  // Get existing campaign
  const { data: campaign } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .eq("brand_profile_id", brandProfile.id)
    .single();

  if (!campaign) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <Link
          href={`/dashboard/brand/campaigns/${id}`}
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          ← Back to Campaign
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Edit Campaign
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Update your campaign details and creator requirements
          </p>
        </div>

        <CampaignForm 
          brandProfileId={brandProfile.id} 
          existingCampaign={campaign}
          isEditing={true}
        />
      </div>
    </div>
  );
}
