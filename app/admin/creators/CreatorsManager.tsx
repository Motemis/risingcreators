"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Creator {
  id: string;
  platform: string;
  platform_user_id: string;
  platform_username: string;
  display_name: string;
  profile_image_url: string | null;
  bio: string | null;
  followers: number;
  total_posts: number;
  avg_views: number;
  niche: string[] | null;
  rising_score: number | null;
  growth_rate_7d: number | null;
  growth_rate_30d: number | null;
  is_hidden: boolean;
  claimed_by: string | null;
  claimed_at: string | null;
  last_scraped_at: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function CreatorsManager({
  creators,
  currentPage,
  totalPages,
  totalCount,
  currentFilter,
  currentSearch,
}: {
  creators: Creator[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  currentFilter: string;
  currentSearch: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(currentSearch);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [updating, setUpdating] = useState(false);

  const updateUrl = (params: Record<string, string>) => {
    const newParams = new URLSearchParams(searchParams.toString());
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    router.push(`/admin/creators?${newParams.toString()}`);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateUrl({ search, page: "1" });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    setSelected(new Set(creators.map((c) => c.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const bulkAction = async (action: "hide" | "unhide") => {
    if (selected.size === 0) return;
    setUpdating(true);

    const { error } = await supabase
      .from("discovered_creators")
      .update({ is_hidden: action === "hide" })
      .in("id", Array.from(selected));

    if (!error) {
      setSelected(new Set());
      router.refresh();
    }

    setUpdating(false);
  };

  const toggleHidden = async (id: string, currentState: boolean) => {
    await supabase
      .from("discovered_creators")
      .update({ is_hidden: !currentState })
      .eq("id", id);

    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-wrap items-center gap-4 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
        <div className="flex gap-2">
          {["all", "visible", "hidden", "claimed", "unclaimed"].map((filter) => (
            <button
              key={filter}
              onClick={() => updateUrl({ filter, page: "1" })}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentFilter === filter
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name..."
            className="flex-1 px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg"
          >
            Search
          </button>
        </form>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500 rounded-xl p-4">
          <span className="text-blue-500 font-medium">
            {selected.size} selected
          </span>
          <button
            onClick={() => bulkAction("hide")}
            disabled={updating}
            className="px-4 py-1.5 bg-yellow-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Hide Selected
          </button>
          <button
            onClick={() => bulkAction("unhide")}
            disabled={updating}
            className="px-4 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            Unhide Selected
          </button>
          <button
            onClick={clearSelection}
            className="text-sm text-[var(--color-text-secondary)] hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Showing {creators.length} of {totalCount} creators
        </p>
        <button
          onClick={selectAll}
          className="text-sm text-[var(--color-accent)] hover:underline"
        >
          Select All on Page
        </button>
      </div>

      {/* Creators Table */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-[var(--color-bg-tertiary)]">
            <tr>
              <th className="w-10 p-3"></th>
              <th className="text-left p-3 text-sm font-medium text-[var(--color-text-secondary)]">Creator</th>
              <th className="text-left p-3 text-sm font-medium text-[var(--color-text-secondary)]">Niche</th>
              <th className="text-right p-3 text-sm font-medium text-[var(--color-text-secondary)]">Followers</th>
              <th className="text-right p-3 text-sm font-medium text-[var(--color-text-secondary)]">Rising Score</th>
              <th className="text-right p-3 text-sm font-medium text-[var(--color-text-secondary)]">Growth</th>
              <th className="text-center p-3 text-sm font-medium text-[var(--color-text-secondary)]">Status</th>
              <th className="text-right p-3 text-sm font-medium text-[var(--color-text-secondary)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {creators.map((creator) => (
              <tr
                key={creator.id}
                className={`hover:bg-[var(--color-bg-tertiary)] ${
                  creator.is_hidden ? "opacity-50" : ""
                }`}
              >
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.has(creator.id)}
                    onChange={() => toggleSelect(creator.id)}
                    className="w-4 h-4 rounded"
                  />
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    {creator.profile_image_url ? (
                      <img
                        src={creator.profile_image_url}
                        alt={creator.display_name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                        🎬
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">
                        {creator.display_name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        @{creator.platform_username}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {creator.niche?.slice(0, 2).map((n) => (
                      <span
                        key={n}
                        className="text-xs px-2 py-0.5 rounded-full bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 text-right text-[var(--color-text-primary)]">
                  {formatNumber(creator.followers)}
                </td>
                <td className="p-3 text-right">
                  <span
                    className={`font-medium ${
                      (creator.rising_score || 0) >= 70
                        ? "text-green-500"
                        : (creator.rising_score || 0) >= 40
                        ? "text-yellow-500"
                        : "text-[var(--color-text-tertiary)]"
                    }`}
                  >
                    {creator.rising_score || 0}
                  </span>
                </td>
                <td className="p-3 text-right text-sm">
                  {creator.growth_rate_7d ? (
                    <span
                      className={
                        creator.growth_rate_7d > 0 ? "text-green-500" : "text-red-500"
                      }
                    >
                      {creator.growth_rate_7d > 0 ? "+" : ""}
                      {creator.growth_rate_7d.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-tertiary)]">—</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {creator.claimed_by && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                        Claimed
                      </span>
                    )}
                    {creator.is_hidden && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                        Hidden
                      </span>
                    )}
                    {!creator.is_hidden && !creator.claimed_by && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                        Visible
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <a
                      href={`https://youtube.com/channel/${creator.platform_user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-accent)] hover:underline"
                    >
                      View ↗
                    </a>
                    <button
                      onClick={() => toggleHidden(creator.id, creator.is_hidden)}
                      className={`text-xs px-2 py-1 rounded ${
                        creator.is_hidden
                          ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          : "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20"
                      }`}
                    >
                      {creator.is_hidden ? "Unhide" : "Hide"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => updateUrl({ page: String(currentPage - 1) })}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-30"
          >
            Previous
          </button>
          <span className="text-[var(--color-text-secondary)]">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => updateUrl({ page: String(currentPage + 1) })}
            disabled={currentPage >= totalPages}
            className="px-4 py-2 rounded-lg bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] disabled:opacity-30"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}