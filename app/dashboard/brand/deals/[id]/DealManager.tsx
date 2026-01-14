"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface Deal {
  id: string;
  campaign_id: string;
  status: string;
  agreed_rate: number | null;
  deliverables_agreed: string | null;
  contract_url: string | null;
  payment_status: string | null;
  notes: string | null;
  added_at: string;
  contacted_at: string | null;
  content_submitted_at: string | null;
  content_approved_at: string | null;
  completed_at: string | null;
  declined_reason: string | null;
  declined_message: string | null;
  campaign: {
    id: string;
    name: string;
    brand_profile_id: string;
    budget_per_creator: number | null;
    deliverables: string | null;
    brief: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  creator_profile: {
    id: string;
    display_name: string | null;
    bio: string | null;
    profile_photo_url: string | null;
    youtube_profile_image_url: string | null;
    youtube_subscribers: number | null;
    youtube_url: string | null;
    tiktok_followers: number | null;
    tiktok_handle: string | null;
    instagram_followers: number | null;
    instagram_handle: string | null;
    contact_email: string | null;
    rate_youtube_integration: number | null;
    rate_youtube_dedicated: number | null;
    rate_tiktok_post: number | null;
    rate_instagram_post: number | null;
    media_kit_url: string | null;
  } | null;
  discovered_creator: {
    id: string;
    channel_title: string | null;
    description: string | null;
    profile_image_url: string | null;
    subscriber_count: number | null;
    channel_url: string | null;
  } | null;
}

const STATUSES = [
  { value: "interested", label: "Interested", icon: "🙋", color: "purple" },
  { value: "contacted", label: "Contacted", icon: "📧", color: "blue" },
  { value: "negotiating", label: "Negotiating", icon: "💬", color: "yellow" },
  { value: "confirmed", label: "Confirmed", icon: "✅", color: "green" },
  { value: "content_submitted", label: "Content Submitted", icon: "📤", color: "purple" },
  { value: "completed", label: "Completed", icon: "🎉", color: "green" },
];

const PAYMENT_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "invoiced", label: "Invoiced" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

export default function DealManager({ deal }: { deal: Deal }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  const [form, setForm] = useState({
    status: deal.status,
    agreed_rate: deal.agreed_rate?.toString() || "",
    deliverables_agreed: deal.deliverables_agreed || "",
    contract_url: deal.contract_url || "",
    payment_status: deal.payment_status || "pending",
    notes: deal.notes || "",
    declined_reason: deal.declined_reason || "",
    declined_message: deal.declined_message || "",
  });

  const creatorName = deal.creator_profile?.display_name || deal.discovered_creator?.channel_title || "Unknown";
  const creatorImage = deal.creator_profile?.profile_photo_url || deal.creator_profile?.youtube_profile_image_url || deal.discovered_creator?.profile_image_url;
  const followers = deal.creator_profile
    ? (deal.creator_profile.youtube_subscribers || 0) +
      (deal.creator_profile.tiktok_followers || 0) +
      (deal.creator_profile.instagram_followers || 0)
    : deal.discovered_creator?.subscriber_count || 0;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "declined") {
      setShowDeclineModal(true);
      return;
    }

    setSaving(true);
    setForm({ ...form, status: newStatus });
    
    const updateData: Record<string, any> = { status: newStatus };
    
    if (newStatus === "contacted" && !deal.contacted_at) {
      updateData.contacted_at = new Date().toISOString();
    }
    if (newStatus === "content_submitted" && !deal.content_submitted_at) {
      updateData.content_submitted_at = new Date().toISOString();
    }
    if (newStatus === "completed" && !deal.completed_at) {
      updateData.completed_at = new Date().toISOString();
      updateData.content_approved_at = new Date().toISOString();
    }

    await supabase.from("campaign_creators").update(updateData).eq("id", deal.id);
    setSaving(false);
    router.refresh();
  };

  const handleSave = async () => {
    setSaving(true);

    const updateData: Record<string, any> = {
      status: form.status,
      agreed_rate: form.agreed_rate ? parseFloat(form.agreed_rate) : null,
      deliverables_agreed: form.deliverables_agreed || null,
      contract_url: form.contract_url || null,
      payment_status: form.payment_status,
      notes: form.notes || null,
    };

    const { error } = await supabase
      .from("campaign_creators")
      .update(updateData)
      .eq("id", deal.id);

    if (error) {
      console.error("Error updating deal:", error);
      alert("Error updating deal: " + error.message);
    } else {
      router.refresh();
    }

    setSaving(false);
  };

  const handleDecline = async () => {
    setSaving(true);
    await supabase
      .from("campaign_creators")
      .update({
        status: "declined",
        declined_reason: form.declined_reason || null,
        declined_message: form.declined_message || null,
      })
      .eq("id", deal.id);
    setSaving(false);
    setShowDeclineModal(false);
    router.refresh();
  };

  const currentStatusIndex = STATUSES.findIndex((s) => s.value === form.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-start gap-4">
          {creatorImage ? (
            <img
              src={creatorImage}
              alt={creatorName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center text-2xl">
              👤
            </div>
          )}

          <div className="flex-1">
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              {creatorName}
            </h1>
            <p className="text-[var(--color-text-secondary)]">
              {formatNumber(followers)} followers
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Campaign: {deal.campaign.name}
            </p>
          </div>

          <div className="text-right">
            {form.agreed_rate ? (
              <p className="text-2xl font-bold text-green-500">
                ${parseFloat(form.agreed_rate).toLocaleString()}
              </p>
            ) : deal.campaign.budget_per_creator ? (
              <p className="text-2xl font-bold text-[var(--color-text-tertiary)]">
                ~${deal.campaign.budget_per_creator.toLocaleString()}
              </p>
            ) : null}
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {form.agreed_rate ? "Agreed rate" : "Campaign budget"}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        {deal.creator_profile && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex flex-wrap gap-4">
            {deal.creator_profile.contact_email && (
              <a
                href={`mailto:${deal.creator_profile.contact_email}`}
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                ✉️ {deal.creator_profile.contact_email}
              </a>
            )}
            {deal.creator_profile.youtube_url && (
              <a
                href={deal.creator_profile.youtube_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                🎬 YouTube
              </a>
            )}
            {deal.creator_profile.instagram_handle && (
              <a
                href={`https://instagram.com/${deal.creator_profile.instagram_handle.replace("@", "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                📸 Instagram
              </a>
            )}
            {deal.creator_profile.tiktok_handle && (
              <a
                href={`https://tiktok.com/${deal.creator_profile.tiktok_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                📱 TikTok
              </a>
            )}
            {deal.creator_profile.media_kit_url && (
              <a
                href={deal.creator_profile.media_kit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[var(--color-accent)] hover:underline"
              >
                📋 Media Kit
              </a>
            )}
          </div>
        )}
      </div>

      {/* Status Pipeline */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Deal Status</h2>
        
        {form.status === "declined" ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-sm text-red-500 font-medium">This deal was declined</p>
            {deal.declined_reason && (
              <p className="text-sm text-red-500/80 mt-1">Reason: {deal.declined_reason}</p>
            )}
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 overflow-x-auto pb-2">
              {STATUSES.map((status, i) => {
                const isActive = form.status === status.value;
                const isPast = currentStatusIndex > i;

                return (
                  <button
                    key={status.value}
                    onClick={() => handleStatusChange(status.value)}
                    disabled={saving}
                    className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-colors min-w-[80px] ${
                      isActive
                        ? "bg-[var(--color-accent)] text-white"
                        : isPast
                        ? "bg-green-500/10 text-green-500"
                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-accent-light)]"
                    }`}
                  >
                    <span className="text-xl">{status.icon}</span>
                    <span className="text-xs font-medium whitespace-nowrap">{status.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setShowDeclineModal(true)}
              className="px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
            >
              Decline Creator
            </button>
          </>
        )}
      </div>

      {/* Deal Details */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Deal Details</h2>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Agreed Rate
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
              <input
                type="number"
                value={form.agreed_rate}
                onChange={(e) => setForm({ ...form, agreed_rate: e.target.value })}
                placeholder={deal.campaign.budget_per_creator?.toString() || "0"}
                className="w-full px-4 py-2 pl-7 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Payment Status
            </label>
            <select
              value={form.payment_status}
              onChange={(e) => setForm({ ...form, payment_status: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              {PAYMENT_STATUSES.map((ps) => (
                <option key={ps.value} value={ps.value}>
                  {ps.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Agreed Deliverables
            </label>
            <input
              type="text"
              value={form.deliverables_agreed}
              onChange={(e) => setForm({ ...form, deliverables_agreed: e.target.value })}
              placeholder={deal.campaign.deliverables || "e.g., 1 YouTube video + 2 Instagram posts"}
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Contract/Agreement URL
            </label>
            <input
              type="url"
              value={form.contract_url}
              onChange={(e) => setForm({ ...form, contract_url: e.target.value })}
              placeholder="https://..."
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Internal notes about this deal..."
              rows={3}
              className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            />
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Creator Rates Reference */}
      {deal.creator_profile && (deal.creator_profile.rate_youtube_integration || deal.creator_profile.rate_youtube_dedicated || deal.creator_profile.rate_tiktok_post || deal.creator_profile.rate_instagram_post) && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">
            Creator's Published Rates
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {deal.creator_profile.rate_youtube_integration && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">YT Integration</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${deal.creator_profile.rate_youtube_integration}
                </p>
              </div>
            )}
            {deal.creator_profile.rate_youtube_dedicated && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">YT Dedicated</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${deal.creator_profile.rate_youtube_dedicated}
                </p>
              </div>
            )}
            {deal.creator_profile.rate_tiktok_post && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">TikTok Post</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${deal.creator_profile.rate_tiktok_post}
                </p>
              </div>
            )}
            {deal.creator_profile.rate_instagram_post && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">IG Post</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  ${deal.creator_profile.rate_instagram_post}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <h2 className="font-semibold text-[var(--color-text-primary)] mb-4">Timeline</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-[var(--color-text-secondary)]">
              Added to campaign: {new Date(deal.added_at).toLocaleDateString()}
            </span>
          </div>
          {deal.contacted_at && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                First contacted: {new Date(deal.contacted_at).toLocaleDateString()}
              </span>
            </div>
          )}
          {deal.content_submitted_at && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Content submitted: {new Date(deal.content_submitted_at).toLocaleDateString()}
              </span>
            </div>
          )}
          {deal.completed_at && (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-600" />
              <span className="text-sm text-[var(--color-text-secondary)]">
                Completed: {new Date(deal.completed_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Decline Modal */}
      {showDeclineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
              Decline this creator?
            </h3>
            
            {/* Internal Notes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Internal Notes
                <span className="text-[var(--color-text-tertiary)] font-normal ml-2">(only you see this)</span>
              </label>
              <textarea
                value={form.declined_reason}
                onChange={(e) => setForm({ ...form, declined_reason: e.target.value })}
                placeholder="e.g., Budget too high, not the right fit for this campaign..."
                rows={2}
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                🔒 Private - for your records only
              </p>
            </div>

            {/* Message to Creator */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
                Message to Creator
                <span className="text-[var(--color-text-tertiary)] font-normal ml-2">(optional)</span>
              </label>
              <textarea
                value={form.declined_message}
                onChange={(e) => setForm({ ...form, declined_message: e.target.value })}
                placeholder="e.g., Thanks for your interest! We've decided to go in a different direction for this campaign..."
                rows={3}
                className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                👁 If left blank, creator will see: "Brand selected other creators for this campaign"
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                disabled={saving}
                className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {saving ? "..." : "Decline Creator"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
