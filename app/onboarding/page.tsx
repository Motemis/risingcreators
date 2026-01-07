import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/");
  }

  // Check if user already exists
  try {
    const { data: existingUser, error } = await supabase
      .from("users")
      .select("*")
      .eq("clerk_id", user.id)
      .maybeSingle();

    // If query failed, continue to show onboarding form
    if (error) {
      console.error("Supabase error:", error);
      // Continue to show form
    } else if (existingUser?.onboarded) {
      // If already onboarded, redirect to appropriate dashboard
      if (existingUser.user_type === "creator") {
        redirect("/dashboard/creator");
      } else if (existingUser.user_type === "brand") {
        redirect("/dashboard/brand");
      }
    }
  } catch (error: any) {
    // Re-throw redirect errors (Next.js uses special error for redirects)
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error;
    }
    // For other errors, continue to show onboarding form
    console.error("Error checking existing user:", error);
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center p-8">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2 text-center">
          Welcome to Rising Creators
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8 text-center">
          Let's get you set up
        </p>
        
        <OnboardingForm 
          clerkId={user.id} 
          email={user.emailAddresses[0]?.emailAddress || ""} 
          firstName={user.firstName || ""}
          lastName={user.lastName || ""}
        />
      </div>
    </div>
  );
}