"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import ThemeToggle from "@/components/ThemeToggle";
import UnreadMessagesBadge from "@/components/UnreadMessagesBadge";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  profile_photo_url: string | null;
}

const navItems = [
  { href: "/dashboard/creator", icon: "📊", label: "Dashboard" },
  { href: "/dashboard/creator/opportunities", icon: "🎯", label: "Opportunities" },
  { href: "/dashboard/creator/deals", icon: "🤝", label: "My Deals" },
  { href: "/messages", icon: "💬", label: "Messages", hasBadge: true },
  { href: "/dashboard/creator/insights", icon: "📈", label: "Insights" },
  { href: "/dashboard/creator/profile", icon: "👤", label: "My Profile" },
  { href: "/dashboard/creator/growth", icon: "🚀", label: "Growth" },
  { href: "/dashboard/creator/activity", icon: "📅", label: "Activity" },
  { href: "/dashboard/creator/readiness", icon: "✅", label: "Readiness" },
  { href: "/dashboard/creator/claim-profiles", icon: "🔗", label: "Claim Profiles" },
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
      {/* Top Nav */}
      <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] flex items-center justify-between px-6">
        <Link href="/dashboard/creator" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-accent)] rounded-lg flex items-center justify-center text-white font-bold text-sm">
            RC
          </div>
          <span className="font-semibold text-[var(--color-text-primary)]">
            Rising Creators
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-56 border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] min-h-[calc(100vh-64px)]">
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/dashboard/creator" && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-[var(--color-accent)] text-white"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  {item.hasBadge && !isActive && <UnreadMessagesBadge />}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
