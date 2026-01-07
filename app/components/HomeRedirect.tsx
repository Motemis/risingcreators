"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";

export default function HomeRedirect() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) return;

    const checkUser = async () => {
      try {
        const { data: dbUser, error } = await supabase
          .from("users")
          .select("*")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          router.push("/onboarding");
          return;
        }

        if (!dbUser || !dbUser.onboarded) {
          router.push("/onboarding");
          return;
        }

        // User is onboarded, redirect to appropriate dashboard
        if (dbUser.user_type === "creator") {
          router.push("/dashboard/creator");
        } else if (dbUser.user_type === "brand") {
          router.push("/dashboard/brand");
        } else {
          router.push("/onboarding");
        }
      } catch (error) {
        console.error("Error checking user:", error);
        router.push("/onboarding");
      }
    };

    checkUser();
  }, [user, isLoaded, router]);

  return null;
}

