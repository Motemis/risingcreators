import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Statuses where brand info is revealed
const REVEALED_STATUSES = ["contacted", "negotiating", "confirmed", "content_submitted", "completed"];

export default async function CreatorDealsPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "creator") {
    redirect("/");
  }

  const { data: creatorProfile } = await supabase
    .from("creator_profiles")
    .select("*")
    .eq("user_id", dbUser.id)
    .single();

  if (!creatorProfile) {
    redirect("/onboarding/creator");
  }

  // Get all deals for this creator from campaign_creators
  const { data: deals } = await supabase
    .from("campaign_creators")
    .select(`
      *,
      campaign:campaigns(
        id,
        name,
        public_title,
        budget_per_creator,
        deliverables,
        start_date,
        end_date,
        target_niches,
        preferred_platforms,
        brand_profile:brand_profiles(
          company_name,
          logo_url,
          industry
        )
      )
    `)
    .eq("creator_profile_id", creatorProfile.id)
    .order("added_at", { ascending: false });

  // Also get from campaign_interest for pending ones not yet in campaign_creators
  const { data: interests } = await supabase
    .from("campaign_interest")
    .select(`
      *,
      campaign:campaigns(
        id,
        name,
        public_title,
        budget_per_creator,
        deliverables,
        target_niches,
        preferred_platforms,
        brand_profile:brand_profiles(
          company_name,
          logo_url,
          industry
        )
      )
    `)
    .eq("creator_profile_id", creatorProfile.id)
    .eq("status", "interested")
    .order("created_at", { ascending: false });

  // Helper to determine if brand should be revealed
  const shouldRevealBrand = (status: string) => {
    return REVEALED_STATUSES.includes(status);
  };

  // Helper to get display name for brand
  const getBrandDisplayName = (deal: any, status: string) => {
    if (shouldRevealBrand(status)) {
      return deal.campaign?.brand_profile?.company_name || "Brand Partner";
    }
    const industry = deal.campaign?.brand_profile?.industry?.[0];
    return industry ? `${industry} Brand` : "Brand Partner";
  };

  // Helper to get display name for campaign
  const getCampaignDisplayName = (deal: any, status: string) => {
    if (shouldRevealBrand(status)) {
      return deal.campaign?.name || "Campaign";
    }
    return deal.campaign?.public_title || getCampaignPlaceholder(deal.campaign);
  };

  // Generate a placeholder based on campaign attributes
  const getCampaignPlaceholder = (campaign: any) => {
    if (!campaign) return "Campaign Opportunity";
    
    const niches = campaign.target_niches?.slice(0, 2).join(" & ") || "";
    const platforms = campaign.preferred_platforms?.[0] || "";
    
    if (niches && platforms) {
      return `${niches} ${platforms.charAt(0).toUpperCase() + platforms.slice(1)} Campaign`;
    } else if (niches) {
      return `${niches} Campaign`;
    } else if (platforms) {
      return `${platforms.charAt(0).toUpperCase() + platforms.slice(1)} Campaign`;
    }
    return "Campaign Opportunity";
  };

  // Filter deals by status
  const allDeals = deals || [];
  const pendingDeals = allDeals.filter((d) => d.status === "interested");
  const activeDeals = allDeals.filter((d) => 
    ["contacted", "negotiating", "confirmed", "content_submitted"].includes(d.status)
  );
  const completedDeals = allDeals.filter((d) => d.status === "completed");
  const declinedDeals = allDeals.filter((d) => d.status === "declined");

  // Also check interests table for any that aren't in campaign_creators yet
  const pendingInterests = interests?.filter(interest => {
    return !allDeals.some(deal => deal.campaign_id === interest.campaign_id);
  }) || [];

  // Combine pending from both sources
  const allPending = [
    ...pendingDeals.map(d => ({ ...d, source: 'deal' })),
    ...pendingInterests.map(i => ({ ...i, source: 'interest', status: 'interested' }))
  ];

  // Calculate stats
  const totalEarnings = completedDeals.reduce((sum, d) => sum + (d.agreed_rate || 0), 0);
  const pendingEarnings = activeDeals
    .filter((d) => d.status === "confirmed")
    .reduce((sum, d) => sum + (d.agreed_rate || 0), 0);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string; icon: string }> = {
      interested: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Pending Review", icon: "⏳" },
      contacted: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Brand Contacted You", icon: "📧" },
      negotiating: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Negotiating", icon: "💬" },
      confirmed: { bg: "bg-green-500/10", text: "text-green-500", label: "Confirmed", icon: "✅" },
      content_submitted: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Content Submitted", icon: "📤" },
      completed: { bg: "bg-green-500/10", text: "text-green-600", label: "Completed", icon: "🎉" },
      declined: { bg: "bg-red-500/10", text: "text-red-500", label: "Not Selected", icon: "—" },
    };
    const c = config[status] || { bg: "bg-gray-500/10", text: "text-gray-500", label: status, icon: "•" };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        <span>{c.icon}</span>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            My Deals
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Track your brand partnerships and earnings
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Pending</p>
            <p className="text-2xl font-bold text-purple-500">{allPending.length}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Active Deals</p>
            <p className="text-2xl font-bold text-[var(--color-accent)]">{activeDeals.length}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Completed</p>
            <p className="text-2xl font-bold text-green-500">{completedDeals.length}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Total Earned</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              ${totalEarnings.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pending Review */}
        {allPending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              ⏳ Pending Brand Review
              <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                ({allPending.length})
              </span>
            </h2>
            <div className="space-y-3">
              {allPending.map((item, index) => (
                <div
                  key={item.id || index}
                  className="bg-[var(--color-bg-secondary)] border border-purple-500/20 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {/* Brand Avatar Placeholder */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl">
                        🏢
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[var(--color-text-primary)]">
                            {getBrandDisplayName(item, 'interested')}
                          </h3>
                          {getStatusBadge('interested')}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                          {getCampaignDisplayName(item, 'interested')}
                        </p>
                        <div className="flex flex-wrap gap-2 text-xs text-[var(--color-text-tertiary)]">
                          {item.campaign?.target_niches?.slice(0, 2).map((niche: string) => (
                            <span key={niche} className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded">
                              {niche}
                            </span>
                          ))}
                          {item.campaign?.preferred_platforms?.slice(0, 2).map((platform: string) => (
                            <span key={platform} className="px-2 py-1 bg-[var(--color-bg-tertiary)] rounded capitalize">
                              {platform}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {item.campaign?.budget_per_creator && (
                        <>
                          <p className="text-lg font-bold text-[var(--color-text-primary)]">
                            ~${item.campaign.budget_per_creator.toLocaleString()}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">Est. budget</p>
                        </>
                      )}
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                        Applied {new Date(item.added_at || item.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      💡 Brand details will be revealed once they respond to your interest
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Active Deals */}
        {activeDeals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              🔥 Active Deals
              <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                ({activeDeals.length})
              </span>
            </h2>
            <div className="space-y-4">
              {activeDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      {/* Brand Logo or Placeholder */}
                      {deal.campaign?.brand_profile?.logo_url ? (
                        <img 
                          src={deal.campaign.brand_profile.logo_url} 
                          alt={deal.campaign.brand_profile.company_name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-accent)]/20 to-blue-500/20 flex items-center justify-center text-xl">
                          🏢
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[var(--color-text-primary)]">
                            {getBrandDisplayName(deal, deal.status)}
                          </h3>
                          {getStatusBadge(deal.status)}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {getCampaignDisplayName(deal, deal.status)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {deal.agreed_rate ? (
                        <>
                          <p className="text-xl font-bold text-green-500">
                            ${deal.agreed_rate.toLocaleString()}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">Agreed</p>
                        </>
                      ) : deal.campaign?.budget_per_creator ? (
                        <>
                          <p className="text-xl font-bold text-[var(--color-text-tertiary)]">
                            ~${deal.campaign.budget_per_creator.toLocaleString()}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)]">Est. budget</p>
                        </>
                      ) : null}
                    </div>
                  </div>

                  {/* Deal Details */}
                  {(deal.deliverables_agreed || deal.campaign?.deliverables) && (
                    <div className="mb-4 p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        <span className="font-medium">Deliverables:</span>{" "}
                        {deal.deliverables_agreed || deal.campaign?.deliverables}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                    <div className="flex items-center gap-4">
                      {deal.campaign?.start_date && (
                        <span>
                          📅 {new Date(deal.campaign.start_date).toLocaleDateString()} - {" "}
                          {deal.campaign.end_date
                            ? new Date(deal.campaign.end_date).toLocaleDateString()
                            : "Ongoing"}
                        </span>
                      )}
                      {deal.payment_status && (
                        <span className={`capitalize ${deal.payment_status === "paid" ? "text-green-500" : ""}`}>
                          💰 {deal.payment_status}
                        </span>
                      )}
                    </div>
                    {deal.contacted_at && (
                      <span>Contacted {new Date(deal.contacted_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Deals */}
        {completedDeals.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
              ✅ Completed
              <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                ({completedDeals.length})
              </span>
            </h2>
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-[var(--color-bg-tertiary)]">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">Brand</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">Campaign</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">Earned</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-[var(--color-text-tertiary)]">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {completedDeals.map((deal) => (
                    <tr key={deal.id}>
                      <td className="px-4 py-3 font-medium text-[var(--color-text-primary)]">
                        {getBrandDisplayName(deal, deal.status)}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-secondary)]">
                        {getCampaignDisplayName(deal, deal.status)}
                      </td>
                      <td className="px-4 py-3 text-green-500 font-medium">
                        ${(deal.agreed_rate || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-[var(--color-text-tertiary)]">
                        {deal.completed_at ? new Date(deal.completed_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Declined */}
        {declinedDeals.length > 0 && (
          <div className="mb-8">
            <details className="group">
              <summary className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2 cursor-pointer list-none">
                <span className="group-open:rotate-90 transition-transform">▶</span>
                Not Selected
                <span className="text-sm font-normal text-[var(--color-text-tertiary)]">
                  ({declinedDeals.length})
                </span>
              </summary>
              <div className="space-y-2 mt-4">
                {declinedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 opacity-60"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          {getCampaignDisplayName(deal, 'declined')}
                        </p>
                        <p className="text-sm text-[var(--color-text-tertiary)]">
                          {deal.declined_message || "Brand selected other creators for this campaign"}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {new Date(deal.added_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {/* Empty State */}
        {allDeals.length === 0 && allPending.length === 0 && (
          <div className="text-center py-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
            <div className="text-5xl mb-4">🤝</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No deals yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6 max-w-md mx-auto">
              Express interest in campaigns to start connecting with brands. 
              Once a brand responds, you'll see the deal details here.
            </p>
            <Link
              href="/dashboard/creator/opportunities"
              className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
            >
              Browse Opportunities
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}