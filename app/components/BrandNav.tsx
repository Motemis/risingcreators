"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function BrandNav() {
  const pathname = usePathname();

  const links = [
    { href: "/dashboard/brand", label: "Dashboard" },
    { href: "/dashboard/brand/discover", label: "Discover" },
    { href: "/dashboard/brand/watchlists", label: "Watchlists" },
    { href: "/dashboard/brand/unlocked", label: "Unlocked" },
    { href: "/dashboard/brand/insights", label: "Insights" },
    { href: "/dashboard/brand/profile", label: "Brand Profile" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard/brand") return pathname === href;
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
