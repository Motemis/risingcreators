"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 99,
    period: "month",
    features: [
      "Unlimited creator searches",
      "Full creator profiles",
      "Contact info for claimed creators",
      "Request intros for unclaimed",
      "Save up to 50 creators",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: 249,
    period: "month",
    popular: true,
    features: [
      "Everything in Starter",
      "Unlimited saved creators",
      "Export creator lists",
      "Advanced filters",
      "Priority support",
      "Early access to new features",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: null,
    period: "custom",
    features: [
      "Everything in Pro",
      "Custom integrations",
      "Dedicated account manager",
      "Team collaboration",
      "API access",
      "Custom reporting",
    ],
  },
];

export default function UpgradeOptions({
  brandProfileId,
  userId,
}: {
  brandProfileId?: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: string) => {
    setLoading(planId);

    // For now, just enable premium directly (replace with Stripe later)
    // This is a demo/testing shortcut

    if (!brandProfileId) {
      // Create brand profile first
      await supabase
        .from("brand_profiles")
        .insert({
          user_id: userId,
          is_premium: true,
          premium_until: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(), // 30 days
        })
        .select()
        .single();
    } else {
      await supabase
        .from("brand_profiles")
        .update({
          is_premium: true,
          premium_until: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", brandProfileId);
    }

    router.push("/dashboard/brand/discover?upgraded=true");
    router.refresh();
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {PLANS.map((plan) => (
        <div
          key={plan.id}
          className={`bg-[var(--color-bg-secondary)] border rounded-xl p-6 ${
            plan.popular
              ? "border-[var(--color-accent)] ring-2 ring-[var(--color-accent-light)]"
              : "border-[var(--color-border)]"
          }`}
        >
          {plan.popular && (
            <div className="text-center mb-4">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--color-accent)] text-white">
                Most Popular
              </span>
            </div>
          )}

          <h2 className="text-xl font-bold text-[var(--color-text-primary)] text-center">
            {plan.name}
          </h2>

          <div className="text-center my-6">
            {plan.price ? (
              <>
                <span className="text-4xl font-bold text-[var(--color-text-primary)]">
                  ${plan.price}
                </span>
                <span className="text-[var(--color-text-secondary)]">
                  /{plan.period}
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                Contact Us
              </span>
            )}
          </div>

          <ul className="space-y-3 mb-6">
            {plan.features.map((feature, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-green-500 mt-0.5">✓</span>
                <span className="text-[var(--color-text-secondary)]">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {plan.price ? (
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading === plan.id}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                plan.popular
                  ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)]"
              } disabled:opacity-50`}
            >
              {loading === plan.id ? "Processing..." : "Get Started"}
            </button>
          ) : (
            <a
              href="mailto:sales@risingcreators.com"
              className="block w-full py-3 rounded-lg font-semibold text-center bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-accent-light)]"
            >
              Contact Sales
            </a>
          )}
        </div>
      ))}
    </div>
  );
}



