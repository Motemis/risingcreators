"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const INDUSTRY_OPTIONS = [
  "Technology",
  "Fashion",
  "Beauty",
  "Health & Wellness",
  "Food & Beverage",
  "Travel",
  "Finance",
  "Entertainment",
  "Sports",
  "Gaming",
  "Education",
  "Home & Living",
  "Automotive",
  "Retail",
  "Other",
];

interface BrandProfile {
  id?: string;
  user_id: string;
  company_name: string | null;
  logo_url: string | null;
  website: string | null;
  industry: string[] | null;
  bio: string | null;
}

export default function BrandProfileForm({
  userId,
  existingProfile,
}: {
  userId: string;
  existingProfile: BrandProfile | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    company_name: existingProfile?.company_name || "",
    logo_url: existingProfile?.logo_url || "",
    website: existingProfile?.website || "",
    industry: existingProfile?.industry || [],
    bio: existingProfile?.bio || "",
  });

  const handleIndustryToggle = (industry: string) => {
    setForm((prev) => ({
      ...prev,
      industry: prev.industry.includes(industry)
        ? prev.industry.filter((i) => i !== industry)
        : [...prev.industry, industry],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const profileData = {
      user_id: userId,
      company_name: form.company_name || null,
      logo_url: form.logo_url || null,
      website: form.website || null,
      industry: form.industry.length > 0 ? form.industry : null,
      bio: form.bio || null,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (existingProfile) {
      const result = await supabase
        .from("brand_profiles")
        .update(profileData)
        .eq("id", existingProfile.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("brand_profiles")
        .insert(profileData);
      error = result.error;
    }

    setSaving(false);

    if (error) {
      setMessage("Error saving profile: " + error.message);
    } else {
      setMessage("Profile saved!");
      router.refresh();
    }
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";

  const labelClass = "block text-sm font-medium text-[var(--color-text-primary)] mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Company Name */}
      <div>
        <label className={labelClass}>Company Name *</label>
        <input
          type="text"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
          placeholder="Your company name"
          className={inputClass}
          required
        />
      </div>

      {/* Logo URL */}
      <div>
        <label className={labelClass}>Logo URL</label>
        <input
          type="url"
          value={form.logo_url}
          onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
          placeholder="https://..."
          className={inputClass}
        />
        {form.logo_url && (
          <div className="mt-2">
            <img
              src={form.logo_url}
              alt="Logo preview"
              className="w-16 h-16 object-contain rounded-lg border border-[var(--color-border)]"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </div>

      {/* Website */}
      <div>
        <label className={labelClass}>Website</label>
        <input
          type="url"
          value={form.website}
          onChange={(e) => setForm({ ...form, website: e.target.value })}
          placeholder="https://yourcompany.com"
          className={inputClass}
        />
      </div>

      {/* Industries */}
      <div>
        <label className={labelClass}>Industries</label>
        <p className="text-sm text-[var(--color-text-secondary)] mb-3">
          Select all that apply to help creators find you
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {INDUSTRY_OPTIONS.map((industry) => (
            <button
              key={industry}
              type="button"
              onClick={() => handleIndustryToggle(industry)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                form.industry.includes(industry)
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] hover:text-[var(--color-text-primary)] border border-[var(--color-border)]"
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
        {form.industry.length > 0 && (
          <p className="text-sm text-[var(--color-text-tertiary)] mt-2">
            {form.industry.length} industr{form.industry.length === 1 ? "y" : "ies"} selected
          </p>
        )}
      </div>

      {/* Bio */}
      <div>
        <label className={labelClass}>About Your Brand</label>
        <textarea
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          placeholder="Tell creators what your brand is about and what kind of partnerships you're looking for..."
          rows={4}
          className={inputClass}
        />
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-[var(--color-accent)] text-white font-semibold py-3 px-8 rounded-full hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>

        {message && (
          <span
            className={`text-sm ${
              message.includes("Error") ? "text-red-500" : "text-green-500"
            }`}
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}

