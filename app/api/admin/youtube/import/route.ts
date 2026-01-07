import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const user = await currentUser();

  // Simple admin allowlist
  const adminEmails = ["justin.motes@me.com", "motemis@gmail.com"];
  if (!user || !adminEmails.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { channels } = await request.json();

  if (!channels || channels.length === 0) {
    return NextResponse.json({ error: "No channels to import" }, { status: 400 });
  }

  try {
    let imported = 0;

    for (const channel of channels) {
      const { error } = await supabase.from("discovered_creators").upsert(
        {
          platform: "youtube",
          platform_user_id: channel.id,
          platform_username: channel.customUrl || channel.id,
          display_name: channel.title,
          profile_image_url: channel.thumbnail,
          bio: channel.description?.substring(0, 500),
          followers: channel.subscriberCount,
          total_posts: channel.videoCount,
          avg_views: Math.round(channel.viewCount / Math.max(channel.videoCount, 1)),
          status: "active",
          last_scraped_at: new Date().toISOString(),
        },
        {
          onConflict: "platform,platform_user_id",
        }
      );

      if (!error) {
        imported++;
      } else {
        console.error("Import error for channel:", channel.id, error);
      }
    }

    return NextResponse.json({ imported });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
