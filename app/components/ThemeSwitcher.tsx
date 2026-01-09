"use client";

import { useTheme } from "./theme-provider";

export default function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
          Theme
        </label>
        <div className="space-y-2">
          <button
            onClick={() => setTheme("light")}
            className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
              theme === "light"
                ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Light</span>
              {theme === "light" && <span className="text-[var(--color-accent)]">✓</span>}
            </div>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
              theme === "dark"
                ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>Dark</span>
              {theme === "dark" && <span className="text-[var(--color-accent)]">✓</span>}
            </div>
          </button>

          <button
            onClick={() => setTheme("system")}
            className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
              theme === "system"
                ? "border-[var(--color-accent)] bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>System</span>
              {theme === "system" && <span className="text-[var(--color-accent)]">✓</span>}
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              Currently: {resolvedTheme === "dark" ? "Dark" : "Light"}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}



