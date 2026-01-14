"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const NICHES = [
  "Lifestyle", "Tech", "Fitness", "Beauty", "Fashion", "Food",
  "Travel", "Gaming", "Finance", "Education", "Entertainment",
  "Music", "Sports", "Parenting", "Pets", "Health", "DIY", "Art"
];

interface CreatorProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  niche: string[] | null;
  location: string | null;
  contact_email: string | null;
  profile_photo_url: string | null;
  youtube_channel_id: string | null;
  youtube_subscribers: number | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  instagram_handle: string | null;
  instagram_followers: number | null;
  rate_youtube_integration: number | null;
  rate_youtube_dedicated: number | null;
  rate_tiktok_post: number | null;
  rate_instagram_post: number | null;
  rate_instagram_story: number | null;
  rate_instagram_reel: number | null;
  media_kit_url: string | null;
  open_to_collaborations: boolean;
  past_brands: string[] | null;
}

export default function CreatorProfileForm({ profile }: { profile: CreatorProfile }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("basic");

  const [form, setForm] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    niche: profile.niche || [],
    location: profile.location || "",
    contact_email: profile.contact_email || "",
    profile_photo_url: profile.profile_photo_url || "",
    tiktok_handle: profile.tiktok_handle || "",
    tiktok_followers: profile.tiktok_followers || "",
    instagram_handle: profile.instagram_handle || "",
    instagram_followers: profile.instagram_followers || "",
    rate_youtube_integration: profile.rate_youtube_integration || "",
    rate_youtube_dedicated: profile.rate_youtube_dedicated || "",
    rate_tiktok_post: profile.rate_tiktok_post || "",
    rate_instagram_post: profile.rate_instagram_post || "",
    rate_instagram_story: profile.rate_instagram_story || "",
    rate_instagram_reel: profile.rate_instagram_reel || "",
    media_kit_url: profile.media_kit_url || "",
    open_to_collaborations: profile.open_to_collaborations ?? true,
    past_brands: profile.past_brands?.join(", ") || "",
  });

  const toggleNiche = (niche: string) => {
    setForm((prev) => ({
      ...prev,
      niche: prev.niche.includes(niche)
        ? prev.niche.filter((n) => n !== niche)
        : [...prev.niche, niche],
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const updateData = {
      display_name: form.display_name || null,
      bio: form.bio || null,
      niche: form.niche.length > 0 ? form.niche : null,
      location: form.location || null,
      contact_email: form.contact_email || null,
      profile_photo_url: form.profile_photo_url || null,
      tiktok_handle: form.tiktok_handle || null,
      tiktok_followers: form.tiktok_followers ? parseInt(form.tiktok_followers.toString()) : null,
      instagram_handle: form.instagram_handle || null,
      instagram_followers: form.instagram_followers ? parseInt(form.instagram_followers.toString()) : null,
      rate_youtube_integration: form.rate_youtube_integration ? parseInt(form.rate_youtube_integration.toString()) : null,
      rate_youtube_dedicated: form.rate_youtube_dedicated ? parseInt(form.rate_youtube_dedicated.toString()) : null,
      rate_tiktok_post: form.rate_tiktok_post ? parseInt(form.rate_tiktok_post.toString()) : null,
      rate_instagram_post: form.rate_instagram_post ? parseInt(form.rate_instagram_post.toString()) : null,
      rate_instagram_story: form.rate_instagram_story ? parseInt(form.rate_instagram_story.toString()) : null,
      rate_instagram_reel: form.rate_instagram_reel ? parseInt(form.rate_instagram_reel.toString()) : null,
      media_kit_url: form.media_kit_url || null,
      open_to_collaborations: form.open_to_collaborations,
      past_brands: form.past_brands ? form.past_brands.split(",").map((b) => b.trim()).filter(Boolean) : null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("creator_profiles")
      .update(updateData)
      .eq("id", profile.id);

    if (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile: " + error.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }

    setSaving(false);
    router.refresh();
  };

  const inputClass =
    "w-full px-4 py-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent";

  const sections = [
    { id: "basic", label: "Basic Info", icon: "👤" },
    { id: "social", label: "Social Media", icon: "📱" },
    { id: "rates", label: "Rates", icon: "💰" },
    { id: "brand", label: "Brand Work", icon: "🤝" },
  ];

  return (
    <div>
      {/* Section Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? "bg-[var(--color-accent)] text-white"
                : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
            }`}
          >
            <span>{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        {/* Basic Info Section */}
        {activeSection === "basic" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Basic Information
            </h2>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={form.display_name}
                onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                placeholder="Your creator name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Bio
              </label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell brands about yourself, your content style, and what makes you unique..."
                rows={4}
                className={inputClass}
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {form.bio.length}/500 characters • Include keywords brands might search for
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Profile Photo URL
              </label>
              <input
                type="url"
                value={form.profile_photo_url}
                onChange={(e) => setForm({ ...form, profile_photo_url: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                placeholder="City, Country"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Contact Email (for brand inquiries)
              </label>
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="business@email.com"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                Content Niches
              </label>
              <div className="flex flex-wrap gap-2">
                {NICHES.map((niche) => (
                  <button
                    key={niche}
                    type="button"
                    onClick={() => toggleNiche(niche)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      form.niche.includes(niche)
                        ? "bg-[var(--color-accent)] text-white"
                        : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                    }`}
                  >
                    {niche}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Media Section */}
        {activeSection === "social" && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Social Media Profiles
            </h2>

            {/* YouTube - Connected via OAuth */}
            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🎬</span>
                  <div>
                    <p className="font-medium text-[var(--color-text-primary)]">YouTube</p>
                    {profile.youtube_channel_id ? (
                      <p className="text-sm text-[var(--color-accent)]">
                        ✓ Connected • {profile.youtube_subscribers?.toLocaleString()} subscribers
                      </p>
                    ) : (
                      <p className="text-sm text-[var(--color-text-tertiary)]">
                        Not connected
                      </p>
                    )}
                  </div>
                </div>
                {!profile.youtube_channel_id && (
                  <a
                    href="/api/auth/youtube"
                    className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                  >
                    Connect YouTube
                  </a>
                )}
              </div>
            </div>

            {/* TikTok */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <span className="mr-2">📱</span>TikTok Handle
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={form.tiktok_handle}
                  onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })}
                  placeholder="@username"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  value={form.tiktok_followers}
                  onChange={(e) => setForm({ ...form, tiktok_followers: e.target.value })}
                  placeholder="Followers"
                  className={`${inputClass} w-32`}
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <span className="mr-2">📸</span>Instagram Handle
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={form.instagram_handle}
                  onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                  placeholder="@username"
                  className={`${inputClass} flex-1`}
                />
                <input
                  type="number"
                  value={form.instagram_followers}
                  onChange={(e) => setForm({ ...form, instagram_followers: e.target.value })}
                  placeholder="Followers"
                  className={`${inputClass} w-32`}
                />
              </div>
            </div>
          </div>
        )}

        {/* Rates Section */}
        {activeSection === "rates" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Your Rates
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Publishing rates shows brands you're professional and saves time for everyone.
                These are starting points - you can always negotiate.
              </p>
            </div>

            {/* Open to Collaborations Toggle */}
            <div className="flex items-center justify-between p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">
                  Open to Brand Collaborations
                </p>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Let brands know you're accepting new partnerships
                </p>
              </div>
              <button
                onClick={() => setForm({ ...form, open_to_collaborations: !form.open_to_collaborations })}
                className={`relative w-14 h-7 rounded-full transition-colors ${
                  form.open_to_collaborations ? "bg-[var(--color-accent)]" : "bg-[var(--color-border-strong)]"
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    form.open_to_collaborations ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* YouTube Rates */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <span>🎬</span> YouTube Rates
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">
                    Integration (30-60 sec mention)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                    <input
                      type="number"
                      value={form.rate_youtube_integration}
                      onChange={(e) => setForm({ ...form, rate_youtube_integration: e.target.value })}
                      placeholder="500"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">
                    Dedicated Video
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                    <input
                      type="number"
                      value={form.rate_youtube_dedicated}
                      onChange={(e) => setForm({ ...form, rate_youtube_dedicated: e.target.value })}
                      placeholder="2000"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* TikTok Rates */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <span>📱</span> TikTok Rates
              </h3>
              <div>
                <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">
                  Sponsored Post
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                  <input
                    type="number"
                    value={form.rate_tiktok_post}
                    onChange={(e) => setForm({ ...form, rate_tiktok_post: e.target.value })}
                    placeholder="300"
                    className={`${inputClass} pl-8`}
                  />
                </div>
              </div>
            </div>

            {/* Instagram Rates */}
            <div>
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <span>📸</span> Instagram Rates
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">
                    Feed Post
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                    <input
                      type="number"
                      value={form.rate_instagram_post}
                      onChange={(e) => setForm({ ...form, rate_instagram_post: e.target.value })}
                      placeholder="200"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">
                    Story
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                    <input
                      type="number"
                      value={form.rate_instagram_story}
                      onChange={(e) => setForm({ ...form, rate_instagram_story: e.target.value })}
                      placeholder="100"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-[var(--color-text-tertiary)] mb-1">
                    Reel
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                    <input
                      type="number"
                      value={form.rate_instagram_reel}
                      onChange={(e) => setForm({ ...form, rate_instagram_reel: e.target.value })}
                      placeholder="400"
                      className={`${inputClass} pl-8`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Card Tips */}
            <div className="p-4 bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-lg">
              <p className="text-sm text-[var(--color-accent)] font-medium mb-2">💡 Pricing Tips</p>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                <li>• A common formula: $10-25 per 1,000 followers</li>
                <li>• Dedicated videos typically cost 2-4x integrations</li>
                <li>• Higher engagement rates justify higher prices</li>
                <li>• You can always negotiate based on the brand/campaign</li>
              </ul>
            </div>
          </div>
        )}

        {/* Brand Work Section */}
        {activeSection === "brand" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Brand Experience
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">
                Showcase your experience to attract more brand deals
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Media Kit URL
              </label>
              <input
                type="url"
                value={form.media_kit_url}
                onChange={(e) => setForm({ ...form, media_kit_url: e.target.value })}
                placeholder="https://drive.google.com/... or https://notion.so/..."
                className={inputClass}
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Link to your media kit (PDF, Notion, Google Doc, etc.)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Past Brand Collaborations
              </label>
              <input
                type="text"
                value={form.past_brands}
                onChange={(e) => setForm({ ...form, past_brands: e.target.value })}
                placeholder="Nike, Samsung, HelloFresh (comma separated)"
                className={inputClass}
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Brands you've worked with before (helps build credibility)
              </p>
            </div>

            {/* Media Kit Tips */}
            <div className="p-4 bg-[var(--color-bg-tertiary)] rounded-lg">
              <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                📋 What to include in your Media Kit:
              </p>
              <ul className="text-sm text-[var(--color-text-secondary)] space-y-1">
                <li>• Your bio and content focus</li>
                <li>• Follower counts and demographics</li>
                <li>• Engagement rates</li>
                <li>• Examples of past brand work</li>
                <li>• Your rates and packages</li>
                <li>• Contact information</li>
              </ul>
            </div>

            {/* No media kit yet? */}
            {!form.media_kit_url && (
              <div className="p-4 bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-lg">
                <p className="text-sm text-[var(--color-accent)]">
                  <strong>Don't have a media kit yet?</strong> Even a simple one-page PDF with your stats and rates can help you land more deals. 
                  Try <a href="https://www.canva.com/templates/s/media-kit/" target="_blank" rel="noopener noreferrer" className="underline">Canva's free templates</a> to get started!
                </p>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex items-center justify-between">
          <div>
            {saved && (
              <span className="text-sm text-[var(--color-accent)] font-medium">
                ✓ Changes saved!
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
