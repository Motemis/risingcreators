"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NICHES = [
  "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
  "Travel", "Gaming", "Finance", "Education", "Entertainment",
  "Music", "Sports", "Parenting", "Pets"
];

const PLATFORMS = [
  { value: "youtube", label: "YouTube", icon: "🎬" },
  { value: "tiktok", label: "TikTok", icon: "📱" },
  { value: "instagram", label: "Instagram", icon: "📸" },
];

const CONTENT_STYLES = [
  { value: "educational", label: "Educational", icon: "📚" },
  { value: "entertaining", label: "Entertaining", icon: "🎭" },
  { value: "reviews", label: "Product Reviews", icon: "⭐" },
  { value: "tutorials", label: "Tutorials", icon: "🎓" },
  { value: "vlogs", label: "Vlogs", icon: "📹" },
  { value: "lifestyle", label: "Lifestyle", icon: "✨" },
];

const FOLLOWER_RANGES = [
  { min: 1000, max: 10000, label: "Micro (1K - 10K)" },
  { min: 10000, max: 50000, label: "Small (10K - 50K)" },
  { min: 50000, max: 100000, label: "Medium (50K - 100K)" },
  { min: 100000, max: 500000, label: "Large (100K - 500K)" },
  { min: 500000, max: 1000000, label: "Mega (500K - 1M)" },
];

export default function CampaignForm({
  brandProfileId,
  existingCampaign,
  isEditing = false,
}: {
  brandProfileId: string;
  existingCampaign?: any;
  isEditing?: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    name: existingCampaign?.name || "",
    ideal_creator_description: existingCampaign?.ideal_creator_description || "",
    content_requirements: existingCampaign?.content_requirements || "",
    brief: existingCampaign?.brief || "",
    target_niches: existingCampaign?.target_niches || [],
    min_followers: existingCampaign?.min_followers || 10000,
    max_followers: existingCampaign?.max_followers || 100000,
    target_engagement_rate: existingCampaign?.target_engagement_rate || 3,
    preferred_platforms: existingCampaign?.preferred_platforms || [],
    content_style: existingCampaign?.content_style || [],
    budget_total: existingCampaign?.budget_total || "",
    budget_per_creator: existingCampaign?.budget_per_creator || "",
    deliverables: existingCampaign?.deliverables || "",
    start_date: existingCampaign?.start_date || "",
    end_date: existingCampaign?.end_date || "",
  });

  const toggleArrayValue = (field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...prev[field], value],
    }));
  };

  const setFollowerRange = (min: number, max: number) => {
    setForm((prev) => ({
      ...prev,
      min_followers: min,
      max_followers: max,
    }));
  };

  const handleSubmit = async (asDraft: boolean = false) => {
    setSaving(true);

    const campaignData = {
      brand_profile_id: brandProfileId,
      name: form.name,
      status: asDraft ? "draft" : "active",
      ideal_creator_description: form.ideal_creator_description || null,
      content_requirements: form.content_requirements || null,
      brief: form.brief || null,
      target_niches: form.target_niches,
      min_followers: form.min_followers,
      max_followers: form.max_followers,
      target_engagement_rate: form.target_engagement_rate || null,
      preferred_platforms: form.preferred_platforms,
      content_style: form.content_style,
      budget_total: form.budget_total || null,
      budget_per_creator: form.budget_per_creator || null,
      deliverables: form.deliverables || null,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      updated_at: new Date().toISOString(),
    };

    let data, error;

    if (isEditing && existingCampaign?.id) {
      // Update existing campaign
      const result = await supabase
        .from("campaigns")
        .update(campaignData)
        .eq("id", existingCampaign.id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      // Create new campaign
      const result = await supabase
        .from("campaigns")
        .insert(campaignData)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error("Error saving campaign:", error);
      alert("Error: " + error.message);
      setSaving(false);
      return;
    }

    router.push(`/dashboard/brand/campaigns/${data.id}`);
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.name.trim().length > 0;
      case 2:
        return form.target_niches.length > 0;
      case 3:
        return form.preferred_platforms.length > 0;
      case 4:
        return true;
      default:
        return true;
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-8">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <button
              onClick={() => setStep(s)}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                s === step
                  ? "bg-[var(--color-accent)] text-white"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
              }`}
            >
              {s < step ? "✓" : s}
            </button>
            {s < 4 && (
              <div
                className={`w-16 md:w-24 h-1 mx-2 rounded ${
                  s < step ? "bg-green-500" : "bg-[var(--color-bg-tertiary)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Campaign Basics
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Campaign Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Summer Product Launch"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              What are you looking for? *
            </label>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3">
              Describe your ideal creator in your own words. What kind of content do they make? 
              What audience do they reach? What makes someone a great fit for this campaign?
            </p>
            <textarea
              value={form.ideal_creator_description}
              onChange={(e) => setForm({ ...form, ideal_creator_description: e.target.value })}
              placeholder="Example: I'm looking for golf content creators who make instructional videos and course vlogs. They should have an engaged audience of amateur golfers who are looking to improve their game. I want someone authentic who genuinely uses and reviews golf products, not just someone reading a script. Bonus if they have a fun personality and aren't afraid to show their bad shots too!"
              rows={5}
              className={inputClass}
            />
            <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
              💡 This helps us match you with the right creators AND helps creators understand what brands like you are looking for.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              What will the creator need to do?
            </label>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3">
              Describe the content you're hoping to get. Be specific about deliverables, messaging, or creative direction.
            </p>
            <textarea
              value={form.content_requirements}
              onChange={(e) => setForm({ ...form, content_requirements: e.target.value })}
              placeholder="Example: We'd love a YouTube video (8-15 min) reviewing our new golf driver, plus 2-3 Instagram stories showing them using it on the course. We want honest reactions - if something doesn't work for their swing, that's okay to mention. We'll provide the product free and pay for the content."
              rows={4}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Campaign Brief (optional)
            </label>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-3">
              Any additional context about your brand, product, or campaign goals.
            </p>
            <textarea
              value={form.brief}
              onChange={(e) => setForm({ ...form, brief: e.target.value })}
              placeholder="Example: We're launching a new line of premium golf clubs aimed at mid-handicap players (10-20 handicap). Our target customer is 30-55, plays 1-2x per week, and is willing to invest in quality equipment. We want to build awareness before the spring golf season..."
              rows={4}
              className={inputClass}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                End Date
              </label>
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Target Creators */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Target Creators
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Niches * (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {NICHES.map((niche) => (
                <button
                  key={niche}
                  type="button"
                  onClick={() => toggleArrayValue("target_niches", niche)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    form.target_niches.includes(niche)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  {niche}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Follower Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {FOLLOWER_RANGES.map((range) => (
                <button
                  key={range.label}
                  type="button"
                  onClick={() => setFollowerRange(range.min, range.max)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    form.min_followers === range.min && form.max_followers === range.max
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Minimum Engagement Rate
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="10"
                step="0.5"
                value={form.target_engagement_rate}
                onChange={(e) =>
                  setForm({ ...form, target_engagement_rate: parseFloat(e.target.value) })
                }
                className="flex-1"
              />
              <span className="text-[var(--color-text-primary)] font-medium w-16 text-right">
                {form.target_engagement_rate}%+
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Content Requirements */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Content Requirements
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Platforms * (select all that apply)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => toggleArrayValue("preferred_platforms", platform.value)}
                  className={`px-4 py-4 rounded-lg text-sm font-medium transition-colors flex flex-col items-center gap-2 ${
                    form.preferred_platforms.includes(platform.value)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  <span className="text-2xl">{platform.icon}</span>
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Content Style (select all that apply)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {CONTENT_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => toggleArrayValue("content_style", style.value)}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    form.content_style.includes(style.value)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  <span>{style.icon}</span>
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Deliverables
            </label>
            <input
              type="text"
              value={form.deliverables}
              onChange={(e) => setForm({ ...form, deliverables: e.target.value })}
              placeholder="e.g., 1 YouTube video + 2 Instagram posts"
              className={inputClass}
            />
          </div>
        </div>
      )}

      {/* Step 4: Budget */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Budget & Review
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Total Budget
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                  $
                </span>
                <input
                  type="number"
                  value={form.budget_total}
                  onChange={(e) => setForm({ ...form, budget_total: e.target.value })}
                  placeholder="5000"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Budget Per Creator
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">
                  $
                </span>
                <input
                  type="number"
                  value={form.budget_per_creator}
                  onChange={(e) => setForm({ ...form, budget_per_creator: e.target.value })}
                  placeholder="500"
                  className={`${inputClass} pl-8`}
                />
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[var(--color-bg-tertiary)] rounded-lg p-6 mt-6">
            <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">
              Campaign Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[var(--color-text-tertiary)]">Name</p>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {form.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Niches</p>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {form.target_niches.join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Followers</p>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {form.min_followers.toLocaleString()} - {form.max_followers.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Platforms</p>
                <p className="text-[var(--color-text-primary)] font-medium capitalize">
                  {form.preferred_platforms.join(", ") || "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Budget</p>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {form.budget_total ? `$${form.budget_total}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)]">Timeline</p>
                <p className="text-[var(--color-text-primary)] font-medium">
                  {form.start_date && form.end_date
                    ? `${new Date(form.start_date).toLocaleDateString()} - ${new Date(
                        form.end_date
                      ).toLocaleDateString()}`
                    : "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8 pt-6 border-t border-[var(--color-border)]">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          >
            Back
          </button>
        ) : (
          <div />
        )}

        <div className="flex gap-3">
          {step === 4 && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={saving}
              className="px-6 py-2 border border-[var(--color-border-strong)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-tertiary)] disabled:opacity-50"
            >
              Save as Draft
            </button>
          )}

          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={() => handleSubmit(false)}
              disabled={saving || !form.name}
              className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving..." : isEditing ? "Save Changes" : "Launch Campaign"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}