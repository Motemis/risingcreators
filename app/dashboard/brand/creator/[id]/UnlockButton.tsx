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

    const { data, error: unlockError } = await supabase
      .from("unlocks")
      .insert({
        brand_clerk_id: brandClerkId,
        creator_id: creatorId,
      })
      .select();

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
        className="bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[var(--color-accent-hover)] disabled:opacity-50 transition-colors"
      >
        {unlocking ? "Unlocking..." : "🔓 Unlock Creator"}
      </button>
      {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
    </div>
  );
}
