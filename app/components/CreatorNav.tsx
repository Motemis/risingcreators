"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard/creator", label: "Overview", icon: "📊" },
  { href: "/dashboard/creator/growth", label: "My Growth", icon: "📈" },
  { href: "/dashboard/creator/readiness", label: "Brand Readiness", icon: "✅" },
  { href: "/dashboard/creator/activity", label: "Brand Activity", icon: "👁" },
  { href: "/dashboard/creator/profile", label: "My Profile", icon: "👤" },
];

export default function CreatorNav() {
  const pathname = usePathname();

  return (
    <nav className="w-64 bg-gray-800 min-h-screen p-4">
      <div className="mb-8">
        <p className="text-gray-400 text-sm font-medium">CREATOR DASHBOARD</p>
      </div>
      <ul className="space-y-2">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                pathname === item.href
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}