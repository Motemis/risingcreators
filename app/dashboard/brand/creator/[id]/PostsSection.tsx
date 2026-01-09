import { supabase } from "@/lib/supabase";
import ContentGallery from "./ContentGallery";

export default async function PostsSection({
  creatorProfileId,
}: {
  creatorProfileId: string;
}) {
  const { data: posts } = await supabase
    .from("creator_posts")
    .select("*")
    .eq("creator_profile_id", creatorProfileId)
    .eq("is_featured", true)
    .order("views", { ascending: false })
    .limit(15);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="bg-[var(--color-bg-secondary)] rounded-xl p-6 border border-[var(--color-border)] mt-6">
      <h2 className="text-[var(--color-text-tertiary)] text-sm font-medium mb-4 uppercase">
        Featured Content
      </h2>
      <ContentGallery posts={posts} />
    </div>
  );
}




