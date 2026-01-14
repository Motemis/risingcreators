import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await currentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("clerk_id", user.id)
    .single();

  if (!dbUser || dbUser.user_type !== "brand") {
    return NextResponse.json({ error: "Not a brand" }, { status: 403 });
  }

  const { data: brandProfile } = await supabase
    .from("brand_profiles")
    .select("id")
    .eq("user_id", dbUser.id)
    .single();

  if (!brandProfile) {
    return NextResponse.json({ error: "Brand profile not found" }, { status: 404 });
  }

  const { data: campaigns, error } = await supabase
    .from("campaigns")
    .select("id, name, status")
    .eq("brand_profile_id", brandProfile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ campaigns });
}
