"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

interface Rule {
  id: string;
  name: string;
  is_active: boolean;
  search_queries: string[];
  platforms: string[];
  min_followers: number;
  max_followers: number;
  min_growth_rate_7d: number | null;
  min_growth_rate_30d: number | null;
  target_niches: string[] | null;
  run_frequency: string;
  last_run_at: string | null;
}

const NICHES = [
  "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
  "Travel", "Gaming", "Finance", "Education", "Entertainment",
  "Music", "Sports", "Parenting", "Pets"
];

export default function AutoDiscoveryRules({ initialRules }: { initialRules: Rule[] }) {
  const router = useRouter();
  const [rules, setRules] = useState<Rule[]>(initialRules);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    search_queries: "",
    min_followers: "10000",
    max_followers: "100000",
    min_growth_rate_7d: "",
    min_growth_rate_30d: "",
    target_niches: [] as string[],
    run_frequency: "daily",
  });

  const handleSave = async () => {
    if (!form.name || !form.search_queries) {
      setMessage("Name and search queries are required");
      return;
    }

    setSaving(true);
    setMessage("");

    const { data, error } = await supabase.from("auto_discovery_rules").insert({
      name: form.name,
      search_queries: form.search_queries.split(",").map((q) => q.trim()).filter(Boolean),
      platforms: ["youtube"],
      min_followers: parseInt(form.min_followers),
      max_followers: parseInt(form.max_followers),
      min_growth_rate_7d: form.min_growth_rate_7d ? parseFloat(form.min_growth_rate_7d) : null,
      min_growth_rate_30d: form.min_growth_rate_30d ? parseFloat(form.min_growth_rate_30d) : null,
      target_niches: form.target_niches.length > 0 ? form.target_niches : null,
      run_frequency: form.run_frequency,
    }).select().single();

    setSaving(false);

    if (error) {
      setMessage("Error: " + error.message);
    } else {
      setMessage("✓ Rule created!");
      setRules([data, ...rules]);
      setShowForm(false);
      setForm({
        name: "",
        search_queries: "",
        min_followers: "10000",
        max_followers: "100000",
        min_growth_rate_7d: "",
        min_growth_rate_30d: "",
        target_niches: [],
        run_frequency: "daily",
      });
    }
  };

  const toggleActive = async (ruleId: string, currentState: boolean) => {
    await supabase
      .from("auto_discovery_rules")
      .update({ is_active: !currentState })
      .eq("id", ruleId);

    setRules(rules.map((r) => 
      r.id === ruleId ? { ...r, is_active: !currentState } : r
    ));
  };

  const deleteRule = async (ruleId: string) => {
    if (!confirm("Delete this rule?")) return;

    await supabase.from("auto_discovery_rules").delete().eq("id", ruleId);
    setRules(rules.filter((r) => r.id !== ruleId));
  };

  const runRule = async (rule: Rule) => {
    setRunning(rule.id);
    setMessage("");

    try {
      const response = await fetch("/api/admin/auto-discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ruleId: rule.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✓ Found ${data.found} creators, imported ${data.imported} new ones`);
        router.refresh();
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (err) {
      setMessage("Run failed");
    }

    setRunning(null);
  };

  const toggleNiche = (niche: string) => {
    setForm((prev) => ({
      ...prev,
      target_niches: prev.target_niches.includes(niche)
        ? prev.target_niches.filter((n) => n !== niche)
        : [...prev.target_niches, niche],
    }));
  };

  return (
    <div className="space-y-6">
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

      {/* Create New Rule */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 border-2 border-dashed border-[var(--color-border-strong)] rounded-xl text-[var(--color-text-secondary)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
        >
          + Create Auto-Discovery Rule
        </button>
      ) : (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
            New Auto-Discovery Rule
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                Rule Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Rising Fitness Creators"
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                Search Queries (comma-separated)
              </label>
              <input
                type="text"
                value={form.search_queries}
                onChange={(e) => setForm({ ...form, search_queries: e.target.value })}
                placeholder="e.g., fitness tips, workout routine, gym motivation"
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Min Followers
                </label>
                <select
                  value={form.min_followers}
                  onChange={(e) => setForm({ ...form, min_followers: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  <option value="1000">1K</option>
                  <option value="5000">5K</option>
                  <option value="10000">10K</option>
                  <option value="20000">20K</option>
                  <option value="50000">50K</option>
                  <option value="100000">100K</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Max Followers
                </label>
                <select
                  value={form.max_followers}
                  onChange={(e) => setForm({ ...form, max_followers: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                >
                  <option value="10000">10K</option>
                  <option value="50000">50K</option>
                  <option value="100000">100K</option>
                  <option value="250000">250K</option>
                  <option value="500000">500K</option>
                  <option value="1000000">1M</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Min 7-Day Growth (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.min_growth_rate_7d}
                  onChange={(e) => setForm({ ...form, min_growth_rate_7d: e.target.value })}
                  placeholder="e.g., 2.0"
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                />
              </div>
              <div>
                <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                  Min 30-Day Growth (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={form.min_growth_rate_30d}
                  onChange={(e) => setForm({ ...form, min_growth_rate_30d: e.target.value })}
                  placeholder="e.g., 10.0"
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-2">
                Target Niches (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      form.target_niches.includes(niche)
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-[var(--color-text-secondary)] mb-1">
                Run Frequency
              </label>
              <select
                value={form.run_frequency}
                onChange={(e) => setForm({ ...form, run_frequency: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="manual">Manual Only</option>
              </select>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
              >
                {saving ? "Saving..." : "Create Rule"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-[var(--color-text-secondary)] px-4 py-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Existing Rules */}
      {rules.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Active Rules
          </h2>

          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-[var(--color-text-primary)]">
                      {rule.name}
                    </h3>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        rule.is_active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-gray-500/10 text-gray-500"
                      }`}
                    >
                      {rule.is_active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-sm text-[var(--color-text-secondary)]">
                    <p>
                      <span className="text-[var(--color-text-tertiary)]">Queries:</span>{" "}
                      {rule.search_queries?.join(", ")}
                    </p>
                    <p>
                      <span className="text-[var(--color-text-tertiary)]">Range:</span>{" "}
                      {(rule.min_followers / 1000).toFixed(0)}K -{" "}
                      {(rule.max_followers / 1000).toFixed(0)}K followers
                    </p>
                    {(rule.min_growth_rate_7d || rule.min_growth_rate_30d) && (
                      <p>
                        <span className="text-[var(--color-text-tertiary)]">Growth:</span>{" "}
                        {rule.min_growth_rate_7d && `${rule.min_growth_rate_7d}% weekly`}
                        {rule.min_growth_rate_7d && rule.min_growth_rate_30d && " / "}
                        {rule.min_growth_rate_30d && `${rule.min_growth_rate_30d}% monthly`}
                      </p>
                    )}
                    <p>
                      <span className="text-[var(--color-text-tertiary)]">Frequency:</span>{" "}
                      {rule.run_frequency}
                      {rule.last_run_at && (
                        <span className="text-[var(--color-text-tertiary)]">
                          {" "}• Last run: {new Date(rule.last_run_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => runRule(rule)}
                    disabled={running === rule.id}
                    className="text-sm bg-[var(--color-accent)] text-white px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
                  >
                    {running === rule.id ? "Running..." : "Run Now"}
                  </button>
                  <button
                    onClick={() => toggleActive(rule.id, rule.is_active)}
                    className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2 py-1.5"
                  >
                    {rule.is_active ? "Pause" : "Resume"}
                  </button>
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="text-sm text-red-500 hover:text-red-400 px-2 py-1.5"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}