"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

interface SocialConnection {
  id: string;
  platform: string;
  platform_username: string;
  followers: number;
  profile_url: string;
  profile_image_url: string;
}

export default function ConnectYouTube({
  existingConnection,
}: {
  existingConnection: SocialConnection | null;
}) {
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const router = useRouter();

  const handleConnect = () => {
    setConnecting(true);
    window.location.href = "/api/auth/youtube";
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMessage("");

    try {
      const response = await fetch("/api/youtube/sync-videos", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setSyncMessage(`✓ Synced ${data.synced} videos`);
        router.refresh();
      } else {
        setSyncMessage(`Error: ${data.error}`);
      }
    } catch (err) {
      setSyncMessage("Sync failed");
    }

    setSyncing(false);
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect YouTube? This will remove your synced videos.")) {
      return;
    }

    setDisconnecting(true);

    try {
      // Delete the social connection (posts will be deleted via cascade or manually)
      await supabase
        .from("social_connections")
        .delete()
        .eq("id", existingConnection?.id);

      // Also clear YouTube data from creator profile
      const { data: connection } = await supabase
        .from("social_connections")
        .select("user_id")
        .eq("id", existingConnection?.id)
        .single();

      if (connection) {
        // Get creator profile and clear YouTube fields
        const { data: profile } = await supabase
          .from("creator_profiles")
          .select("id")
          .eq("user_id", connection.user_id)
          .single();

        if (profile) {
          await supabase
            .from("creator_profiles")
            .update({
              youtube_subscribers: 0,
              youtube_url: null,
            })
            .eq("id", profile.id);

          // Delete YouTube posts
          await supabase
            .from("creator_posts")
            .delete()
            .eq("creator_profile_id", profile.id)
            .eq("platform", "YouTube");
        }
      }

      router.refresh();
    } catch (err) {
      console.error("Disconnect error:", err);
    }

    setDisconnecting(false);
  };

  const formatFollowers = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (existingConnection) {
    return (
      <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
        <div className="flex items-center gap-4">
          {existingConnection.profile_image_url && (
            <img
              src={existingConnection.profile_image_url}
              alt="YouTube"
              className="w-12 h-12 rounded-full"
            />
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-red-500 text-lg">▶</span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {existingConnection.platform_username}
              </span>
              <span className="text-green-500 text-sm">✓ Connected</span>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {formatFollowers(existingConnection.followers)} subscribers
            </p>
          </div>
          <a
            href={existingConnection.profile_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-accent)] hover:underline text-sm"
          >
            View ↗
          </a>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="text-sm bg-[var(--color-accent)] text-white px-4 py-2 rounded-lg hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {syncing ? "Syncing..." : "Sync Videos"}
          </button>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-sm text-red-500 hover:text-red-400 px-4 py-2 disabled:opacity-50"
          >
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </button>
          {syncMessage && (
            <span className={`text-sm ${syncMessage.startsWith("✓") ? "text-green-500" : "text-red-500"}`}>
              {syncMessage}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border-2 border-dashed border-[var(--color-border-strong)] hover:border-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
    >
      <span className="text-red-500 text-xl">▶</span>
      <span className="text-[var(--color-text-primary)]">
        {connecting ? "Connecting..." : "Connect YouTube"}
      </span>
    </button>
  );
}