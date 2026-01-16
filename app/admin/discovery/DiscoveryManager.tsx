"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Rule {
  id: string;
  name: string;
  search_queries: string[];
  target_niches: string[];
  min_followers: number;
  max_followers: number;
  is_active: boolean;
  last_run_at: string | null;
  created_at: string;
}

const NICHES = [
  "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
  "Travel", "Gaming", "Finance", "Education", "Entertainment",
  "Music", "Sports", "Parenting", "Pets"
];

export default function DiscoveryManager({ rules }: { rules: Rule[] }) {
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<{ found: number; imported: number } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [queries, setQueries] = useState("");
  const [selectedNiches, setSelectedNiches] = useState<string[]>([]);
  const [minFollowers, setMinFollowers] = useState(10000);
  const [maxFollowers, setMaxFollowers] = useState(500000);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    const queryList = queries
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    const res = await fetch("/api/admin/discovery-rules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        search_queries: queryList,
        target_niches: selectedNiches,
        min_followers: minFollowers,
        max_followers: maxFollowers,
      }),
    });

    if (res.ok) {
      setShowCreate(false);
      setName("");
      setQueries("");
      setSelectedNiches([]);
      router.refresh();
    }

    setCreating(false);
  };

  const runRule = async (ruleId: string) => {
    setRunning(ruleId);
    setRunResult(null);

    try {
      const res = await fetch("/api/admin/auto-discover/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId }),
      });

      const data = await res.json();
      if (res.ok) {
        setRunResult(data);
        router.refresh();
      } else {
        alert(data.error || "Failed to run discovery");
      }
    } catch (err) {
      alert("Failed to run discovery");
    }

    setRunning(null);
  };

  const toggleRule = async (ruleId: string, isActive: boolean) => {
    await fetch("/api/admin/discovery-rules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ruleId, is_active: !isActive }),
    });
    router.refresh();
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    await fetch("/api/admin/discovery-rules", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ruleId }),
    });
    router.refresh();
  };

  const toggleNiche = (niche: string) => {
    setSelectedNiches((prev) =>
      prev.includes(niche)
        ? prev.filter((n) => n !== niche)
        : [...prev, niche]
    );
  };

  return (
    <div className="space-y-6">
      {/* Run Result */}
      {runResult && (
        <div className="bg-green-500/10 border border-green-500 rounded-xl p-4">
          <p className="text-green-500 font-medium">
            Discovery complete! Found {runResult.found} creators, imported {runResult.imported} new.
          </p>
        </div>
      )}

      {/* Create New Rule */}
      {!showCreate ? (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full py-4 border-2 border-dashed border-[var(--color-border)] rounded-xl text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          + Create Discovery Rule
        </button>
      ) : (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
            New Discovery Rule
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Tech YouTubers 10K-100K"
                required
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                Search Queries (one per line)
              </label>
              <textarea
                value={queries}
                onChange={(e) => setQueries(e.target.value)}
                placeholder={"tech review youtube\ngadget unboxing\ntech tips tutorial"}
                rows={4}
                required
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-mono text-sm"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Each line will be searched separately on YouTube
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Target Niches
              </label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedNiches.includes(niche)
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Min Followers
                </label>
                <select
                  value={minFollowers}
                  onChange={(e) => setMinFollowers(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  <option value={1000}>1,000</option>
                  <option value={5000}>5,000</option>
                  <option value={10000}>10,000</option>
                  <option value={25000}>25,000</option>
                  <option value={50000}>50,000</option>
                  <option value={100000}>100,000</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  Max Followers
                </label>
                <select
                  value={maxFollowers}
                  onChange={(e) => setMaxFollowers(parseInt(e.target.value))}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  <option value={50000}>50,000</option>
                  <option value={100000}>100,000</option>
                  <option value={250000}>250,000</option>
                  <option value={500000}>500,000</option>
                  <option value={1000000}>1,000,000</option>
                  <option value={10000000}>Unlimited</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={creating || selectedNiches.length === 0}
                className="flex-1 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create Rule"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-6 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Existing Rules */}
      <div className="space-y-4">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-[var(--color-text-primary)]">{rule.name}</h3>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      rule.is_active
                        ? "bg-green-500/10 text-green-500"
                        : "bg-yellow-500/10 text-yellow-500"
                    }`}
                  >
                    {rule.is_active ? "Active" : "Paused"}
                  </span>
                </div>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Created {new Date(rule.created_at).toLocaleDateString()}
                  {rule.last_run_at && ` • Last run ${new Date(rule.last_run_at).toLocaleDateString()}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => runRule(rule.id)}
                  disabled={running === rule.id}
                  className="px-4 py-1.5 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium disabled:opacity-50"
                >
                  {running === rule.id ? "Running..." : "Run Now"}
                </button>
                <button
                  onClick={() => toggleRule(rule.id, rule.is_active)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium ${
                    rule.is_active
                      ? "bg-yellow-500/10 text-yellow-500"
                      : "bg-green-500/10 text-green-500"
                  }`}
                >
                  {rule.is_active ? "Pause" : "Activate"}
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="px-4 py-1.5 bg-red-500/10 text-red-500 rounded-lg text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-[var(--color-text-tertiary)] mb-1">Search Queries</p>
                <div className="flex flex-wrap gap-1">
                  {rule.search_queries?.slice(0, 3).map((q, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-[var(--color-bg-tertiary)] rounded text-[var(--color-text-secondary)] text-xs"
                    >
                      {q}
                    </span>
                  ))}
                  {rule.search_queries?.length > 3 && (
                    <span className="text-[var(--color-text-tertiary)] text-xs">
                      +{rule.search_queries.length - 3} more
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] mb-1">Target Niches</p>
                <div className="flex flex-wrap gap-1">
                  {rule.target_niches?.map((n) => (
                    <span
                      key={n}
                      className="px-2 py-0.5 bg-[var(--color-accent)]/10 text-[var(--color-accent)] rounded text-xs"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] mb-1">Follower Range</p>
                <p className="text-[var(--color-text-primary)]">
                  {rule.min_followers.toLocaleString()} – {rule.max_followers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        ))}

        {rules.length === 0 && !showCreate && (
          <div className="text-center py-12 bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border)]">
            <p className="text-4xl mb-3">🔍</p>
            <p className="text-[var(--color-text-secondary)]">No discovery rules yet</p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Create a rule to start discovering creators
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
