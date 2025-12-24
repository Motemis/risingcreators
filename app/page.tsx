import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function Home() {
  const user = await currentUser();

  // Not signed in — show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-white mb-4">
            Rising Creators
          </h1>
          <p className="text-xl text-gray-400 mb-8">
            The platform for creators on the rise
          </p>
          <p className="text-gray-500">
            Sign up to get started →
          </p>
        </div>
      </div>
    );
  }

  // Signed in — check if they've onboarded
  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  // Not onboarded yet — send to onboarding
  if (!dbUser) {
    redirect("/onboarding");
  }

  // Onboarded — send to their dashboard
  if (dbUser.user_type === "creator") {
    redirect("/dashboard/creator");
  } else {
    redirect("/dashboard/brand");
  }
}