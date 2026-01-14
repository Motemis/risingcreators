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
  "DIY & Crafts",
  "Automotive",
  "Health & Wellness",
];

const PLATFORM_OPTIONS = [
  { id: "youtube", label: "YouTube", icon: "📺" },
  { id: "tiktok", label: "TikTok", icon: "🎵" },
  { id: "instagram", label: "Instagram", icon: "📸" },
  { id: "twitter", label: "Twitter/X", icon: "🐦" },
];

export default function CreatorOnboardingForm({
  userId,
  email,
  firstName,
  lastName,
}: {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    display_name: `${firstName} ${lastName}`.trim() || "",
    bio: "",
    location: "",
    niches: [] as string[],
    primary_platform: "",
    youtube_url: "",
    youtube_subscribers: "",
    tiktok_handle: "",
    tiktok_followers: "",
    instagram_handle: "",
    instagram_followers: "",
    contact_email: email,
  });

  const handleNicheToggle = (niche: string) => {
    setForm((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : prev.niches.length < 3
        ? [...prev.niches, niche]
        : prev.niches,
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const { error: insertError } = await supabase.from("creator_profiles").insert({
        user_id: userId,
        display_name: form.display_name || null,
        bio: form.bio || null,
        location: form.location || null,
        niche: form.niches.length > 0 ? form.niches : null,
        primary_platform: form.primary_platform || null,
        youtube_url: form.youtube_url || null,
        youtube_subscribers: form.youtube_subscribers ? parseInt(form.youtube_subscribers) : null,
        tiktok_handle: form.tiktok_handle || null,
        tiktok_followers: form.tiktok_followers ? parseInt(form.tiktok_followers) : null,
        instagram_handle: form.instagram_handle || null,
        instagram_followers: form.instagram_followers ? parseInt(form.instagram_followers) : null,
        contact_email: form.contact_email || null,
        is_public: true,
      });

      if (insertError) {
        throw insertError;
      }

      // Redirect to creator dashboard
      window.location.href = "/dashboard/creator";
    } catch (err: any) {
      setError(err.message || "Failed to create profile");
      setLoading(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl p-8">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`w-3 h-3 rounded-full transition-colors ${
              s === step
                ? "bg-[var(--color-accent)]"
                : s < step
                ? "bg-[var(--color-accent)]/50"
                : "bg-[var(--color-border)]"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] text-center">
            Tell us about yourself
          </h2>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Display Name *
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => setForm({ ...form, display_name: e.target.value })}
              placeholder="How brands will see you"
              className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Bio
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              placeholder="Tell brands what makes your content unique"
              rows={3}
              className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Location
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="City, Country"
              className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Contact Email
            </label>
            <input
              type="email"
              value={form.contact_email}
              onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              placeholder="Where brands can reach you"
              className="w-full px-4 py-3 bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
            />
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!form.display_name}
            className="w-full bg-[var(--color-accent)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Niches */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] text-center">
            What's your niche?
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Select up to 3 categories that best describe your content
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NICHE_OPTIONS.map((niche) => (
              <button
                key={niche}
                onClick={() => handleNicheToggle(niche)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  form.niches.includes(niche)
                    ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                    : "bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]"
                }`}
              >
                {niche}
              </button>
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className="flex-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold py-3 px-6 rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={form.niches.length === 0}
              className="flex-1 bg-[var(--color-accent)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Social Platforms */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] text-center">
            Connect your platforms
          </h2>
          <p className="text-sm text-[var(--color-text-secondary)] text-center">
            Add at least one platform so brands can verify your reach
          </p>

          {/* Primary Platform */}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Primary Platform
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setForm({ ...form, primary_platform: platform.id })}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                    form.primary_platform === platform.id
                      ? "bg-[var(--color-accent)] text-white border-[var(--color-accent)]"
                      : "bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-accent)]"
                  }`}
                >
                  <span>{platform.icon}</span>
                  {platform.label}
                </button>
              ))}
            </div>
          </div>

          {/* YouTube */}
          <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-3">
              <span>📺</span>
              <span className="font-medium text-[var(--color-text-primary)]">YouTube</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.youtube_url}
                onChange={(e) => setForm({ ...form, youtube_url: e.target.value })}
                placeholder="Channel URL"
                className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <input
                type="number"
                value={form.youtube_subscribers}
                onChange={(e) => setForm({ ...form, youtube_subscribers: e.target.value })}
                placeholder="Subscribers"
                className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* TikTok */}
          <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-3">
              <span>🎵</span>
              <span className="font-medium text-[var(--color-text-primary)]">TikTok</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.tiktok_handle}
                onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })}
                placeholder="@username"
                className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <input
                type="number"
                value={form.tiktok_followers}
                onChange={(e) => setForm({ ...form, tiktok_followers: e.target.value })}
                placeholder="Followers"
                className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="p-4 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-3">
              <span>📸</span>
              <span className="font-medium text-[var(--color-text-primary)]">Instagram</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                value={form.instagram_handle}
                onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                placeholder="@username"
                className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <input
                type="number"
                value={form.instagram_followers}
                onChange={(e) => setForm({ ...form, instagram_followers: e.target.value })}
                placeholder="Followers"
                className="px-3 py-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className="flex-1 bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] font-semibold py-3 px-6 rounded-lg hover:bg-[var(--color-border)] transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-[var(--color-accent)] text-white font-semibold py-3 px-6 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors disabled:opacity-50"
            >
              {loading ? "Creating Profile..." : "Complete Setup"}
            </button>
          </div>

          <p className="text-xs text-[var(--color-text-tertiary)] text-center">
            You can always add more details later from your profile settings
          </p>
        </div>
      )}
    </div>
  );
}
