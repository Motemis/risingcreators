import { supabase } from "@/lib/supabase";
import CreatorsManager from "./CreatorsManager";

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; filter?: string; search?: string }>;
}) {
  const params = await searchParams;

  const page = parseInt(params.page || "1");
  const filter = params.filter || "all";
  const search = params.search || "";
  const perPage = 25;
  const offset = (page - 1) * perPage;

  // Build query
  let query = supabase
    .from("discovered_creators")
    .select("*", { count: "exact" });

  // Apply filters
  if (filter === "hidden") {
    query = query.eq("is_hidden", true);
  } else if (filter === "visible") {
    query = query.eq("is_hidden", false);
  } else if (filter === "claimed") {
    query = query.not("claimed_by", "is", null);
  } else if (filter === "unclaimed") {
    query = query.is("claimed_by", null);
  }

  // Apply search
  if (search) {
    query = query.or(`display_name.ilike.%${search}%,platform_username.ilike.%${search}%`);
  }

  // Get paginated results
  const { data: creators, count } = await query
    .order("rising_score", { ascending: false, nullsFirst: false })
    .order("followers", { ascending: false })
    .range(offset, offset + perPage - 1);

  // Get stats
  const { count: totalCount } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true });

  const { count: hiddenCount } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true })
    .eq("is_hidden", true);

  const { count: claimedCount } = await supabase
    .from("discovered_creators")
    .select("*", { count: "exact", head: true })
    .not("claimed_by", "is", null);

  const totalPages = Math.ceil((count || 0) / perPage);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Manage Creators
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-6">
          View and manage all imported creators. Hidden creators won't appear to brands.
        </p>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">{totalCount || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Total Creators</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-green-500">{(totalCount || 0) - (hiddenCount || 0)}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Visible to Brands</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-yellow-500">{hiddenCount || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Hidden</p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
            <p className="text-2xl font-bold text-blue-500">{claimedCount || 0}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">Claimed</p>
          </div>
        </div>

        <CreatorsManager
          creators={creators || []}
          currentPage={page}
          totalPages={totalPages}
          totalCount={count || 0}
          currentFilter={filter}
          currentSearch={search}
        />
      </div>
    </div>
  );
}