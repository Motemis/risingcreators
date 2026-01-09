"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function OnboardingForm({
  clerkId,
  email,
  firstName,
  lastName,
}: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const router = useRouter();
  const [userType, setUserType] = useState<"creator" | "brand" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!userType) {
      setError("Please select an option");
      return;
    }

    setLoading(true);
    setError("");

    const { error: insertError } = await supabase.from("users").insert({
      clerk_id: clerkId,
      email: email,
      first_name: firstName,
      last_name: lastName,
      user_type: userType,
      onboarded: true,
    });

    if (insertError) {
      setError("Error creating account: " + insertError.message);
      setLoading(false);
      return;
    }

    // Redirect to appropriate dashboard with full page reload
    // Using window.location.href ensures a full page reload and fresh data fetch
    if (userType === "creator") {
      window.location.href = "/dashboard/creator";
    } else {
      window.location.href = "/onboarding/brand";
    }
  };

  const optionClass = (selected: boolean) =>
    `p-6 rounded-xl border-2 cursor-pointer transition-all ${
      selected
        ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
        : "border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] hover:border-[var(--color-accent)]"
    }`;

  return (
    <div className="space-y-6">
      <p className="text-[var(--color-text-primary)] font-medium text-center">
        I am a...
      </p>

      <div className="space-y-4">
        <button
          type="button"
          onClick={() => setUserType("creator")}
          className={`${optionClass(userType === "creator")} w-full text-left`}
        >
          <div className="text-lg font-semibold text-[var(--color-text-primary)]">
            Creator
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] mt-1">
            I create content and want to connect with brands
          </div>
        </button>

        <button
          type="button"
          onClick={() => setUserType("brand")}
          className={`${optionClass(userType === "brand")} w-full text-left`}
        >
          <div className="text-lg font-semibold text-[var(--color-text-primary)]">
            Brand
          </div>
          <div className="text-sm text-[var(--color-text-secondary)] mt-1">
            I represent a brand looking for creators
          </div>
        </button>
      </div>

      {error && (
        <p className="text-red-500 text-sm text-center">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!userType || loading}
        className="w-full bg-[var(--color-accent)] text-white font-semibold py-3 px-6 rounded-full hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
      >
        {loading ? "Setting up..." : "Continue"}
      </button>
    </div>
  );
}

