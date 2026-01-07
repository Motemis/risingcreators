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
  const [showNewForm, setShowNewForm] = useState(false);
  const [newListName, setNewListName] = useState("");
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

    const { error } = await supabase.from("watchlist_items").insert({
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

  const handleCreateAndSave = async () => {
    if (!newListName.trim()) return;
    
    setLoading(true);

    // Create the watchlist
    const { data: newList, error: createError } = await supabase
      .from("watchlists")
      .insert({
        brand_clerk_id: brandClerkId,
        name: newListName.trim(),
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating watchlist:", createError);
      setLoading(false);
      return;
    }

    // Add creator to the new watchlist
    const { error: saveError } = await supabase.from("watchlist_items").insert({
      watchlist_id: newList.id,
      creator_id: creatorId,
    });

    if (saveError) {
      console.error("Error saving to watchlist:", saveError);
      setLoading(false);
      return;
    }

    setSaved(true);
    setIsOpen(false);
    setShowNewForm(false);
    setNewListName("");
    setLoading(false);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-4 py-2 border border-[var(--color-border-strong)] rounded-lg transition-colors"
      >
        {saved ? "✓ Saved" : "☆ Save"}
      </button>

      {isOpen && (
        <div className="absolute top-12 right-0 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg shadow-lg p-2 min-w-56 z-10">
          {watchlists.length > 0 && !showNewForm && (
            <>
              <p className="text-[var(--color-text-tertiary)] text-xs px-2 py-1">
                Save to watchlist:
              </p>
              {watchlists.map((watchlist) => (
                <button
                  key={watchlist.id}
                  onClick={() => handleSave(watchlist.id)}
                  disabled={loading}
                  className="w-full text-left px-3 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded disabled:opacity-50"
                >
                  {watchlist.name}
                </button>
              ))}
              <hr className="my-2 border-[var(--color-border)]" />
            </>
          )}

          {showNewForm ? (
            <div className="p-2">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Watchlist name..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm mb-2"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAndSave}
                  disabled={loading || !newListName.trim()}
                  className="flex-1 px-3 py-2 bg-[var(--color-accent)] text-white text-sm rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Create & Save"}
                </button>
                <button
                  onClick={() => {
                    setShowNewForm(false);
                    setNewListName("");
                  }}
                  className="px-3 py-2 text-[var(--color-text-secondary)] text-sm hover:text-[var(--color-text-primary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowNewForm(true)}
              className="w-full text-left px-3 py-2 text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] rounded text-sm font-medium"
            >
              + Create new watchlist
            </button>
          )}
        </div>
      )}
    </div>
  );
}
