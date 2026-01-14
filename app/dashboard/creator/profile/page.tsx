import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import CreatorProfileEditor from "./CreatorProfileEditor";

export default async function CreatorProfilePage() {
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
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            My Profile
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            This is how brands see you. Click any section to edit.
          </p>
        </div>

        <CreatorProfileEditor profile={creatorProfile} />
      </div>
    </div>
  );
}
