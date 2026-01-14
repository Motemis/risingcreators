import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CreatorLayoutClient from "./CreatorLayoutClient";

export default async function CreatorDashboardLayout({
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

  if (!dbUser || dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    redirect("/onboarding/creator");
  }

  return (
    <CreatorLayoutClient creatorProfile={creatorProfile}>
      {children}
    </CreatorLayoutClient>
  );
}
