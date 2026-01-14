import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DealManager from "./DealManager";

export default async function DealDetailPage({
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

  // Get deal - simple query first
  const { data: deal, error: dealError } = await supabase
    .from("campaign_creators")
    .select(`
      *,
      campaign:campaigns(
        id,
        name,
        brand_profile_id,
        budget_per_creator,
        deliverables,
        brief,
        start_date,
        end_date
      ),
      creator_profile:creator_profiles(
        id,
        display_name,
        bio,
        profile_photo_url,
        youtube_profile_image_url,
        youtube_subscribers,
        youtube_url,
        tiktok_followers,
        tiktok_handle,
        instagram_followers,
        instagram_handle,
        contact_email,
        rate_youtube_integration,
        rate_youtube_dedicated,
        rate_tiktok_post,
        rate_instagram_post,
        media_kit_url
      )
    `)
    .eq("id", id)
    .single();

  // Verify deal exists and belongs to this brand
  if (!deal || deal.campaign?.brand_profile_id !== brandProfile.id) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard/brand/deals"
          className="inline-flex items-center gap-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6"
        >
          ← Back to Deals
        </Link>

        <DealManager deal={deal} />
      </div>
    </div>
  );
}
