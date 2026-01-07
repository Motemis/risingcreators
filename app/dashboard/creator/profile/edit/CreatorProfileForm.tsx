"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const NICHE_OPTIONS = [
  "Lifestyle",
  "Tech",
  "Fitness",
  "Beauty",
  "Fashion",
  "Food",
  "Travel",
  "Gaming",
  "Finance",
  "Education",
  "Entertainment",
  "Music",
  "Sports",
  "Parenting",
  "Pets",
];

interface CreatorProfile {
  id?: string;
  user_id: string;
  display_name: string | null;
  bio: string | null;
  profile_photo_url: string | null;
  location: string | null;
  niche: string[] | null;
  rate_per_post: number | null;
  rate_per_video: number | null;
  rate_per_story: number | null;
  is_public: boolean;
}

export default function CreatorProfileForm({
  userId,
  existingProfile,
}: {
  userId: string;
  existingProfile: CreatorProfile | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    display_name: existingProfile?.display_name || "",
    bio: existingProfile?.bio || "",
    profile_photo_url: existingProfile?.profile_photo_url || "",
    location: existingProfile?.location || "",
    niche: existingProfile?.niche || [],
    rate_per_post: existingProfile?.rate_per_post ? existingProfile.rate_per_post / 100 : "",
    rate_per_video: existingProfile?.rate_per_video ? existingProfile.rate_per_video / 100 : "",
    rate_per_story: existingProfile?.rate_per_story ? existingProfile.rate_per_story / 100 : "",
    is_public: existingProfile?.is_public ?? true,
  });

  const handleNicheToggle = (niche: string) => {
    setForm((prev) => ({
      ...prev,
      niche: prev.niche.includes(niche)
        ? prev.niche.filter((n) => n !== niche)
        : [...prev.niche, niche],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const profileData = {
      user_id: userId,
      display_name: form.display_name || null,
      bio: form.bio || null,
      profile_photo_url: form.profile_photo_url || null,
      location: form.location || null,
      niche: form.niche.length > 0 ? form.niche : null,
      rate_per_post: form.rate_per_post ? Math.round(Number(form.rate_per_post) * 100) : null,
      rate_per_video: form.rate_per_video ? Math.round(Number(form.rate_per_video) * 100) : null,
      rate_per_story: form.rate_per_story ? Math.round(Number(form.rate_per_story) * 100) : null,
      is_public: form.is_public,
      updated_at: new Date().toISOString(),
    };

    let error;

    if (existingProfile) {
      const result = await supabase
        .from("creator_profiles")
        .update(profileData)
        .eq("id", existingProfile.id);
      error = result.error;
    } else {
      const result = await supabase
        .from("creator_profiles")
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
    "w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";
  
  const labelClass = "block text-sm font-medium text-[var(--color-text-primary)] mb-2";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
          Basic Info
        </h2>
        
        <div>
          <label className={labelClass}>Display Name</label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => setForm({ ...form, display_name: e.target.value })}
            placeholder="How brands will see your name"
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Tell brands about yourself and your content..."
            rows={4}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Profile Photo URL</label>
          <input
            type="url"
            value={form.profile_photo_url}
            onChange={(e) => setForm({ ...form, profile_photo_url: e.target.value })}
            placeholder="https://..."
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="City, Country"
            className={inputClass}
          />
        </div>
      </section>

      {/* Niche */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
          Your Niche
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Select all that apply
        </p>
        <div className="flex flex-wrap gap-2">
          {NICHE_OPTIONS.map((niche) => (
            <button
              key={niche}
              type="button"
              onClick={() => handleNicheToggle(niche)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                form.niche.includes(niche)
                  ? "bg-[var(--color-accent)] text-white"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
              }`}
            >
              {niche}
            </button>
          ))}
        </div>
      </section>

      {/* Rates */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
          Your Rates
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Set your starting prices (USD). Leave blank if negotiable.
        </p>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>Per Post ($)</label>
            <input
              type="number"
              value={form.rate_per_post}
              onChange={(e) => setForm({ ...form, rate_per_post: e.target.value })}
              placeholder="50"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Per Video ($)</label>
            <input
              type="number"
              value={form.rate_per_video}
              onChange={(e) => setForm({ ...form, rate_per_video: e.target.value })}
              placeholder="100"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Per Story ($)</label>
            <input
              type="number"
              value={form.rate_per_story}
              onChange={(e) => setForm({ ...form, rate_per_story: e.target.value })}
              placeholder="25"
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* Visibility */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
          Visibility
        </h2>
        
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.is_public}
            onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
            className="w-5 h-5 rounded border-[var(--color-border-strong)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
          />
          <span className="text-[var(--color-text-primary)]">
            Make my profile visible to brands
          </span>
        </label>
      </section>

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
          <span className={`text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>
            {message}
          </span>
        )}
      </div>
    </form>
  );
}