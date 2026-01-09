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
  social_urls: Record<string, string> | null;
  extracted_keywords: string[] | null;
  extracted_topics: string[] | null;
  brand_voice: string | null;
  target_keywords: string[] | null;
  last_analyzed_at: string | null;
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
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    company_name: existingProfile?.company_name || "",
    logo_url: existingProfile?.logo_url || "",
    website: existingProfile?.website || "",
    industry: existingProfile?.industry || [],
    bio: existingProfile?.bio || "",
    social_urls: existingProfile?.social_urls || {
      instagram: "",
      tiktok: "",
      youtube: "",
      linkedin: "",
      twitter: "",
    },
  });

  const [analysis, setAnalysis] = useState({
    keywords: existingProfile?.extracted_keywords || [],
    topics: existingProfile?.extracted_topics || [],
    brandVoice: existingProfile?.brand_voice || "",
    targetKeywords: existingProfile?.target_keywords || [],
    lastAnalyzed: existingProfile?.last_analyzed_at || null,
  });

  const handleIndustryToggle = (industry: string) => {
    setForm((prev) => ({
      ...prev,
      industry: prev.industry.includes(industry)
        ? prev.industry.filter((i) => i !== industry)
        : [...prev.industry, industry],
    }));
  };

  const handleSocialUrlChange = (platform: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      social_urls: {
        ...prev.social_urls,
        [platform]: value,
      },
    }));
  };

  const handleAnalyze = async () => {
    if (!existingProfile?.id) {
      setMessage("Please save your profile first before analyzing");
      return;
    }

    setAnalyzing(true);
    setMessage("");

    try {
      const response = await fetch("/api/brand/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brandProfileId: existingProfile.id }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysis({
          keywords: data.analysis.keywords,
          topics: data.analysis.topics,
          brandVoice: data.analysis.brandVoice,
          targetKeywords: data.analysis.targetKeywords,
          lastAnalyzed: new Date().toISOString(),
        });
        setMessage("✓ Brand analysis complete! Your creator matches will now be more accurate.");
        router.refresh();
      } else {
        setMessage("Error: " + data.error);
      }
    } catch (error) {
      setMessage("Analysis failed. Please try again.");
    }

    setAnalyzing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    // Format website URL if provided
    let websiteUrl = form.website?.trim() || null;
    if (websiteUrl && !websiteUrl.match(/^https?:\/\//i)) {
      websiteUrl = `https://${websiteUrl}`;
    }

    // Format social URLs
    const formattedSocialUrls: Record<string, string> = {};
    for (const [platform, url] of Object.entries(form.social_urls)) {
      if (url?.trim()) {
        let formattedUrl = url.trim();
        if (!formattedUrl.match(/^https?:\/\//i)) {
          formattedUrl = `https://${formattedUrl}`;
        }
        formattedSocialUrls[platform] = formattedUrl;
      }
    }

    const profileData = {
      user_id: userId,
      company_name: form.company_name || null,
      logo_url: form.logo_url || null,
      website: websiteUrl,
      industry: form.industry.length > 0 ? form.industry : null,
      bio: form.bio || null,
      social_urls: Object.keys(formattedSocialUrls).length > 0 ? formattedSocialUrls : null,
      updated_at: new Date().toISOString(),
    };

    let error;
    let savedProfile;

    if (existingProfile) {
      const result = await supabase
        .from("brand_profiles")
        .update(profileData)
        .eq("id", existingProfile.id)
        .select()
        .single();
      error = result.error;
      savedProfile = result.data;
    } else {
      const result = await supabase
        .from("brand_profiles")
        .insert(profileData)
        .select()
        .single();
      error = result.error;
      savedProfile = result.data;
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
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Basic Info Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] pb-2 border-b border-[var(--color-border)]">
          Basic Information
        </h2>

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
          <label className={labelClass}>Website *</label>
          <input
            type="text"
            value={form.website}
            onChange={(e) => setForm({ ...form, website: e.target.value })}
            placeholder="https://yourcompany.com"
            className={inputClass}
            required
          />
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            We'll analyze your website to better match you with creators
          </p>
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
      </div>

      {/* Social Media Section */}
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] pb-2 border-b border-[var(--color-border)]">
          Social Media Profiles
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Add your social profiles so we can better understand your brand and find matching creators
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <span>📸</span> Instagram
              </span>
            </label>
            <input
              type="url"
              value={form.social_urls.instagram}
              onChange={(e) => handleSocialUrlChange("instagram", e.target.value)}
              placeholder="https://instagram.com/yourbrand"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <span>🎵</span> TikTok
              </span>
            </label>
            <input
              type="url"
              value={form.social_urls.tiktok}
              onChange={(e) => handleSocialUrlChange("tiktok", e.target.value)}
              placeholder="https://tiktok.com/@yourbrand"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <span>🎬</span> YouTube
              </span>
            </label>
            <input
              type="url"
              value={form.social_urls.youtube}
              onChange={(e) => handleSocialUrlChange("youtube", e.target.value)}
              placeholder="https://youtube.com/@yourbrand"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <span>💼</span> LinkedIn
              </span>
            </label>
            <input
              type="url"
              value={form.social_urls.linkedin}
              onChange={(e) => handleSocialUrlChange("linkedin", e.target.value)}
              placeholder="https://linkedin.com/company/yourbrand"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              <span className="flex items-center gap-2">
                <span>🐦</span> X / Twitter
              </span>
            </label>
            <input
              type="url"
              value={form.social_urls.twitter}
              onChange={(e) => handleSocialUrlChange("twitter", e.target.value)}
              placeholder="https://twitter.com/yourbrand"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Industries Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] pb-2 border-b border-[var(--color-border)]">
          Industries
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
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
      </div>

      {/* AI Analysis Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] pb-2 border-b border-[var(--color-border)]">
          AI Brand Analysis
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Let our AI analyze your website and socials to automatically find the best creator matches
        </p>

        {analysis.lastAnalyzed ? (
          <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-500 font-medium">
                ✓ Last analyzed: {new Date(analysis.lastAnalyzed).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="text-sm text-[var(--color-accent)] hover:underline disabled:opacity-50"
              >
                {analyzing ? "Analyzing..." : "Re-analyze"}
              </button>
            </div>

            {analysis.brandVoice && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] uppercase mb-1">Brand Voice</p>
                <p className="text-sm text-[var(--color-text-primary)]">{analysis.brandVoice}</p>
              </div>
            )}

            {analysis.topics.length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] uppercase mb-2">Topics</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-3 py-1 rounded-full text-xs bg-[var(--color-accent-light)] text-[var(--color-accent)]"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.keywords.length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] uppercase mb-2">Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {analysis.keywords.slice(0, 15).map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 rounded text-xs bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {analysis.targetKeywords.length > 0 && (
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)] uppercase mb-2">
                  Looking for creators who mention
                </p>
                <div className="flex flex-wrap gap-2">
                  {analysis.targetKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="px-2 py-1 rounded text-xs bg-green-500/10 text-green-500 border border-green-500/20"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-6 text-center">
            <p className="text-[var(--color-text-secondary)] mb-4">
              Save your profile with website and social links, then click analyze to improve your creator matches
            </p>
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analyzing || !existingProfile?.id}
              className="bg-[var(--color-accent)] text-white px-6 py-2 rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {analyzing ? "Analyzing..." : "🔍 Analyze My Brand"}
            </button>
          </div>
        )}
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4 pt-4 border-t border-[var(--color-border)]">
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


