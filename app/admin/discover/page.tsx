import YouTubeDiscovery from "./YouTubeDiscovery";

export default async function AdminDiscoverPage() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Creator Discovery Tool
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Search YouTube for rising creators and add them to your database.
        </p>

        <YouTubeDiscovery />
      </div>
    </div>
  );
}


