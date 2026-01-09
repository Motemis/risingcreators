import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user type from database
  const { data: dbUser } = await supabase
    .from("users")
    .select("user_type")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser) {
    // User hasn't completed onboarding
    redirect("/onboarding");
  }

  // Redirect based on user type
  if (dbUser.user_type === "brand") {
    redirect("/dashboard/brand");
  } else {
    redirect("/dashboard/creator");
  }
}
