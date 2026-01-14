"use client";

import { useTheme } from "./theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const getIcon = () => {
    if (resolvedTheme === "dark") return "🌙";
    return "☀️";
  };

  const getLabel = () => {
    if (theme === "system") return "System";
    if (theme === "dark") return "Dark";
    return "Light";
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-colors"
      title={`Theme: ${getLabel()}`}
    >
      <span className="text-lg">{getIcon()}</span>
      <span className="text-sm">{getLabel()}</span>
    </button>
  );
}
