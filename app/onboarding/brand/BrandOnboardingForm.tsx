"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const INDUSTRIES = [
  "E-commerce / Retail",
  "SaaS / Technology",
  "Food & Beverage",
  "Health & Wellness",
  "Beauty & Cosmetics",
  "Fashion & Apparel",
  "Finance / Fintech",
  "Travel & Hospitality",
  "Entertainment / Media",
  "Education",
  "Gaming",
  "Sports & Fitness",
  "Home & Living",
  "Automotive",
  "Other",
];

const AGE_RANGES = [
  { value: "13-17", label: "13-17 (Gen Z)" },
  { value: "18-24", label: "18-24 (Young Adults)" },
  { value: "25-34", label: "25-34 (Millennials)" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
];

const BUDGET_RANGES = [
  { value: "under_500", label: "Under $500 per creator" },
  { value: "500_1000", label: "$500 - $1,000" },
  { value: "1000_5000", label: "$1,000 - $5,000" },
  { value: "5000_plus", label: "$5,000+" },
];

const CAMPAIGN_GOALS = [
  { value: "awareness", label: "Brand Awareness", icon: "📢" },
  { value: "sales", label: "Drive Sales", icon: "💰" },
  { value: "engagement", label: "Boost Engagement", icon: "💬" },
  { value: "content", label: "Get Content", icon: "🎬" },
  { value: "launch", label: "Product Launch", icon: "🚀" },
  { value: "community", label: "Build Community", icon: "👥" },
];

const CREATOR_SIZES = [
  { value: "micro", label: "Micro (1K-10K)", desc: "High engagement, niche audiences" },
  { value: "small", label: "Small (10K-50K)", desc: "Growing creators, good value" },
  { value: "medium", label: "Medium (50K-100K)", desc: "Established, reliable reach" },
  { value: "large", label: "Large (100K-500K)", desc: "Wide reach, professional" },
];

const CONTENT_STYLES = [
  { value: "educational", label: "Educational", icon: "📚" },
  { value: "entertaining", label: "Entertaining", icon: "🎭" },
  { value: "lifestyle", label: "Lifestyle", icon: "✨" },
  { value: "reviews", label: "Reviews", icon: "⭐" },
  { value: "tutorials", label: "Tutorials", icon: "🎓" },
  { value: "vlogs", label: "Vlogs", icon: "📹" },
];

const NICHES = [
  "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
  "Travel", "Gaming", "Finance", "Education", "Entertainment",
  "Music", "Sports", "Parenting", "Pets",
];

export default function BrandOnboardingForm({
  userId,
  existingProfile,
}: {
  userId: string;
  existingProfile: any;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    company_name: existingProfile?.company_name || "",
    industry: existingProfile?.industry || "",
    target_audience_age: existingProfile?.target_audience_age || [],
    target_audience_gender: existingProfile?.target_audience_gender || "all",
    budget_per_creator: existingProfile?.budget_per_creator || "",
    campaign_goals: existingProfile?.campaign_goals || [],
    preferred_creator_size: existingProfile?.preferred_creator_size || [],
    preferred_content_style: existingProfile?.preferred_content_style || [],
    preferred_niches: existingProfile?.preferred_niches || [],
  });

  const toggleArrayValue = (field: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v: string) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);

    const profileData = {
      user_id: userId,
      company_name: form.company_name,
      industry: form.industry,
      target_audience_age: form.target_audience_age,
      target_audience_gender: form.target_audience_gender,
      budget_per_creator: form.budget_per_creator,
      campaign_goals: form.campaign_goals,
      preferred_creator_size: form.preferred_creator_size,
      preferred_content_style: form.preferred_content_style,
      preferred_niches: form.preferred_niches,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (existingProfile) {
      await supabase
        .from("brand_profiles")
        .update(profileData)
        .eq("id", existingProfile.id);
    } else {
      await supabase.from("brand_profiles").insert(profileData);
    }

    router.push("/dashboard/brand/discover");
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.company_name && form.industry;
      case 2:
        return form.target_audience_age.length > 0;
      case 3:
        return form.budget_per_creator && form.campaign_goals.length > 0;
      case 4:
        return form.preferred_creator_size.length > 0;
      case 5:
        return form.preferred_niches.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-8">
      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                s === step
                  ? "bg-[var(--color-accent)] text-white"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)]"
              }`}
            >
              {s < step ? "✓" : s}
            </div>
            {s < 5 && (
              <div
                className={`w-12 h-1 mx-2 rounded ${
                  s < step ? "bg-green-500" : "bg-[var(--color-bg-tertiary)]"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Company Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            About Your Company
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Company Name
            </label>
            <input
              type="text"
              value={form.company_name}
              onChange={(e) => setForm({ ...form, company_name: e.target.value })}
              placeholder="Your company name"
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Industry
            </label>
            <select
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
              className="w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
            >
              <option value="">Select your industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Target Audience */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Who's Your Target Audience?
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Age Ranges (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {AGE_RANGES.map((age) => (
                <button
                  key={age.value}
                  type="button"
                  onClick={() => toggleArrayValue("target_audience_age", age.value)}
                  className={`px-4 py-3 rounded-lg text-left transition-colors ${
                    form.target_audience_age.includes(age.value)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  {age.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Gender
            </label>
            <div className="flex gap-3">
              {[
                { value: "all", label: "All" },
                { value: "male", label: "Primarily Male" },
                { value: "female", label: "Primarily Female" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm({ ...form, target_audience_gender: option.value })}
                  className={`flex-1 px-4 py-3 rounded-lg transition-colors ${
                    form.target_audience_gender === option.value
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Budget & Goals */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Budget & Goals
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Budget Per Creator
            </label>
            <div className="space-y-2">
              {BUDGET_RANGES.map((budget) => (
                <button
                  key={budget.value}
                  type="button"
                  onClick={() => setForm({ ...form, budget_per_creator: budget.value })}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    form.budget_per_creator === budget.value
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  {budget.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Campaign Goals (select all that apply)
            </label>
            <div className="grid grid-cols-2 gap-3">
              {CAMPAIGN_GOALS.map((goal) => (
                <button
                  key={goal.value}
                  type="button"
                  onClick={() => toggleArrayValue("campaign_goals", goal.value)}
                  className={`px-4 py-3 rounded-lg text-left transition-colors flex items-center gap-2 ${
                    form.campaign_goals.includes(goal.value)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  <span>{goal.icon}</span>
                  {goal.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Creator Preferences */}
      {step === 4 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            What Creators Are You Looking For?
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Creator Size (select all that apply)
            </label>
            <div className="space-y-2">
              {CREATOR_SIZES.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => toggleArrayValue("preferred_creator_size", size.value)}
                  className={`w-full px-4 py-4 rounded-lg text-left transition-colors ${
                    form.preferred_creator_size.includes(size.value)
                      ? "bg-[var(--color-accent)] text-white"
                      : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                  }`}
                >
                  <p className="font-medium">{size.label}</p>
                  <p className={`text-sm ${
                    form.preferred_creator_size.includes(size.value)
                      ? "text-white/80"
                      : "text-[var(--color-text-tertiary)]"
                  }`}>
                    {size.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
              Content Style (select all that apply)
            </label>
            <div className="flex flex-wrap gap-2">
              {CONTENT_STYLES.map((style) => (
                <button
                  key={style.value}
                  type="button"
                  onClick={() => toggleArrayValue("preferred_content_style", style.value)}
                  className={`px-4 py-2 rounded-full transition-colors flex items-center gap-2 ${
                    form.preferred_content_style.includes(style.value)
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
        </div>
      )}

      {/* Step 5: Niches */}
      {step === 5 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            What Niches Interest You?
          </h2>
          <p className="text-[var(--color-text-secondary)]">
            Select the creator niches that align with your brand
          </p>

          <div className="flex flex-wrap gap-2">
            {NICHES.map((niche) => (
              <button
                key={niche}
                type="button"
                onClick={() => toggleArrayValue("preferred_niches", niche)}
                className={`px-4 py-2 rounded-full transition-colors ${
                  form.preferred_niches.includes(niche)
                    ? "bg-[var(--color-accent)] text-white"
                    : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                }`}
              >
                {niche}
              </button>
            ))}
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

        {step < 5 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canProceed()}
            className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!canProceed() || saving}
            className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Find My Creators"}
          </button>
        )}
      </div>
    </div>
  );
}



