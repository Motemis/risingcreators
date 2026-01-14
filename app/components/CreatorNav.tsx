"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function CreatorNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/creator", label: "Dashboard" },
    { href: "/dashboard/creator/opportunities", label: "Opportunities" },
    { href: "/dashboard/creator/deals", label: "My Deals" },
    { href: "/dashboard/creator/insights", label: "Insights" },
    { href: "/dashboard/creator/profile", label: "My Profile" },
    { href: "/dashboard/creator/growth", label: "Growth" },
    { href: "/dashboard/creator/activity", label: "Activity" },
    { href: "/dashboard/creator/readiness", label: "Readiness" },
    { href: "/dashboard/creator/claim", label: "Claim Profiles" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/creator") return pathname === href;
    // For profile routes, match exactly to avoid both being active
    if (href === "/dashboard/creator/profile") return pathname === href;
    if (href === "/dashboard/creator/profile/edit") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <nav className="w-56 min-h-screen bg-[var(--color-bg-secondary)] border-r border-[var(--color-border)] p-4">
      <div className="space-y-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`block px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(link.href)
                ? "bg-[var(--color-accent)] text-white"
                : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
