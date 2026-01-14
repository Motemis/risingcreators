"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { NICHE_CATEGORIES, getNicheLabel } from "@/lib/niches";
import ImageUploader from "@/components/ImageUploader";
import { getIndustryRates, calculateFallbackRates, CreatorRates } from "@/lib/rateBenchmarks";

interface CreatorProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  niche: string[] | null;
  location: string | null;
  contact_email: string | null;
  profile_photo_url: string | null;
  header_image_url: string | null;
  youtube_channel_id: string | null;
  youtube_handle: string | null;
  youtube_subscribers: number | null;
  youtube_profile_image_url: string | null;
  tiktok_handle: string | null;
  tiktok_followers: number | null;
  instagram_handle: string | null;
  instagram_followers: number | null;
  twitch_handle: string | null;
  twitch_followers: number | null;
  rate_youtube_integration: number | null;
  rate_youtube_dedicated: number | null;
  rate_tiktok_post: number | null;
  rate_instagram_post: number | null;
  rate_instagram_story: number | null;
  rate_instagram_reel: number | null;
  media_kit_url: string | null;
  open_to_collaborations: boolean;
  past_brands: string[] | null;
  featured_content: any[] | null;
}

interface FeaturedVideo {
  id: string;
  title: string;
  thumbnail: string;
  views: number;
  url: string;
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

const DEFAULT_HEADERS = [
  "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=300&fit=crop",
  "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=300&fit=crop",
  "https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=300&fit=crop",
  "https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=300&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=300&fit=crop",
];

export default function CreatorProfileEditor({ profile }: { profile: CreatorProfile }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showHeaderPicker, setShowHeaderPicker] = useState(false);
  const [customNiche, setCustomNiche] = useState("");
  const [showCustomNicheInput, setShowCustomNicheInput] = useState(false);
  const [industryRates, setIndustryRates] = useState<CreatorRates>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const headerInputRef = useRef<HTMLInputElement>(null);

  // Show success message if YouTube just connected
  useEffect(() => {
    if (searchParams.get("youtube") === "connected") {
      alert("YouTube connected successfully!");
      router.replace("/dashboard/creator/profile");
    }
  }, [searchParams, router]);

  const [form, setForm] = useState({
    display_name: profile.display_name || "",
    bio: profile.bio || "",
    niche: profile.niche || [],
    location: profile.location || "",
    contact_email: profile.contact_email || "",
    profile_photo_url: profile.profile_photo_url || profile.youtube_profile_image_url || "",
    header_image_url: profile.header_image_url || DEFAULT_HEADERS[0],
    tiktok_handle: profile.tiktok_handle || "",
    tiktok_followers: profile.tiktok_followers || "",
    instagram_handle: profile.instagram_handle || "",
    instagram_followers: profile.instagram_followers || "",
    twitch_handle: profile.twitch_handle || "",
    twitch_followers: profile.twitch_followers || "",
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

  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  // Calculate total followers
  const totalFollowers =
    (profile.youtube_subscribers || 0) +
    (parseInt(form.tiktok_followers?.toString() || "0") || 0) +
    (parseInt(form.instagram_followers?.toString() || "0") || 0) +
    (parseInt(form.twitch_followers?.toString() || "0") || 0);

  // Calculate suggested rates based on followers
  const suggestedRates = {
    youtube_integration: Math.max(100, Math.round(totalFollowers * 0.015)),
    youtube_dedicated: Math.max(300, Math.round(totalFollowers * 0.04)),
    tiktok_post: Math.max(50, Math.round(totalFollowers * 0.01)),
    instagram_post: Math.max(50, Math.round(totalFollowers * 0.01)),
    instagram_story: Math.max(25, Math.round(totalFollowers * 0.005)),
    instagram_reel: Math.max(75, Math.round(totalFollowers * 0.015)),
  };

  // Load industry rates on mount and when followers change
  useEffect(() => {
    const loadRates = async () => {
      try {
        const rates = await getIndustryRates(
          profile.youtube_subscribers || 0,
          parseInt(form.tiktok_followers?.toString() || "0"),
          parseInt(form.instagram_followers?.toString() || "0"),
          parseInt(form.twitch_followers?.toString() || "0")
        );
        // If no database rates, use fallback
        if (Object.keys(rates).length === 0) {
          const fallbackRates = calculateFallbackRates(
            profile.youtube_subscribers || 0,
            parseInt(form.tiktok_followers?.toString() || "0"),
            parseInt(form.instagram_followers?.toString() || "0"),
            parseInt(form.twitch_followers?.toString() || "0")
          );
          setIndustryRates(fallbackRates);
        } else {
          setIndustryRates(rates);
        }
      } catch (err) {
        // Use fallback if error
        const fallbackRates = calculateFallbackRates(
          profile.youtube_subscribers || 0,
          parseInt(form.tiktok_followers?.toString() || "0"),
          parseInt(form.instagram_followers?.toString() || "0"),
          parseInt(form.twitch_followers?.toString() || "0")
        );
        setIndustryRates(fallbackRates);
      }
    };
    loadRates();
  }, [profile.youtube_subscribers, form.tiktok_followers, form.instagram_followers, form.twitch_followers]);

  const toggleCategory = (categoryValue: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryValue)
        ? prev.filter((c) => c !== categoryValue)
        : [...prev, categoryValue]
    );
  };

  const toggleNiche = (niche: string, isSubNiche: boolean = false, parentCategory?: string) => {
    setForm((prev) => {
      let newNiches = [...prev.niche];

      if (newNiches.includes(niche)) {
        newNiches = newNiches.filter((n) => n !== niche);
        if (!isSubNiche) {
          const category = NICHE_CATEGORIES.find((c) => c.value === niche);
          if (category?.subNiches) {
            const subNicheValues = category.subNiches.map((s) => s.value);
            newNiches = newNiches.filter((n) => !subNicheValues.includes(n));
          }
        }
      } else {
        newNiches.push(niche);
        if (isSubNiche && parentCategory && !newNiches.includes(parentCategory)) {
          newNiches.push(parentCategory);
        }
        if (!isSubNiche && !expandedCategories.includes(niche)) {
          setExpandedCategories((prev) => [...prev, niche]);
        }
      }

      return { ...prev, niche: newNiches };
    });
  };

  const addCustomNiche = () => {
    if (customNiche.trim()) {
      const customValue = `custom:${customNiche.trim()}`;
      if (!form.niche.includes(customValue)) {
        setForm((prev) => ({
          ...prev,
          niche: [...prev.niche, customValue],
        }));
      }
      setCustomNiche("");
      setShowCustomNicheInput(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    // Only include fields that exist in the database
    const updateData: any = {
      display_name: form.display_name || null,
      bio: form.bio || null,
      niche: form.niche.length > 0 ? form.niche : null,
      location: form.location || null,
      contact_email: form.contact_email || null,
      profile_photo_url: form.profile_photo_url || null,
      tiktok_handle: form.tiktok_handle || null,
      tiktok_followers: form.tiktok_followers ? parseInt(form.tiktok_followers.toString()) : null,
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
      setEditingSection(null);
    }

    setSaving(false);
    router.refresh();
  };

  const inputClass =
    "w-full px-4 py-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent text-sm";

  const profileImage = form.profile_photo_url || profile.youtube_profile_image_url;

  // Mock featured content (in production, this would come from YouTube API)
  const featuredContent: FeaturedVideo[] = profile.featured_content || [];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
        {/* Banner with edit option */}
        <div className="relative h-32 group">
          <img
            src={form.header_image_url || DEFAULT_HEADERS[0]}
            alt="Header"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <ImageUploader
                bucket="headers"
                currentUrl={form.header_image_url}
                onUpload={(url) => {
                  setForm({ ...form, header_image_url: url });
                  setTimeout(handleSave, 100);
                }}
                aspectRatio={4}
                cropShape="rect"
                maxWidth={1200}
                maxHeight={300}
                label="📷 Change Header"
              />
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-12 mb-4">
            {/* Profile Photo */}
            <div className="relative group">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt={form.display_name || "Profile"}
                  className="w-24 h-24 rounded-full border-4 border-[var(--color-bg-secondary)] object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-[var(--color-bg-secondary)] bg-[var(--color-bg-tertiary)] flex items-center justify-center text-3xl">
                  👤
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <ImageUploader
                  bucket="avatars"
                  currentUrl={form.profile_photo_url}
                  onUpload={(url) => {
                    setForm({ ...form, profile_photo_url: url });
                    setTimeout(handleSave, 100);
                  }}
                  aspectRatio={1}
                  cropShape="round"
                  maxWidth={400}
                  maxHeight={400}
                  label="📷"
                />
              </div>
            </div>

            <div className="flex-1 pb-2">
              {editingSection === "name" ? (
                <input
                  type="text"
                  value={form.display_name}
                  onChange={(e) => setForm({ ...form, display_name: e.target.value })}
                  onBlur={handleSave}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Your name"
                  className={`${inputClass} text-xl font-bold`}
                  autoFocus
                />
              ) : (
                <h2
                  onClick={() => setEditingSection("name")}
                  className="text-xl font-bold text-[var(--color-text-primary)] cursor-pointer hover:text-[var(--color-accent)]"
                >
                  {form.display_name || "Click to add name"}
                </h2>
              )}

              {editingSection === "location" ? (
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  onBlur={handleSave}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="City, Country"
                  className={`${inputClass} mt-1`}
                  autoFocus
                />
              ) : (
                <p
                  onClick={() => setEditingSection("location")}
                  className="text-sm text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-accent)]"
                >
                  📍 {form.location || "Add location"}
                </p>
              )}
            </div>

            {/* Open to Collaborations Badge */}
            <button
              onClick={() => {
                setForm({ ...form, open_to_collaborations: !form.open_to_collaborations });
                setTimeout(handleSave, 100);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                form.open_to_collaborations
                  ? "bg-[var(--color-accent-light)] text-[var(--color-accent)] border border-[var(--color-accent)]"
                  : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] border border-[var(--color-border)]"
              }`}
            >
              {form.open_to_collaborations ? "✓ Open to Collabs" : "Not Available"}
            </button>
          </div>

          {/* Bio */}
          {editingSection === "bio" ? (
            <div>
              <textarea
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                placeholder="Tell brands about yourself..."
                rows={3}
                className={inputClass}
                autoFocus
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  {form.bio.length}/500 characters
                </span>
                <button onClick={handleSave} className="text-sm text-[var(--color-accent)] hover:underline">
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p
              onClick={() => setEditingSection("bio")}
              className="text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-text-primary)] whitespace-pre-wrap"
            >
              {form.bio || "Click to add a bio..."}
            </p>
          )}

          {/* Contact Email */}
          <div className="mt-3">
            {editingSection === "email" ? (
              <input
                type="email"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                placeholder="business@email.com"
                className={inputClass}
                autoFocus
              />
            ) : (
              <p
                onClick={() => setEditingSection("email")}
                className="text-sm text-[var(--color-text-secondary)] cursor-pointer hover:text-[var(--color-accent)]"
              >
                ✉️ {form.contact_email || "Add contact email"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-5 gap-4">
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">{formatNumber(totalFollowers)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Total</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{formatNumber(profile.youtube_subscribers || 0)}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">YouTube</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-[#00f2ea]">{formatNumber(parseInt(form.tiktok_followers?.toString() || "0"))}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">TikTok</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-pink-500">{formatNumber(parseInt(form.instagram_followers?.toString() || "0"))}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Instagram</p>
        </div>
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-purple-500">{formatNumber(parseInt(form.twitch_followers?.toString() || "0"))}</p>
          <p className="text-xs text-[var(--color-text-tertiary)]">Twitch</p>
        </div>
      </div>

      {/* Featured Content */}
      {(profile.youtube_channel_id || featuredContent.length > 0) && (
        <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
          <h3 className="font-semibold text-[var(--color-text-primary)] mb-4">Featured Content</h3>
          {featuredContent.length > 0 ? (
            <div className="grid grid-cols-3 gap-4">
              {featuredContent.slice(0, 6).map((video: FeaturedVideo) => (
                <a
                  key={video.id}
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group"
                >
                  <div className="relative aspect-video rounded-lg overflow-hidden mb-2">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2">
                    {video.title}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {formatNumber(video.views)} views
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[var(--color-text-tertiary)]">
              <p className="mb-2">No featured content yet</p>
              <p className="text-sm">Connect your YouTube to automatically showcase your best videos</p>
            </div>
          )}
        </div>
      )}

      {/* Content Niches */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Content Niches</h3>
          <button
            onClick={() => setEditingSection(editingSection === "niches" ? null : "niches")}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {editingSection === "niches" ? "Done" : "Edit"}
          </button>
        </div>

        {editingSection === "niches" ? (
          <div className="space-y-2">
            {NICHE_CATEGORIES.map((category) => {
              const isSelected = form.niche.includes(category.value);
              const isExpanded = expandedCategories.includes(category.value);
              const selectedSubNiches = category.subNiches?.filter((s) => form.niche.includes(s.value));

              return (
                <div key={category.value} className="border border-[var(--color-border)] rounded-lg overflow-hidden">
                  <button
                    onClick={() => {
                      if (category.value === "other") {
                        setShowCustomNicheInput(true);
                      } else {
                        toggleNiche(category.value);
                        if (!isSelected) toggleCategory(category.value);
                      }
                    }}
                    className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                      isSelected ? "bg-[var(--color-accent)]/10" : "hover:bg-[var(--color-bg-tertiary)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className={`font-medium ${isSelected ? "text-[var(--color-accent)]" : "text-[var(--color-text-primary)]"}`}>
                        {category.label}
                      </span>
                      {selectedSubNiches && selectedSubNiches.length > 0 && (
                        <span className="text-xs text-[var(--color-text-tertiary)]">({selectedSubNiches.length} selected)</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {isSelected && <span className="text-[var(--color-accent)]">✓</span>}
                      {category.subNiches && category.subNiches.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategory(category.value);
                          }}
                          className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                        >
                          {isExpanded ? "▼" : "▶"}
                        </button>
                      )}
                    </div>
                  </button>

                  {isExpanded && category.subNiches && category.subNiches.length > 0 && (
                    <div className="p-3 pt-0 border-t border-[var(--color-border)] bg-[var(--color-bg-tertiary)]">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {category.subNiches.map((sub) => (
                          <button
                            key={sub.value}
                            onClick={() => toggleNiche(sub.value, true, category.value)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              form.niche.includes(sub.value)
                                ? "bg-[var(--color-accent)] text-white"
                                : "bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-light)]"
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Custom Niche Input */}
            {showCustomNicheInput && (
              <div className="p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-bg-tertiary)]">
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">Add a custom niche:</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customNiche}
                    onChange={(e) => setCustomNiche(e.target.value)}
                    placeholder="e.g., Underwater Photography"
                    className={`${inputClass} flex-1`}
                    onKeyDown={(e) => e.key === "Enter" && addCustomNiche()}
                    autoFocus
                  />
                  <button
                    onClick={addCustomNiche}
                    className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowCustomNicheInput(false)}
                    className="px-4 py-2 text-[var(--color-text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Custom niches display */}
            {form.niche.filter((n) => n.startsWith("custom:")).length > 0 && (
              <div className="p-3 border border-[var(--color-border)] rounded-lg">
                <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Custom niches:</p>
                <div className="flex flex-wrap gap-2">
                  {form.niche
                    .filter((n) => n.startsWith("custom:"))
                    .map((niche) => (
                      <span
                        key={niche}
                        className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-500 flex items-center gap-1"
                      >
                        {niche.replace("custom:", "")}
                        <button
                          onClick={() => setForm({ ...form, niche: form.niche.filter((n) => n !== niche) })}
                          className="hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full mt-4 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Niches"}
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {form.niche.length > 0 ? (
              form.niche.map((niche) => (
                <span
                  key={niche}
                  className={`px-3 py-1 rounded-full text-sm ${
                    niche.startsWith("custom:")
                      ? "bg-purple-500/10 text-purple-500"
                      : "bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                  }`}
                >
                  {getNicheLabel(niche)}
                </span>
              ))
            ) : (
              <p className="text-[var(--color-text-tertiary)]">No niches selected</p>
            )}
          </div>
        )}
      </div>

      {/* Social Media Accounts */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Social Media</h3>
          <button
            onClick={() => setEditingSection(editingSection === "social" ? null : "social")}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {editingSection === "social" ? "Done" : "Edit"}
          </button>
        </div>

        <div className="space-y-4">
          {/* YouTube */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎬</span>
              <div>
                <p className="font-medium text-[var(--color-text-primary)]">YouTube</p>
                {profile.youtube_channel_id ? (
                  <p className="text-sm text-[var(--color-accent)]">
                    @{profile.youtube_handle || "Connected"} • {formatNumber(profile.youtube_subscribers || 0)} subscribers
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">Not connected</p>
                )}
              </div>
            </div>
            {!profile.youtube_channel_id && (
              <a
                href="/api/auth/youtube"
                className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
              >
                Connect
              </a>
            )}
          </div>

          {/* TikTok */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📱</span>
              <div className="flex-1">
                <p className="font-medium text-[var(--color-text-primary)]">TikTok</p>
                {editingSection === "social" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={form.tiktok_handle}
                      onChange={(e) => setForm({ ...form, tiktok_handle: e.target.value })}
                      placeholder="@username"
                      className={`${inputClass} w-32`}
                    />
                    <input
                      type="number"
                      value={form.tiktok_followers}
                      onChange={(e) => setForm({ ...form, tiktok_followers: e.target.value })}
                      placeholder="Followers"
                      className={`${inputClass} w-28`}
                    />
                  </div>
                ) : form.tiktok_handle ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {form.tiktok_handle} • {formatNumber(parseInt(form.tiktok_followers?.toString() || "0"))} followers
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">Not added</p>
                )}
              </div>
            </div>
          </div>

          {/* Instagram */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📸</span>
              <div className="flex-1">
                <p className="font-medium text-[var(--color-text-primary)]">Instagram</p>
                {editingSection === "social" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={form.instagram_handle}
                      onChange={(e) => setForm({ ...form, instagram_handle: e.target.value })}
                      placeholder="@username"
                      className={`${inputClass} w-32`}
                    />
                    <input
                      type="number"
                      value={form.instagram_followers}
                      onChange={(e) => setForm({ ...form, instagram_followers: e.target.value })}
                      placeholder="Followers"
                      className={`${inputClass} w-28`}
                    />
                  </div>
                ) : form.instagram_handle ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {form.instagram_handle} • {formatNumber(parseInt(form.instagram_followers?.toString() || "0"))} followers
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">Not added</p>
                )}
              </div>
            </div>
          </div>

          {/* Twitch */}
          <div className="flex items-center justify-between p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎮</span>
              <div className="flex-1">
                <p className="font-medium text-[var(--color-text-primary)]">Twitch</p>
                {editingSection === "social" ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={form.twitch_handle}
                      onChange={(e) => setForm({ ...form, twitch_handle: e.target.value })}
                      placeholder="username"
                      className={`${inputClass} w-32`}
                    />
                    <input
                      type="number"
                      value={form.twitch_followers}
                      onChange={(e) => setForm({ ...form, twitch_followers: e.target.value })}
                      placeholder="Followers"
                      className={`${inputClass} w-28`}
                    />
                  </div>
                ) : form.twitch_handle ? (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {form.twitch_handle} • {formatNumber(parseInt(form.twitch_followers?.toString() || "0"))} followers
                  </p>
                ) : (
                  <p className="text-sm text-[var(--color-text-tertiary)]">Not added</p>
                )}
              </div>
            </div>
          </div>

          {editingSection === "social" && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}
        </div>
      </div>

      {/* Rates */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">My Rates</h3>
          <button
            onClick={() => setEditingSection(editingSection === "rates" ? null : "rates")}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {editingSection === "rates" ? "Done" : "Edit"}
          </button>
        </div>

        {editingSection === "rates" ? (
          <div className="space-y-4">
            {/* Personalized tip with ranges */}
            <div className="p-3 bg-[var(--color-accent-light)] border border-[var(--color-accent)] rounded-lg mb-4">
              <p className="text-sm text-[var(--color-accent)] mb-2">
                💡 <strong>Industry rates for your follower count:</strong>
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                {industryRates.youtube_integration && (
                  <div>
                    YT Integration: ${industryRates.youtube_integration.low} - ${industryRates.youtube_integration.high}
                  </div>
                )}
                {industryRates.youtube_dedicated && (
                  <div>
                    YT Dedicated: ${industryRates.youtube_dedicated.low} - ${industryRates.youtube_dedicated.high}
                  </div>
                )}
                {industryRates.tiktok_post && (
                  <div>
                    TikTok: ${industryRates.tiktok_post.low} - ${industryRates.tiktok_post.high}
                  </div>
                )}
                {industryRates.instagram_post && (
                  <div>
                    IG Post: ${industryRates.instagram_post.low} - ${industryRates.instagram_post.high}
                  </div>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-2">
                Based on industry data and creators with similar audience sizes
              </p>
            </div>

            {/* YouTube Rates */}
            {(profile.youtube_channel_id || profile.youtube_subscribers) && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">🎬 YouTube</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)]">Integration (30-60s)</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                      <input
                        type="number"
                        value={form.rate_youtube_integration}
                        onChange={(e) => setForm({ ...form, rate_youtube_integration: e.target.value })}
                        placeholder={suggestedRates.youtube_integration.toString()}
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)]">Dedicated Video</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                      <input
                        type="number"
                        value={form.rate_youtube_dedicated}
                        onChange={(e) => setForm({ ...form, rate_youtube_dedicated: e.target.value })}
                        placeholder={suggestedRates.youtube_dedicated.toString()}
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TikTok Rate */}
            {(form.tiktok_handle || form.tiktok_followers) && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">📱 TikTok</p>
                <div>
                  <label className="text-xs text-[var(--color-text-tertiary)]">Sponsored Post</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                    <input
                      type="number"
                      value={form.rate_tiktok_post}
                      onChange={(e) => setForm({ ...form, rate_tiktok_post: e.target.value })}
                      placeholder={suggestedRates.tiktok_post.toString()}
                      className={`${inputClass} pl-7`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Instagram Rates */}
            {(form.instagram_handle || form.instagram_followers) && (
              <div>
                <p className="text-sm font-medium text-[var(--color-text-primary)] mb-2">📸 Instagram</p>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)]">Feed Post</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                      <input
                        type="number"
                        value={form.rate_instagram_post}
                        onChange={(e) => setForm({ ...form, rate_instagram_post: e.target.value })}
                        placeholder={suggestedRates.instagram_post.toString()}
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)]">Story</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                      <input
                        type="number"
                        value={form.rate_instagram_story}
                        onChange={(e) => setForm({ ...form, rate_instagram_story: e.target.value })}
                        placeholder={suggestedRates.instagram_story.toString()}
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-[var(--color-text-tertiary)]">Reel</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]">$</span>
                      <input
                        type="number"
                        value={form.rate_instagram_reel}
                        onChange={(e) => setForm({ ...form, rate_instagram_reel: e.target.value })}
                        placeholder={suggestedRates.instagram_reel.toString()}
                        className={`${inputClass} pl-7`}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Rates"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(profile.youtube_channel_id || profile.youtube_subscribers) && (
              <>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">YT Integration</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {form.rate_youtube_integration ? `$${form.rate_youtube_integration}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">YT Dedicated</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {form.rate_youtube_dedicated ? `$${form.rate_youtube_dedicated}` : "—"}
                  </p>
                </div>
              </>
            )}
            {(form.tiktok_handle || form.tiktok_followers) && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">TikTok Post</p>
                <p className="text-lg font-bold text-[var(--color-text-primary)]">
                  {form.rate_tiktok_post ? `$${form.rate_tiktok_post}` : "—"}
                </p>
              </div>
            )}
            {(form.instagram_handle || form.instagram_followers) && (
              <>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">IG Post</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {form.rate_instagram_post ? `$${form.rate_instagram_post}` : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">IG Reel</p>
                  <p className="text-lg font-bold text-[var(--color-text-primary)]">
                    {form.rate_instagram_reel ? `$${form.rate_instagram_reel}` : "—"}
                  </p>
                </div>
              </>
            )}
            {!profile.youtube_channel_id && !form.tiktok_handle && !form.instagram_handle && (
              <p className="text-[var(--color-text-tertiary)] col-span-full">Connect your social accounts to set rates</p>
            )}
          </div>
        )}
      </div>

      {/* Media Kit & Past Work */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[var(--color-text-primary)]">Brand Work</h3>
          <button
            onClick={() => setEditingSection(editingSection === "brand" ? null : "brand")}
            className="text-sm text-[var(--color-accent)] hover:underline"
          >
            {editingSection === "brand" ? "Done" : "Edit"}
          </button>
        </div>

        {editingSection === "brand" ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Media Kit</label>
              <div className="mt-2 space-y-2">
                <ImageUploader
                  bucket="media-kits"
                  currentUrl={form.media_kit_url}
                  onUpload={(url) => {
                    setForm({ ...form, media_kit_url: url });
                  }}
                  aspectRatio={undefined}
                  cropShape="rect"
                  maxWidth={2000}
                  maxHeight={2000}
                  label="📁 Upload Media Kit (PDF/Image)"
                />
                <p className="text-xs text-[var(--color-text-tertiary)] text-center">— or —</p>
                <input
                  type="url"
                  value={form.media_kit_url}
                  onChange={(e) => setForm({ ...form, media_kit_url: e.target.value })}
                  placeholder="https://drive.google.com/... or https://notion.so/..."
                  className={inputClass}
                />
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Don't have one? Try{" "}
                <a
                  href="https://www.canva.com/search/templates?q=media%20kit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  Canva's free templates
                </a>
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--color-text-primary)]">Past Brand Collaborations</label>
              <input
                type="text"
                value={form.past_brands}
                onChange={(e) => setForm({ ...form, past_brands: e.target.value })}
                placeholder="Nike, Samsung, HelloFresh (comma separated)"
                className={`${inputClass} mt-1`}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {form.media_kit_url ? (
              <a
                href={form.media_kit_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[var(--color-accent)] hover:underline"
              >
                📋 View Media Kit →
              </a>
            ) : (
              <p className="text-[var(--color-text-tertiary)]">No media kit added</p>
            )}

            {form.past_brands && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Past collaborations:</p>
                <div className="flex flex-wrap gap-2">
                  {form.past_brands.split(",").map((brand, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-sm bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                    >
                      {brand.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
