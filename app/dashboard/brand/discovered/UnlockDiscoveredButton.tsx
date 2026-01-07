"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function UnlockDiscoveredButton({
  discoveredCreatorId,
  brandUserId,
}: {
  discoveredCreatorId: string;
  brandUserId: string;
}) {
  const [unlocking, setUnlocking] = useState(false);
  const router = useRouter();

  const handleUnlock = async () => {
    setUnlocking(true);

    const { error } = await supabase.from("discovered_creator_unlocks").insert({
      discovered_creator_id: discoveredCreatorId,
      brand_user_id: brandUserId,
    });

    if (!error) {
      // TODO: Trigger email to creator
      router.refresh();
    }

    setUnlocking(false);
  };

  return (
    <button
      onClick={handleUnlock}
      disabled={unlocking}
      className="bg-[var(--color-accent)] text-white px-8 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
    >
      {unlocking ? "Requesting..." : "Request to Connect"}
    </button>
  );
}