"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function UserTypeSelector({ 
  clerkId, 
  email 
}: { 
  clerkId: string; 
  email: string;
}) {
  const [selected, setSelected] = useState<"creator" | "brand" | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleContinue = async () => {
    if (!selected) return;

    setLoading(true);

    const { error } = await supabase.from("users").insert({
      clerk_id: clerkId,
      email: email,
      user_type: selected,
      onboarded: true,
    });

    if (error) {
      console.error("Error saving user:", error);
      setLoading(false);
      return;
    }

    if (selected === "creator") {
      router.push("/dashboard/creator");
    } else {
      router.push("/dashboard/brand");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setSelected("creator")}
        className={`w-full p-6 rounded-lg border-2 text-left transition ${
          selected === "creator"
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <h3 className="text-xl font-semibold text-white mb-1">I'm a Creator</h3>
        <p className="text-gray-400">
          Track my growth, see benchmarks, and get discovered by brands
        </p>
      </button>

      <button
        onClick={() => setSelected("brand")}
        className={`w-full p-6 rounded-lg border-2 text-left transition ${
          selected === "brand"
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-700 hover:border-gray-600"
        }`}
      >
        <h3 className="text-xl font-semibold text-white mb-1">I'm a Brand</h3>
        <p className="text-gray-400">
          Discover rising creators and find partnership opportunities
        </p>
      </button>

      <button
        onClick={handleContinue}
        disabled={!selected || loading}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          selected
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
      >
        {loading ? "Saving..." : "Continue"}
      </button>
    </div>
  );
}