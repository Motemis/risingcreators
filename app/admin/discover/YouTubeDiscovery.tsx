"use client";

import { useState } from "react";

interface Channel {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  customUrl?: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function YouTubeDiscovery() {
  const [query, setQuery] = useState("");
  const [minSubs, setMinSubs] = useState("1000");
  const [maxSubs, setMaxSubs] = useState("50000");
  const [searching, setSearching] = useState(false);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [sweeping, setSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState("");
  const [enriching, setEnriching] = useState(false);
  const [enrichMessage, setEnrichMessage] = useState("");

  const handleSweep = async () => {
    setSweeping(true);
    setSweepMessage("");

    try {
      const response = await fetch("/api/admin/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minSubs: 10000, maxSubs: 500000 }),
      });

      const data = await response.json();

      if (response.ok) {
        setSweepMessage(`✓ Found ${data.found} creators, imported ${data.imported}`);
      } else {
        setSweepMessage("Error: " + data.error);
      }
    } catch (err) {
      setSweepMessage("Sweep failed");
    }

    setSweeping(false);
  };

  const handleEnrich = async () => {
    setEnriching(true);
    setEnrichMessage("");

    try {
      const response = await fetch("/api/admin/enrich-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 50 }),
      });

      const data = await response.json();

      if (response.ok) {
        setEnrichMessage(`✓ Enriched ${data.enriched} creators with detailed metrics`);
      } else {
        setEnrichMessage("Error: " + data.error);
      }
    } catch (err) {
      setEnrichMessage("Enrichment failed");
    }

    setEnriching(false);
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setSearching(true);
    setMessage("");
    setChannels([]);

    try {
      const response = await fetch("/api/admin/youtube/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: query.trim(),
          minSubs: parseInt(minSubs),
          maxSubs: parseInt(maxSubs),
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setChannels(data.channels || []);
        if (data.channels?.length === 0) {
          setMessage("No channels found matching your criteria.");
        }
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (err) {
      setMessage("Search failed. Please try again.");
    }

    setSearching(false);
  };

  const toggleSelect = (channelId: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(channelId)) {
      newSelected.delete(channelId);
    } else {
      newSelected.add(channelId);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    setSelected(new Set(channels.map((c) => c.id)));
  };

  const clearSelection = () => {
    setSelected(new Set());
  };

  const handleImport = async () => {
    if (selected.size === 0) return;

    setImporting(true);
    setMessage("");

    const channelsToImport = channels.filter((c) => selected.has(c.id));

    try {
      const response = await fetch("/api/admin/youtube/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channels: channelsToImport }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ Imported ${data.imported} creators!`);
        setSelected(new Set());
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (err) {
      setMessage("Import failed. Please try again.");
    }

    setImporting(false);
  };

  return (
    <div className="space-y-6">
      {/* Broad Sweep */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Broad Sweep
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Automatically find and import all creators between 10K-500K subscribers. 
          AI will auto-categorize them by niche.
        </p>
        <button
          onClick={handleSweep}
          disabled={sweeping}
          className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
        >
          {sweeping ? "Sweeping..." : "Run Broad Sweep"}
        </button>
        {sweepMessage && (
          <p
            className={`mt-2 text-sm ${
              sweepMessage.startsWith("✓") ? "text-green-500" : "text-red-500"
            }`}
          >
            {sweepMessage}
          </p>
        )}
      </div>

      {/* Enrich Data */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
          Enrich Creator Data
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          Fetch detailed video stats to calculate engagement rates, consistency scores, 
          brand readiness, and estimated reach for existing creators.
        </p>
        <button
          onClick={handleEnrich}
          disabled={enriching}
          className="bg-purple-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50"
        >
          {enriching ? "Enriching..." : "Enrich Creator Data"}
        </button>
        {enrichMessage && (
          <p
            className={`mt-2 text-sm ${
              enrichMessage.startsWith("✓") ? "text-green-500" : "text-red-500"
            }`}
          >
            {enrichMessage}
          </p>
        )}
      </div>

      {/* Search Form */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
          Search YouTube Channels
        </h2>

        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-2">
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
              Search Query
            </label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g., fitness tips, cooking tutorials, tech reviews"
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
              Min Subscribers
            </label>
            <select
              value={minSubs}
              onChange={(e) => setMinSubs(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              <option value="1000">1K</option>
              <option value="5000">5K</option>
              <option value="10000">10K</option>
              <option value="20000">20K</option>
              <option value="40000">40K</option>
              <option value="50000">50K</option>
              <option value="100000">100K</option>
              <option value="200000">200K</option>
              <option value="250000">250K</option>
              <option value="300000">300K</option>
              <option value="400000">400K</option>
              <option value="500000">500K</option>
              <option value="750000">750K</option>
              <option value="1000000">1M</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
              Max Subscribers
            </label>
            <select
              value={maxSubs}
              onChange={(e) => setMaxSubs(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              <option value="5000">5K</option>
              <option value="10000">10K</option>
              <option value="20000">20K</option>
              <option value="40000">40K</option>
              <option value="50000">50K</option>
              <option value="100000">100K</option>
              <option value="200000">200K</option>
              <option value="250000">250K</option>
              <option value="300000">300K</option>
              <option value="400000">400K</option>
              <option value="500000">500K</option>
              <option value="750000">750K</option>
              <option value="1000000">1M</option>
              <option value="1000000000">1M+</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleSearch}
          disabled={searching || !query.trim()}
          className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
        >
          {searching ? "Searching..." : "Search YouTube"}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-lg ${
            message.startsWith("✓")
              ? "bg-green-500/10 border border-green-500 text-green-500"
              : "bg-red-500/10 border border-red-500 text-red-500"
          }`}
        >
          {message}
        </div>
      )}

      {/* Results */}
      {channels.length > 0 && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Results ({channels.length} channels)
            </h2>

            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--color-text-secondary)]">
                {selected.size} selected
              </span>
              <button
                onClick={selectAll}
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="text-sm text-[var(--color-text-secondary)] hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            {channels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => toggleSelect(channel.id)}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selected.has(channel.id)
                    ? "border-[var(--color-accent)] bg-[var(--color-accent-light)]"
                    : "border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selected.has(channel.id)
                      ? "border-[var(--color-accent)] bg-[var(--color-accent)] text-white"
                      : "border-[var(--color-border-strong)]"
                  }`}
                >
                  {selected.has(channel.id) && "✓"}
                </div>

                <img
                  src={channel.thumbnail}
                  alt={channel.title}
                  className="w-16 h-16 rounded-full object-cover"
                />

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-text-primary)] truncate">
                    {channel.title}
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-1">
                    {channel.description || "No description"}
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-[var(--color-text-tertiary)]">
                    <span>👥 {formatNumber(channel.subscriberCount)} subs</span>
                    <span>🎬 {formatNumber(channel.videoCount)} videos</span>
                    <span>👁 {formatNumber(channel.viewCount)} views</span>
                  </div>
                </div>

                <a
                  href={`https://youtube.com/channel/${channel.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-[var(--color-accent)] hover:underline text-sm"
                >
                  View ↗
                </a>
              </div>
            ))}
          </div>

          <button
            onClick={handleImport}
            disabled={importing || selected.size === 0}
            className="w-full bg-[var(--color-accent)] text-white py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {importing
              ? "Importing..."
              : `Import ${selected.size} Creator${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}


