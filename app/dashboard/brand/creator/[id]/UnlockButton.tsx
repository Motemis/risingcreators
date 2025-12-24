"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UnlockButton({
  creatorId,
  brandClerkId,
}: {
  creatorId: string;
  brandClerkId: string;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleUnlock = async () => {
    setUnlocking(true);
    setError(null);

    console.log("Attempting unlock:", { creatorId, brandClerkId });

    const { data, error: unlockError } = await supabase.from("unlocks").insert({
      brand_clerk_id: brandClerkId,
      creator_id: creatorId,
    }).select();

    console.log("Unlock result:", { data, error: unlockError });

    if (unlockError) {
      console.error("Error unlocking:", unlockError);
      setError(unlockError.message);
      setUnlocking(false);
      return;
    }

    router.refresh();
  };

  return (
    <div>
      <button
        onClick={handleUnlock}
        disabled={unlocking}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {unlocking ? "Unlocking..." : "🔓 Unlock Creator (1 credit)"}
      </button>
      {error && (
        <p className="text-red-400 mt-2 text-sm">{error}</p>
      )}
    </div>
  );
}