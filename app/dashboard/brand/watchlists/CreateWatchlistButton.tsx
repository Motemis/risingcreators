"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function CreateWatchlistButton({
  brandClerkId,
}: {
  brandClerkId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) return;

    setCreating(true);

    const { error } = await supabase.from("watchlists").insert({
      brand_clerk_id: brandClerkId,
      name: name.trim(),
    });

    if (error) {
      console.error("Error creating watchlist:", error);
      setCreating(false);
      return;
    }

    setName("");
    setIsOpen(false);
    setCreating(false);
    router.refresh();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700"
      >
        + New Watchlist
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Watchlist name..."
        className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
        autoFocus
      />
      <button
        onClick={handleCreate}
        disabled={creating || !name.trim()}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {creating ? "..." : "Create"}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="text-gray-400 px-2 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}