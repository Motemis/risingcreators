import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import DealsFilters from "./DealsFilters";

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default async function BrandDealsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; campaign?: string }>;
}) {
  const params = await searchParams;
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

  // Get all campaigns for filter dropdown
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name")
    .eq("brand_profile_id", brandProfile.id)
    .order("created_at", { ascending: false });

  // Build query for deals
  let query = supabase
    .from("campaign_creators")
    .select(`
      *,
      campaign:campaigns!inner(
        id,
        name,
        brand_profile_id,
        budget_per_creator,
        deliverables
      ),
      creator_profile:creator_profiles(
        id,
        display_name,
        profile_photo_url,
        youtube_profile_image_url,
        youtube_subscribers,
        tiktok_followers,
        instagram_followers,
        contact_email,
        niche
      ),
      discovered_creator:discovered_creators(
        id,
        display_name,
        profile_image_url,
        followers
      )
    `)
    .eq("campaign.brand_profile_id", brandProfile.id)
    .order("added_at", { ascending: false });

  // Apply filters
  const statusFilter = params.status || "all";
  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  if (params.campaign) {
    query = query.eq("campaign_id", params.campaign);
  }

  const { data: deals } = await query;

  // Calculate stats
  const stats = {
    total: deals?.length || 0,
    interested: deals?.filter((d) => d.status === "interested").length || 0,
    contacted: deals?.filter((d) => d.status === "contacted").length || 0,
    negotiating: deals?.filter((d) => d.status === "negotiating").length || 0,
    confirmed: deals?.filter((d) => d.status === "confirmed").length || 0,
    completed: deals?.filter((d) => d.status === "completed").length || 0,
    totalValue: deals?.reduce((sum, d) => sum + (d.agreed_rate || d.campaign?.budget_per_creator || 0), 0) || 0,
    confirmedValue: deals?.filter((d) => ["confirmed", "content_submitted", "completed"].includes(d.status)).reduce((sum, d) => sum + (d.agreed_rate || 0), 0) || 0,
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { bg: string; text: string; label: string }> = {
      interested: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Interested" },
      lead: { bg: "bg-gray-500/10", text: "text-gray-500", label: "Lead" },
      contacted: { bg: "bg-blue-500/10", text: "text-blue-500", label: "Contacted" },
      negotiating: { bg: "bg-yellow-500/10", text: "text-yellow-500", label: "Negotiating" },
      confirmed: { bg: "bg-green-500/10", text: "text-green-500", label: "Confirmed" },
      content_submitted: { bg: "bg-purple-500/10", text: "text-purple-500", label: "Content Submitted" },
      completed: { bg: "bg-green-500/10", text: "text-green-600", label: "Completed" },
      declined: { bg: "bg-red-500/10", text: "text-red-500", label: "Declined" },
    };
    const c = config[status] || config.lead;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Deal Tracker
          </h1>
          <p className="text-[var(--color-text-secondary)]">
            Track and manage your creator partnerships from interest to completion
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Total</p>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{stats.total}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-purple-500/30 rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Interested</p>
            <p className="text-2xl font-bold text-purple-500">{stats.interested}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">In Progress</p>
            <p className="text-2xl font-bold text-blue-500">
              {stats.contacted + stats.negotiating}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Confirmed</p>
            <p className="text-2xl font-bold text-green-500">{stats.confirmed}</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-sm text-[var(--color-text-tertiary)]">Confirmed Value</p>
            <p className="text-2xl font-bold text-[var(--color-accent)]">
              ${stats.confirmedValue.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Pipeline View */}
        <div className="grid grid-cols-6 gap-3 mb-8">
          {[
            { value: "interested", label: "Interested", icon: "🙋" },
            { value: "contacted", label: "Contacted", icon: "📧" },
            { value: "negotiating", label: "Negotiating", icon: "💬" },
            { value: "confirmed", label: "Confirmed", icon: "✅" },
            { value: "content_submitted", label: "Content", icon: "📤" },
            { value: "completed", label: "Done", icon: "🎉" },
          ].map((status) => {
            const count = deals?.filter((d) => d.status === status.value).length || 0;
            const isActive = statusFilter === status.value;
            return (
              <Link
                key={status.value}
                href={`/dashboard/brand/deals?status=${status.value}${params.campaaign=${params.campaign}` : ""}`}
                className={`p-3 rounded-xl text-center transition-colors ${
                  isActive
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
              >
                <p className="text-lg mb-1">{status.icon}</p>
                <p className={`text-xl font-bold ${isActive ? "text-white" : "text-[var(--color-text-primary)]"}`}>
                  {count}
                </p>
                <p className={`text-xs ${isActive ? "text-white/80" : "text-[var(--color-text-tertiary)]"}`}>
                  {status.label}
                </p>
              </Link>
            );
          })}
        </div>

        {/* Filters */}
        <DealsFilters campaigns={campaigns || []} />

        {/* Deals List */}
        {deals && deals.length > 0 ? (
          <div className="space-y-4">
            {deals.map((deal) => {
              const creatorName = deal.creator_profile?.display_name || deal.discovered_creator?.display_name || "Unknown";
              const creatorImage = deal.creator_profile?.profile_photo_url || deal.creator_profile?.youtube_profile_image_url || deal.discovered_creator?.profile_image_url;
              const followers = deal.creator_profile
                ? (deal.creator_profile.youtube_subscribers || 0) +
                  (deal.creator_profile.tiktok_followers || 0) +
                  (deal.creator_profile.instagram_followers || 0)
                : deal.discovered_creator?.followers || 0;

              return (
                <div
                  key={deal.id}
                  className={`bg-[var(--color-bg-secondary)] border rounded-xl p-6 ${
                    deal.status === "interested" 
                      ? "border-purple-500/30 bg-purple-500/5" 
                      : "border-[var(--color-border)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      {creatorImage ? (
                        <img
                          src={creatorImage}
                          alt={creatorName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-xl">
                          👤
                        </div>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-[var(--color-text-primary)]">
                            {creatorName}
                          </h3>
                          {getStatusBadge(deal.status)}
                          {deal.status === "interested" && (
                            <span cssName="text-xs text-purple-500 font-medium">
                              🔔 Wants to work with you!
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          {formatNumber(followers)} followers • {deal.campaign?.name}
                        </p>
                        {deal.creator_profile?.niche && deal.creator_profile.niche.length > 0 && (
                          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                            {deal.creator_profile.niche.slice(0, 3).join(", ")}
                          </p>
                        )}
                        {deal.creator_profile?.contact_email && (
                          <p className="text-sm text-[var(--color-text-tertiary)]">
                            {deal.creator_profile.contact_email}
                          </p>
                        )}
                      v>
                    </div>

                    <div className="text-right">
                      {deal.agreed_rate ? (
                        <p className="text-lg font-bold text-green-500">
                          ${deal.agreed_rate.toLocaleString()}
                        </p>
                      ) : deal.campaign?.budget_per_creator ? (
                        <p className="text-lg font-bold text-[var(--color-text-tertiary)]">
                          ~${deal.campaign.budget_per_creator.toLocaleString()}
                        </p>
                      ) : null}
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {deal.agreed_rate ? "Agreed rate" : "Est. budget"}
                      </p>
                    </div>
                  </div>

                  {(deal.deliverables_agreed || deal.notes) && (
                    <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                      {deal.deliverables_agreed && (
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          <strong>Deliverables:</strong> {deal.deliverables_agreed}
                        </p>
                      )}
                      {deal.notes && (
                        <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                          <strong>Notes:</strong> {deal.notes}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex items-center gap-6 text-xs text-[var(--color-text-tertiary)]">
                    <span>Added {new Date(deal.added_at).toLocaleDateString()}</span>
                    {deal.contacted_at && (
                      <span>Contacted {new Date(deal.contacted_at).toLocaleDateString()}</span>
                    )}
                    {deal.content_submitted_at && (
                      <span>Content {new Date(deal.content_submitted_at).toLocaleDateString()}</span>
                    )}
                    {deal.completed_at && (
                      <span>Completed {new Date(deal.completed_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-2">
                    <Link
                      href={`/dashboard/brand/deals/${deal.id}`}
                      className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent-hover)]"
                    >
                      {deal.status === "interested" ? "Review & Respond" : "Manage Deal"}
                    </Link>
                    {deal.creator_profile?.contact_email && (
                      
                        href={`mailto:${deal.creator_profile.contact_email}`}
                        className="px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg text-sm font-medium hover:bg-[var(--color-bg-tertiary)]"
                      >
                        Email Creator
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">
              No deals yet
            </h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Creators who express interest in your campaigns will appear here
            </p>
            <Link
              href="/dashboard/brand/campaigns"
              className="inline-block bg-[var(--color-accent)] text-white px-6 py-3 rounded-lg font-medium hover:bg-[var(--color-accent-hover)]"
            >
              View Campaigns
            Link>
          </div>
        )}
      </div>
    </div>
  );
}
