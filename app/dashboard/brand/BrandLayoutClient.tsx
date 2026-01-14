"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import UnreadMessagesBadge from "@/components/UnreadMessagesBadge";

interface BrandProfile {
  id: string;
  company_name: string | null;
  logo_url: string | null;
  is_premium?: boolean;
}

const navItems = [
  { href: "/dashboard/brand", label: "Dashboard" },
  { href: "/dashboard/brand/discover", label: "Discover" },
  { href: "/dashboard/brand/watchlist", label: "Watchlist" },
  { href: "/dashboard/brand/campaigns", label: "Campaigns" },
  { href: "/dashboard/brand/deals", label: "Deals" },
  { href: "/messages", label: "Messages", hasBadge: true },
  { href: "/dashboard/brand/settings", label: "Settings" },
];

export default function BrandLayoutClient({
  brandProfile,
  children,
}: {
  brandProfile: BrandProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isPremium = brandProfile.is_premium;

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)]">
      {/* Single Header */}
      <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between px-6 sticky top-0 z-40">
        {/* Logo - Left */}
        <Link href="/dashboard/brand" className="flex items-center gap-2 shrink-0">
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
                (item.href !== "/dashboard/brand" && pathname.startsWith(item.href));

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

          {/* Premium Badge / Upgrade + User */}
          {isPremium ? (
            <span className="px-3 py-1 bg-green-500/10 text-green-600 text-sm font-medium rounded-full">
              Premium
            </span>
          ) : (
            <Link
              href="/dashboard/brand/upgrade"
              className="px-3 py-1 bg-[var(--color-accent)] text-white text-sm font-medium rounded-full hover:bg-[var(--color-accent-hover)]"
            >
              Upgrade
            </Link>
          )}
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main Content - No sidebar, full width */}
      <main className="p-0">{children}</main>
    </div>
  );
}
