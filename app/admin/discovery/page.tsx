import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DiscoveryManager from "./DiscoveryManager";

const ADMIN_EMAILS = ["justin.motes@me.com", "motemis@gmail.com"];

export default async function DiscoveryPage() {
  const user = await currentUser();

  if (!user || !ADMIN_EMAILS.includes(user.emailAddresses[0]?.emailAddress || "")) {
    redirect("/");
  }

  // Get all discovery rules
  const { data: rules } = await supabase
    .from("auto_discovery_rules")
    .select("*")
    .order("created_at", { ascending: false });

  // Get discovery stats
  const { count: totalDiscovered } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true });

  const { count: last24h } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true })
    .gte("discovered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Discovery Rules
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Configure automatic creator discovery from YouTube
            </p>
          </div>
          <Link
            href="/admin"
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{rules?.length || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Discovery Rules</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-500">{totalDiscovered || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Total Discovered</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-green-500">{last24h || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Last 24 Hours</p>
          </div>
        </div>

        <DiscoveryManager rules={rules || []} />
      </div>
    </div>
  );
}
