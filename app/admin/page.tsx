import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["justin.motes@me.com", "motemis@gmail.com"];

export default async function AdminDashboard() {
  const user = await currentUser();

  if (!user || !ADMIN_EMAILS.includes(user.emailAddresses[0]?.emailAddress || "")) {
    redirect("/");
  }

  // Get stats
  const [
    { count: totalDiscovered },
    { count: totalCreatorProfiles },
    { count: totalBrands },
    { count: totalMessages },
    { data: recentDiscovered },
    { data: discoveryRules },
  ] = await Promise.all([
    supabase.from("discovered_creators").select("*", { count: "exact", head: true }),
    supabase.from("creator_profiles").select("*", { count: "exact", head: true }),
    supabase.from("brand_profiles").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase
      .from("discovered_creators")
      .select("*")
      .order("discovered_at", { ascending: false })
      .limit(5),
    supabase.from("auto_discovery_rules").select("*").order("created_at", { ascending: false }),
  ]);

  // Get discovery stats by platform
  const { data: allDiscovered } = await supabase
    .from("discovered_creators")
    .select("platform");
  
  const platformStats: Record<string, number> = {};
  allDiscovered?.forEach((d) => {
    platformStats[d.platform] = (platformStats[d.platform] || 0) + 1;
  });

  // Get recent activity
  const { count: last24hDiscovered } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true })
    .gte("discovered_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  const { count: last7dDiscovered } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true })
    .gte("discovered_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Admin Dashboard</h1>
            <p className="text-[var(--color-text-secondary)]">
              Manage Rising Creators platform
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/discovery"
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
            >
              Discovery Rules
            </Link>
            <Link
              href="/admin/creators"
              className="px-4 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-tertiary)]"
            >
              Manage Creators
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-3xl font-bold text-[var(--color-text-primary)]">{totalDiscovered || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Discovered Creators</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-3xl font-bold text-blue-500">{totalCreatorProfiles || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Registered Creators</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-3xl font-bold text-purple-500">{totalBrands || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Registered Brands</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <p className="text-3xl font-bold text-green-500">{totalMessages || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Messages Sent</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Discovery Activity */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Discovery Activity</h2>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-500">{last24hDiscovered || 0}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Last 24 hours</p>
              </div>
              <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-500">{last7dDiscovered || 0}</p>
                <p className="text-xs text-[var(--color-text-tertiary)]">Last 7 days</p>
              </div>
            </div>

            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-2">By Platform</h3>
            <div className="space-y-2">
              {Object.entries(platformStats || {}).map(([platform, count]) => (
                <div key={platform} className="flex justify-between items-center">
                  <span className="text-[var(--color-text-primary)] capitalize">{platform}</span>
                  <span className="text-[var(--color-text-secondary)]">{count}</span>
                </div>
              ))}
              {Object.keys(platformStats || {}).length === 0 && (
                <p className="text-[var(--color-text-tertiary)] text-sm">No creators discovered yet</p>
              )}
            </div>
          </div>

          {/* Discovery Rules */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--color-text-primary)]">Discovery Rules</h2>
              <Link
                href="/admin/discovery"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                Manage →
              </Link>
            </div>

            {discoveryRules && discoveryRules.length > 0 ? (
              <div className="space-y-3">
                {discoveryRules.slice(0, 5).map((rule: any) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between py-2 border-b border-[var(--color-border)] last:border-0"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-text-primary)]">{rule.name}</p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {rule.search_queries?.length || 0} queries • {rule.target_niches?.join(", ")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          rule.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-yellow-500/10 text-yellow-500"
                        }`}
                      >
                        {rule.is_active ? "Active" : "Paused"}
                      </span>
                      {rule.last_run_at && (
                        <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                          Last: {new Date(rule.last_run_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-[var(--color-text-tertiary)] mb-2">No discovery rules set up</p>
                <Link
                  href="/admin/discovery"
                  className="text-sm text-[var(--color-accent)] hover:underline"
                >
                  Create your first rule →
                </Link>
              </div>
            )}
          </div>

          {/* Recent Discoveries */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--color-text-primary)]">Recent Discoveries</h2>
              <Link
                href="/admin/creators"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                View All →
              </Link>
            </div>

            {recentDiscovered && recentDiscovered.length > 0 ? (
              <div className="space-y-3">
                {recentDiscovered.map((creator: any) => (
                  <div key={creator.id} className="flex items-center gap-3">
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
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[var(--color-text-primary)] truncate">
                        {creator.display_name}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {creator.followers?.toLocaleString()} followers • {creator.platform}
                      </p>
                    </div>
                    <a
                      href={`https://youtube.com/channel/${creator.platform_user_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-accent)]"
                    >
                      View ↗
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--color-text-tertiary)] py-8">
                No creators discovered yet
              </p>
            )}
          </div>

          {/* System Status */}
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
            <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">System Status</h2>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">sync-creator-analytics</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                  Every 6 hours
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">sync-youtube-analytics</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                  4x daily
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text-secondary)]">update-niche-benchmarks</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                  Daily
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[var(--color-text-secondary)]">auto-discover-creators</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500">
                  Not scheduled
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
              <Link
                href="/admin/discovery"
                className="block w-full py-2 text-center bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
              >
                Set Up Auto-Discovery
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
