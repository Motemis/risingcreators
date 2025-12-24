"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Watchlist = {
  id: string;
  name: string;
};

export default function SaveToWatchlistButton({
  creatorId,
  brandClerkId,
}: {
  creatorId: string;
  brandClerkId: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadWatchlists();
    }
  }, [isOpen]);

  const loadWatchlists = async () => {
    const { data } = await supabase
      .from("watchlists")
      .select("id, name")
      .eq("brand_clerk_id", brandClerkId);
    
    setWatchlists(data || []);
  };

  const handleSave = async (watchlistId: string) => {
    setLoading(true);

    const { error } = await supabase.from("watchlist_creators").insert({
      watchlist_id: watchlistId,
      creator_id: creatorId,
    });

    if (error) {
      if (error.code === "23505") {
        alert("Creator already in this watchlist");
      } else {
        console.error("Error saving:", error);
      }
      setLoading(false);
      return;
    }

    setSaved(true);
    setIsOpen(false);
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-300 hover:text-white px-4 py-2 border border-gray-600 rounded-lg"
      >
        {saved ? "✓ Saved" : "☆ Save"}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-2 min-w-48 z-10">
          {watchlists.length > 0 ? (
            <>
              <p className="text-gray-400 text-xs px-2 py-1">Save to watchlist:</p>
              {watchlists.map((watchlist) => (
                <button
                  key={watchlist.id}
                  onClick={() => handleSave(watchlist.id)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-white hover:bg-gray-700 rounded disabled:opacity-50"
                >
                  {watchlist.name}
                </button>
              ))}
            </>
          ) : (
            <p className="text-gray-400 text-sm p-2">
              No watchlists yet. Create one first.
            </p>
          )}
        </div>
      )}
    </div>
  );
}