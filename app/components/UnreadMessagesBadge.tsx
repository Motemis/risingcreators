"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function UnreadMessagesBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();

    // Poll every 30 seconds
    const interval = setInterval(loadUnreadCount, 30000);

    // Also subscribe to new messages
    const channel = supabase
      .channel("unread-messages")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        () => {
          // Reload count when any new message comes in
          loadUnreadCount();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const loadUnreadCount = async () => {
    try {
      const res = await fetch("/api/messages/unread-count");
      const data = await res.json();
      if (typeof data.unreadCount === "number") {
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error loading unread count:", error);
    }
  };

  if (unreadCount === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
      {unreadCount > 9 ? "9+" : unreadCount}
    </span>
  );
}
