"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";

export default function Header() {
  const pathname = usePathname();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[var(--color-accent)] rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">RC</span>
          </div>
          <span className="text-[var(--color-accent)] font-semibold text-xl">
            Rising Creators
          </span>
        </Link>

        {/* User Section */}
        <div className="flex items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="text-sm font-medium text-white bg-[var(--color-accent)] px-4 py-2 rounded-full hover:bg-[var(--color-accent-hover)]">
                Sign up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)] transition-colors"
            >
              Dashboard
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-lg transition-colors"
                title="Theme settings"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              {showThemeMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setShowThemeMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl shadow-lg p-4 w-64 z-20">
                    <ThemeSwitcher />
                  </div>
                </>
              )}
            </div>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}




