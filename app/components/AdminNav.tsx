"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/discover", label: "Discover", icon: "🔍" },
  { href: "/admin/creators", label: "Creators", icon: "👥" },
  { href: "/admin/rules", label: "Auto Rules", icon: "⚙️" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)] px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin/discover" className="flex items-center gap-2">
            <span className="text-xl font-bold text-[var(--color-accent)]">RC</span>
            <span className="font-semibold text-[var(--color-text-primary)]">Admin</span>
          </Link>

          <div className="flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <Link
          href="/dashboard/brand"
          className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          ← Back to App
        </Link>
      </div>
    </nav>
  );
}



