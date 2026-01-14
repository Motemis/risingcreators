"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export default function DashboardRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    const checkAndRedirect = async () => {
      try {
        const { data: dbUser, error } = await supabase
          .from("users")
          .select("user_type, onboarded")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user:", error);
          router.push("/onboarding");
          return;
        }

        if (!dbUser || !dbUser.onboarded) {
          router.push("/onboarding");
          return;
        }

        // User exists and is onboarded - redirect to appropriate dashboard
        if (dbUser.user_type === "brand") {
          router.push("/dashboard/brand");
        } else if (dbUser.user_type === "creator") {
          router.push("/dashboard/creator");
        } else {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error in dashboard redirect:", error);
        router.push("/onboarding");
      }
    };

    checkAndRedirect();
  }, [user, isLoaded, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--color-text-secondary)]">Loading dashboard...</p>
      </div>
    </div>
  );
}
