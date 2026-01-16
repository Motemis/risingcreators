import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const FOLLOWER_TIERS = [
  { name: "nano", min: 0, max: 10000 },
  { name: "micro", min: 10000, max: 50000 },
  { name: "mid", min: 50000, max: 100000 },
  { name: "macro", min: 100000, max: 500000 },
  { name: "mega", min: 500000, max: 999999999 },
];

const NICHES = [
  "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
  "Travel", "Gaming", "Finance", "Education", "Entertainment",
  "Music", "Sports", "Parenting", "Pets"
];

Deno.serve(async (req) => {
  try {
    const results = { benchmarks_updated: 0, errors: 0 };

    for (const niche of NICHES) {
      for (const tier of FOLLOWER_TIERS) {
        try {
          // Get creators in this niche and tier
          const { data: creators } = await supabase
            .from("creator_profiles")
            .select(`
              total_followers,
              total_engagement_rate,
              follower_growth_30d,
              avg_post_performance
            `)
            .contains("niche", [niche])
            .gte("total_followers", tier.min)
            .lt("total_followers", tier.max)
            .not("total_engagement_rate", "is", null);

          if (!creators || creators.length < 3) {
            // Not enough data, skip
            continue;
          }

          // Calculate averages
          const avgEngagement = creators.reduce((sum, c) => sum + (c.total_engagement_rate || 0), 0) / creators.length;
          const avgGrowth = creators.reduce((sum, c) => sum + (c.follower_growth_30d || 0), 0) / creators.length;
          const avgViews = creators.reduce((sum, c) => sum + (c.avg_post_performance || 0), 0) / creators.length;

          // Upsert benchmark
          await supabase.from("niche_benchmarks").upsert(
            {
              niche: niche,
              follower_tier: tier.name,
              avg_engagement_rate: Math.round(avgEngagement * 100) / 100,
              avg_growth_rate: Math.round(avgGrowth * 100) / 100,
              avg_views_per_post: Math.round(avgViews),
              sample_size: creators.length,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "niche,follower_tier" }
          );

          results.benchmarks_updated++;
        } catch (err) {
          console.error(`Error calculating benchmark for ${niche}/${tier.name}:`, err);
          results.errors++;
        }
      }
    }

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Benchmark update error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500 });
  }
});
