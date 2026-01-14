import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default async function CampaignsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    redirect("/");
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    redirect("/onboarding/brand");
  }

  // Get campaigns with creator counts
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select(`
      *,
      campaign_creators(count)
    `)
    .eq("brand_profile_id", brandProfile.id)
    .order("created_at", { ascending: false });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-500";
      case "draft":
        return "bg-gray-500/10 text-gray-400";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500";
      case "completed":
        return "bg-blue-500/10 text-blue-500";
      default:
        return "bg-gray-500/10 text-gray-400";
    }
  };

  const formatBudget = (amount: number | null) => {
    if (!amount) return "No budget set";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              Campaigns
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              Create campaigns to find and organize creators for your projects
            </p>
          </div>
          <Link
            href="/dashboard/brand/campaigns/new"
            className="bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            + New Campaign
          </Link>
        </div>

        {/* Campaign List */}
        {campaigns && campaigns.length > 0 ? (
          <div className="space-y-4">
            {campaigns.map((campaign: any) => (
              <Link
                key={campaign.id}
                href={`/dashboard/brand/campaigns/${campaign.id}`}
                className="block bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6 hover:border-[var(--color-accent)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                        {campaign.name}
                      </h2>
                      <span
                        className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${getStatusColor(
                          campaign.status
                        )}`}
                      >
                        {campaign.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-secondary)]">
                      {campaign.target_niches && campaign.target_niches.length > 0 && (
                        <span>
                          {campaign.target_niches.slice(0, 3).join(", ")}
                        </span>
                      )}
                      {(campaign.min_followers || campaign.max_followers) && (
                        <span>
                          {campaign.min_followers?.toLocaleString() || "0"} -{" "}
                          {campaign.max_followers?.toLocaleString() || "∞"} followers
                        </span>
                      )}
                      {campaign.budget_total && (
                        <span>{formatBudget(campaign.budget_total)} budget</span>
                      )}
                    </div>

                    {campaign.brief && (
                      <p className="mt-2 text-sm text-[var(--color-text-tertiary)] line-clamp-2">
                        {campaign.brief}
                      </p>
                    )}
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-2xl font-bold text-[var(--color-text-primary)]">
                      {campaign.campaign_creators?.[0]?.count || 0}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      creators
                    </p>
                  </div>
                </div>

                {/* Progress indicators */}
                {campaign.start_date && campaign.end_date && (
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                      <span>
                        {new Date(campaign.start_date).toLocaleDateString()} -{" "}
                        {new Date(campaign.end_date).toLocaleDateString()}
                      </span>
                      {campaign.deliverables && (
                        <span className="truncate max-w-xs">{campaign.deliverables}</span>
                      )}
                    </div>
                  </div>
                )}
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No campaigns yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Create your first campaign to start finding creators
            </p>
            <Link
              href="/dashboard/brand/campaigns/new"
              className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Create Your First Campaign
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

