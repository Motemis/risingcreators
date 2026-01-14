import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import WatchlistClient from "./WatchlistClient";

export default async function WatchlistPage() {
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

  // Get campaigns for filter dropdown
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("brand_profile_id", brandProfile.id)
    .order("created_at", { ascending: false });

  return <WatchlistClient campaigns={campaigns || []} />;
}
