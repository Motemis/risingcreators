"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function Filters({
  currentPlatform,
  currentNiche,
  currentMinFollowers,
  currentMaxFollowers,
}: {
  currentPlatform?: string;
  currentNiche?: string;
  currentMinFollowers?: string;
  currentMaxFollowers?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    router.push(`/dashboard/brand?${params.toString()}`);
  };

  const handleFollowerChange = (range: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (range === "all") {
      params.delete("minFollowers");
      params.delete("maxFollowers");
    } else if (range === "10k-50k") {
      params.set("minFollowers", "10000");
      params.set("maxFollowers", "50000");
    } else if (range === "50k-100k") {
      params.set("minFollowers", "50000");
      params.set("maxFollowers", "100000");
    } else if (range === "100k+") {
      params.set("minFollowers", "100000");
      params.delete("maxFollowers");
    }

    router.push(`/dashboard/brand?${params.toString()}`);
  };

  const getCurrentFollowerRange = () => {
    if (!currentMinFollowers) return "all";
    if (currentMinFollowers === "10000" && currentMaxFollowers === "50000") return "10k-50k";
    if (currentMinFollowers === "50000" && currentMaxFollowers === "100000") return "50k-100k";
    if (currentMinFollowers === "100000") return "100k+";
    return "all";
  };

  return (
    <div className="bg-gray-800 rounded-xl p-4 mb-6">
      <div className="flex gap-4 flex-wrap">
        <select
          className="bg-gray-700 text-white px-4 py-2 rounded-lg"
          value={currentPlatform || "all"}
          onChange={(e) => updateFilter("platform", e.target.value)}
        >
          <option value="all">All Platforms</option>
          <option value="youtube">YouTube</option>
          <option value="tiktok">TikTok</option>
        </select>

        <select
          className="bg-gray-700 text-white px-4 py-2 rounded-lg"
          value={currentNiche || "all"}
          onChange={(e) => updateFilter("niche", e.target.value)}
        >
          <option value="all">All Niches</option>
          <option value="outdoor">Outdoor</option>
          <option value="gaming">Gaming</option>
          <option value="beauty">Beauty</option>
          <option value="fitness">Fitness</option>
          <option value="tech">Tech</option>
        </select>

        <select
          className="bg-gray-700 text-white px-4 py-2 rounded-lg"
          value={getCurrentFollowerRange()}
          onChange={(e) => handleFollowerChange(e.target.value)}
        >
          <option value="all">Any Followers</option>
          <option value="10k-50k">10k - 50k</option>
          <option value="50k-100k">50k - 100k</option>
          <option value="100k+">100k+</option>
        </select>

        {(currentPlatform || currentNiche || currentMinFollowers) && (
          <button
            onClick={() => router.push("/dashboard/brand")}
            className="text-gray-400 hover:text-white px-4 py-2"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}