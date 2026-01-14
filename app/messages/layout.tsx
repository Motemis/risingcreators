import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser) {
    redirect("/");
  }

  // Import the appropriate layout based on user type
  if (dbUser.user_type === "brand") {
    const { data: brandProfile } = await supabase
      .from("brand_profiles")
      .select("*")
      .eq("user_id", dbUser.id)
      .single();

    if (!brandProfile) {
      redirect("/onboarding/brand");
    }

    const BrandLayoutClient = (await import("@/dashboard/brand/BrandLayoutClient")).default;
    return <BrandLayoutClient brandProfile={brandProfile}>{children}</BrandLayoutClient>;
  } else {
    const { data: creatorProfile } = await supabase
      .from("creator_profiles")
      .select("*")
      .eq("user_id", dbUser.id)
      .single();

    if (!creatorProfile) {
      redirect("/onboarding/creator");
    }

    const CreatorLayoutClient = (await import("@/dashboard/creator/CreatorLayoutClient")).default;
    return <CreatorLayoutClient creatorProfile={creatorProfile}>{children}</CreatorLayoutClient>;
  }
}
