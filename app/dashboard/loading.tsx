export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-primary)]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)] mx-auto mb-4"></div>
        <p className="text-[var(--color-text-secondary)]">Loading dashboard...</p>
      </div>
    </div>
  );
}
