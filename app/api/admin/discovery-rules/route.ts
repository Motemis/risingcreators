import { NextRequest, NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

const ADMIN_EMAILS = ["justin.motes@me.com", "motemis@gmail.com"];

export async function POST(request: NextRequest) {
  const user = await currentUser();

  if (!user || !ADMIN_EMAILS.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("auto_discovery_rules")
    .insert({
      name: body.name,
      search_queries: body.search_queries,
      target_niches: body.target_niches,
      min_followers: body.min_followers,
      max_followers: body.max_followers,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const user = await currentUser();

  if (!user || !ADMIN_EMAILS.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  const { error } = await supabase
    .from("auto_discovery_rules")
    .update(updates)
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest) {
  const user = await currentUser();

  if (!user || !ADMIN_EMAILS.includes(user.emailAddresses[0]?.emailAddress || "")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const { error } = await supabase
    .from("auto_discovery_rules")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
