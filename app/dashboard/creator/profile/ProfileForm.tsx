"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Creator = {
  id: string;
  contact_email: string;
  bio: string;
  rate_card: {
    dedicated_video?: number;
    integration?: number;
    tiktok_post?: number;
  };
};

export default function ProfileForm({
  clerkId,
  existingProfile,
  userEmail,
}: {
  clerkId: string;
  existingProfile: Creator | null;
  userEmail: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [contactEmail, setContactEmail] = useState(
    existingProfile?.contact_email || userEmail || ""
  );
  const [bio, setBio] = useState(existingProfile?.bio || "");
  const [dedicatedVideo, setDedicatedVideo] = useState(
    existingProfile?.rate_card?.dedicated_video?.toString() || ""
  );
  const [integration, setIntegration] = useState(
    existingProfile?.rate_card?.integration?.toString() || ""
  );
  const [tiktokPost, setTiktokPost] = useState(
    existingProfile?.rate_card?.tiktok_post?.toString() || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const rateCard = {
      dedicated_video: dedicatedVideo ? parseInt(dedicatedVideo) : null,
      integration: integration ? parseInt(integration) : null,
      tiktok_post: tiktokPost ? parseInt(tiktokPost) : null,
    };

    if (existingProfile) {
      // Update existing profile
      await supabase
        .from("creators")
        .update({
          contact_email: contactEmail,
          bio: bio,
          rate_card: rateCard,
        })
        .eq("id", existingProfile.id);
    } else {
      // For now, just show a message
      // In the real app, creators would claim an existing profile
      console.log("No profile to update — creator needs to claim a profile first");
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Contact Email */}
      <div>
        <label className="block text-white font-medium mb-2">
          Contact Email
        </label>
        <input
          type="email"
          value={contactEmail}
          onChange={(e) => setContactEmail(e.target.value)}
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          placeholder="your@email.com"
        />
        <p className="text-gray-500 text-sm mt-1">
          Brands will use this to contact you
        </p>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-white font-medium mb-2">
          Bio for Brands
        </label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
          placeholder="Tell brands about yourself and what partnerships you're looking for..."
        />
      </div>

      {/* Rate Card */}
      <div>
        <label className="block text-white font-medium mb-4">
          Rate Card
        </label>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">
              Dedicated YouTube Video
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-400">$</span>
              <input
                type="number"
                value={dedicatedVideo}
                onChange={(e) => setDedicatedVideo(e.target.value)}
                className="w-full bg-gray-800 text-white pl-8 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="1200"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">
              YouTube Integration (30-60 sec)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-400">$</span>
              <input
                type="number"
                value={integration}
                onChange={(e) => setIntegration(e.target.value)}
                className="w-full bg-gray-800 text-white pl-8 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="500"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-sm mb-1">
              TikTok Post
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-gray-400">$</span>
              <input
                type="number"
                value={tiktokPost}
                onChange={(e) => setTiktokPost(e.target.value)}
                className="w-full bg-gray-800 text-white pl-8 pr-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
                placeholder="300"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
        {saved && (
          <span className="text-green-400">✓ Saved successfully</span>
        )}
      </div>
    </form>
  );
}
