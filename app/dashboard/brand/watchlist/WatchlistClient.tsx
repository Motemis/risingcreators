"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StartConversationModal from "@/components/StartConversationModal";

interface Campaign {
  id: string;
  name: string;
}

interface WatchlistItem {
  id: string;
  source: string;
  status: string;
  is_unlocked: boolean;
  notes: string | null;
  tags: string[] | null;
  created_at: string;
  campaign_id: string | null;
  conversation_id: string | null;
  creator_profile: {
    id: string;
    display_name: string | null;
    profile_photo_url: string | null;
    youtube_profile_image_url: string | null;
    youtube_subscribers: number | null;
    tiktok_followers: number | null;
    instagram_followers: number | null;
    niche: string[] | null;
    contact_email: string | null;
    engagement_rate: number | null;
    brand_readiness_score: number | null;
  } | null;
  discovered_creator: {
    id: string;
    name: string | null;
    thumbnail_url: string | null;
    subscriber_count: number | null;
    platform: string | null;
    primary_niche: string | null;
  } | null;
  campaign: {
    id: string;
    name: string;
  } | null;
  conversation: {
    id: string;
    last_message_at: string | null;
  } | null;
}

const SOURCE_OPTIONS = [
  { value: "", label: "All Sources" },
  { value: "manual", label: "Manually Added" },
  { value: "direct_outreach", label: "Direct Outreach" },
  { value: "campaign", label: "From Campaign" },
  { value: "discovery", label: "From Discovery" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "watching", label: "Watching" },
  { value: "reached_out", label: "Reached Out" },
  { value: "in_conversation", label: "In Conversation" },
  { value: "negotiating", label: "Negotiating" },
  { value: "converted", label: "Converted" },
  { value: "passed", label: "Passed" },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  watching: { bg: "bg-gray-500/10", text: "text-gray-500" },
  reached_out: { bg: "bg-blue-500/10", text: "text-blue-500" },
  in_conversation: { bg: "bg-purple-500/10", text: "text-purple-500" },
  negotiating: { bg: "bg-yellow-500/10", text: "text-yellow-500" },
  converted: { bg: "bg-green-500/10", text: "text-green-500" },
  passed: { bg: "bg-red-500/10", text: "text-red-500" },
};

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function WatchlistClient({ campaigns }: { campaigns: Campaign[] }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterOptions, setFilterOptions] = useState<{ tags: string[]; campaigns: Campaign[] }>({
    tags: [],
    campaigns: [],
  });

  // Filters
  const [campaignFilter, setCampaignFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [unlockedFilter, setUnlockedFilter] = useState("");
  const [noCampaignFilter, setNoCampaignFilter] = useState(false);
  const [tagFilter, setTagFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [messageModalCreator, setMessageModalCreator] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingItem, setEditingItem] = useState<WatchlistItem | null>(null);
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    loadWatchlist();
  }, [campaignFilter, sourceFilter, statusFilter, unlockedFilter, noCampaignFilter, tagFilter]);

  const loadWatchlist = async () => {
    setLoading(true);
    
    const params = new URLSearchParams();
    if (campaignFilter) params.set("campaign_id", campaignFilter);
    if (sourceFilter) params.set("source", sourceFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (unlockedFilter) params.set("is_unlocked", unlockedFilter);
    if (noCampaignFilter) params.set("no_campaign", "true");
    if (tagFilter) params.set("tag", tagFilter);

    const res = await fetch(`/api/watchlist?${params.toString()}`);
    const data = await res.json();

    if (data.items) {
      setItems(data.items);
    }
    if (data.filterOptions) {
      setFilterOptions(data.filterOptions);
    }

    setLoading(false);
  };

  const updateItemStatus = async (itemId: string, newStatus: string) => {
    await fetch("/api/watchlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, status: newStatus }),
    });
    loadWatchlist();
  };

  const updateItemTags = async (itemId: string, tags: string[]) => {
    await fetch("/api/watchlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, tags }),
    });
    loadWatchlist();
  };

  const updateItemNotes = async (itemId: string, notes: string) => {
    await fetch("/api/watchlist", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: itemId, notes }),
    });
  };

  const removeFromWatchlist = async (itemId: string) => {
    if (!confirm("Remove from watchlist?")) return;
    
    await fetch(`/api/watchlist?id=${itemId}`, {
      method: "DELETE",
    });
    loadWatchlist();
  };

  const addTagToItem = (item: WatchlistItem) => {
    if (!newTag.trim()) return;
    const currentTags = item.tags || [];
    if (!currentTags.includes(newTag.trim())) {
      updateItemTags(item.id, [...currentTags, newTag.trim()]);
    }
    setNewTag("");
  };

  const removeTagFromItem = (item: WatchlistItem, tagToRemove: string) => {
    const currentTags = item.tags || [];
    updateItemTags(item.id, currentTags.filter(t => t !== tagToRemove));
  };

  // Filter items by search query
  const filteredItems = items.filter((item) => {
    if (!searchQuery) return true;
    const name = item.creator_profile?.display_name || item.discovered_creator?.name || "";
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getCreatorName = (item: WatchlistItem) => {
    return item.creator_profile?.display_name || item.discovered_creator?.name || "Unknown";
  };

  const getCreatorImage = (item: WatchlistItem) => {
    return item.creator_profile?.profile_photo_url || 
           item.creator_profile?.youtube_profile_image_url || 
           item.discovered_creator?.thumbnail_url;
  };

  const getCreatorFollowers = (item: WatchlistItem) => {
    if (item.creator_profile) {
      return (item.creator_profile.youtube_subscribers || 0) +
             (item.creator_profile.tiktok_followers || 0) +
             (item.creator_profile.instagram_followers || 0);
    }
    return item.discovered_creator?.subscriber_count || 0;
  };

  const getCreatorNiche = (item: WatchlistItem) => {
    return item.creator_profile?.niche || 
           (item.discovered_creator?.primary_niche ? [item.discovered_creator.primary_niche] : []);
  };

  const getProfileLink = (item: WatchlistItem) => {
    if (item.creator_profile) {
      return `/dashboard/brand/creator/${item.creator_profile.id}`;
    }
    if (item.discovered_creator) {
      return `/dashboard/brand/discovered/${item.discovered_creator.id}`;
    }
    return "#";
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Watchlist</h1>
          <p className="text-[var(--color-text-secondary)]">
            Track and manage creators you're interested in
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{items.length}</p>
            <p className="text-xs text-[var(--color-text-tertiary)]">Total</p>
          </div>
          {STATUS_OPTIONS.slice(1).map((status) => {
            const count = items.filter(i => i.status === status.value).length;
            const colors = STATUS_COLORS[status.value] || { bg: "bg-gray-500/10", text: "text-gray-500" };
            return (
              <div 
                key={status.value}
                className={`${colors.bg} border border-[var(--color-border)] rounded-xl p-4 text-center cursor-pointer hover:opacity-80`}
                onClick={() => setStatusFilter(statusFilter === status.value ? "" : status.value)}
              >
                <p className={`text-2xl font-bold ${colors.text}`}>{count}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">{status.label}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="Search creators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            {/* Campaign Filter */}
            <select
              value={campaignFilter}
              onChange={(e) => {
                setCampaignFilter(e.target.value);
                if (e.target.value) setNoCampaignFilter(false);
              }}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              <option value="">All Campaigns</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            {/* No Campaign Toggle */}
            <button
              onClick={() => {
                setNoCampaignFilter(!noCampaignFilter);
                if (!noCampaignFilter) setCampaignFilter("");
              }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                noCampaignFilter
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                  : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]"
              }`}
            >
              No Campaign
            </button>

            {/* Source Filter */}
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>

            {/* Unlocked Filter */}
            <select
              value={unlockedFilter}
              onChange={(e) => setUnlockedFilter(e.target.value)}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              <option value="">All</option>
              <option value="true">Unlocked</option>
              <option value="false">Locked</option>
            </select>

            {/* Tag Filter */}
            {filterOptions.tags.length > 0 && (
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="">All Tags</option>
                {filterOptions.tags.map((tag) => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-tertiary)]">Loading...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
            <div className="text-5xl mb-4">👀</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No creators on your watchlist
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Add creators from Discovery to track them here
            </p>
            <Link
              href="/dashboard/brand/discover"
              className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
            >
              Discover Creators
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const name = getCreatorName(item);
              const image = getCreatorImage(item);
              const followers = getCreatorFollowers(item);
              const niches = getCreatorNiche(item);
              const statusColors = STATUS_COLORS[item.status] || STATUS_COLORS.watching;

              return (
                <div
                  key={item.id}
                  className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5"
                >
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <Link href={getProfileLink(item)} className="flex-shrink-0 relative">
                      {image ? (
                        <img
                          src={image}
                          alt={name}
                          className={`w-14 h-14 rounded-full object-cover ${!item.is_unlocked ? "blur-sm" : ""}`}
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl">
                          👤
                        </div>
                      )}
                      {!item.is_unlocked && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span>🔒</span>
                        </div>
                      )}
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Link href={getProfileLink(item)}>
                          <h3 className="font-semibold text-[var(--color-text-primary)] hover:text-[var(--color-accent)]">
                            {item.is_unlocked ? name : "🔒 Locked"}
                          </h3>
                        </Link>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}>
                          {STATUS_OPTIONS.find(s => s.value === item.status)?.label || item.status}
                        </span>
                        {item.source === "direct_outreach" && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500">
                            Direct Outreach
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                        <span>{formatNumber(followers)} followers</span>
                        {niches.length > 0 && (
                          <span>{niches.slice(0, 2).join(", ")}</span>
                        )}
                        {item.campaign && (
                          <span className="text-[var(--color-accent)]">
                            📋 {item.campaign.name}
                          </span>
                        )}
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {item.tags?.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                          >
                            {tag}
                            <button
                              onClick={() => removeTagFromItem(item, tag)}
                              className="hover:text-red-500"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {editingItem?.id === item.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  addTagToItem(item);
                                  setEditingItem(null);
                                }
                              }}
                              placeholder="Add tag..."
                              className="px-2 py-0.5 text-xs rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] w-24"
                              autoFocus
                            />
                            <button
                              onClick={() => setEditingItem(null)}
                              className="text-xs text-[var(--color-text-tertiary)]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditingItem(item)}
                            className="text-xs text-[var(--color-accent)] hover:underline"
                          >
                            + Add tag
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {/* Status Dropdown */}
                      <select
                        value={item.status}
                        onChange={(e) => updateItemStatus(item.id, e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                      >
                        {STATUS_OPTIONS.slice(1).map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>

                      {/* Message Button - only for unlocked claimed creators */}
                      {item.is_unlocked && item.creator_profile && (
                        <button
                          onClick={() => setMessageModalCreator({
                            id: item.creator_profile!.id,
                            name: item.creator_profile!.display_name || "Creator",
                          })}
                          className="px-3 py-1.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
                        >
                          💬 Message
                        </button>
                      )}

                      {/* View Conversation */}
                      {item.conversation && (
                        <Link
                          href={`/messages?conversation=${item.conversation.id}`}
                          className="px-3 py-1.5 border border-[var(--color-border)] rounded-lg text-sm hover:bg-[var(--color-bg-tertiary)]"
                        >
                          View Chat
                        </Link>
                      )}

                      {/* Remove */}
                      <button
                        onClick={() => removeFromWatchlist(item.id)}
                        className="p-1.5 text-[var(--color-text-tertiary)] hover:text-red-500 rounded"
                        title="Remove from watchlist"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {messageModalCreator && (
        <StartConversationModal
          isOpen={true}
          onClose={() => setMessageModalCreator(null)}
          creatorProfileId={messageModalCreator.id}
          creatorName={messageModalCreator.name}
        />
      )}
    </div>
  );
}
