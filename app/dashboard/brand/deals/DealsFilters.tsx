"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function DealsFilters({ campaigns }: { campaigns: { id: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";
  const campaignFilter = searchParams.get("campaign") || "";

  const handleCampaignChange = (campaignId: string) => {
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (campaignId) params.set("campaign", campaignId);
    router.push(`/dashboard/brand/deals?${params.toString()}`);
  };

  return (
    <div className="flex gap-4 mb-6">
      <select
        value={campaignFilter}
        onChange={(e) => handleCampaignChange(e.target.value)}
        className="px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
      >
        <option value="">All Campaigns</option>
        {campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      {(statusFilter !== "all" || campaignFilter) && (
        <Link
          href="/dashboard/brand/deals"
          className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}
