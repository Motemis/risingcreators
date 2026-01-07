import { supabase } from "@/lib/supabase";
import AutoDiscoveryRules from "./AutoDiscoveryRules";

export default async function AdminRulesPage() {
  const { data: rules } = await supabase
    .from("auto_discovery_rules")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">
          Auto-Discovery Rules
        </h1>
        <p className="text-[var(--color-text-secondary)] mb-8">
          Set up rules to automatically find and import rising creators.
        </p>

        <AutoDiscoveryRules initialRules={rules || []} />
      </div>
    </div>
  );
}