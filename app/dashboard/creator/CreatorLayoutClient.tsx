"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import UnreadMessagesBadge from "@/components/UnreadMessagesBadge";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  profile_photo_url: string | null;
}

const navItems = [
  { href: "/dashboard/creator", label: "Dashboard" },
  { href: "/dashboard/creator/opportunities", label: "Opportunities" },
  { href: "/dashboard/creator/deals", label: "My Deals" },
  { href: "/messages", label: "Messages", hasBadge: true },
  { href: "/dashboard/creator/insights", label: "Insights" },
  { href: "/dashboard/creator/profile", label: "My Profile" },
  { href: "/dashboard/creator/analytics", label: "Analytics" },
  { href: "/dashboard/creator/activity", label: "Activity" },
  { href: "/dashboard/creator/claim-profiles", label: "Claim Profiles" },
];

export default function CreatorLayoutClient({
  creatorProfile,
  children,
}: {
  creatorProfile: CreatorProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Single Header */}
      <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between px-6 sticky top-0 z-40">
        {/* Logo - Left */}
        <Link href="/dashboard/creator" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            RC
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">
            Rising Creators
          </span>
        </Link>

        {/* Nav + Actions - Right */}
        <div className="flex items-center gap-6">
          {/* Horizontal Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/dashboard/creator" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
                  }`}
                >
                  {item.label}
                  {item.hasBadge && <UnreadMessagesBadge />}
                </Link>
              );
            })}
          </nav>

          {/* User Button */}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content - No sidebar, full width */}
      <main className="p-0">{children}</main>
    </div>
  );
}
