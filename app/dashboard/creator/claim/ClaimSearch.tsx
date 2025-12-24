"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Creator = {
  id: string;
  platform: string;
  username: string;
  display_name: string;
  followers: number;
  niche: string;
};

export default function ClaimSearch({
  creators,
  clerkId,
  userEmail,
  userName,
}: {
  creators: Creator[];
  clerkId: string;
  userEmail: string;
  userName: string;
}) {
  const [search, setSearch] = useState("");
  const [claiming, setClaiming] = useState<string | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Waitlist form
  const [channelUrl, setChannelUrl] = useState("");
  const [platform, setPlatform] = useState("youtube");
  const [reviewReason, setReviewReason] = useState("");
  
  const router = useRouter();

  // Smart suggestions based on name and email
  const getSuggestions = () => {
    if (!userName && !userEmail) return [];
    
    const nameParts = userName.toLowerCase().split(" ");
    const emailPrefix = userEmail.split("@")[0].toLowerCase();
    
    return creators.filter((c) => {
      const displayName = c.display_name?.toLowerCase() || "";
      const username = c.username?.toLowerCase() || "";
      
      // Check if any part of their name matches
      const nameMatch = nameParts.some(part => 
        part.length > 2 && (
          displayName.includes(part) || 
          username.includes(part)
        )
      );
      
      // Check if email prefix matches username
      const emailMatch = emailPrefix.length > 3 && (
        username.includes(emailPrefix) ||
        displayName.includes(emailPrefix)
      );
      
      return nameMatch || emailMatch;
    });
  };

  const suggestions = getSuggestions();

  // Search by name OR username
  const filteredCreators = search
    ? creators.filter((c) => {
        const searchLower = search.toLowerCase();
        const displayName = c.display_name?.toLowerCase() || "";
        const username = c.username?.toLowerCase() || "";
        
        return (
          displayName.includes(searchLower) ||
          username.includes(searchLower) ||
          // Also match without @ symbol
          username.includes(searchLower.replace("@", ""))
        );
      })
    : [];

  const handleClaim = async (creatorId: string) => {
    setClaiming(creatorId);

    const { error } = await supabase
      .from("creators")
      .update({ claimed_by: clerkId, claimed: true })
      .eq("id", creatorId);

    if (error) {
      console.error("Error claiming profile:", error);
      setClaiming(null);
      return;
    }

    router.push("/dashboard/creator/profile");
  };

  const handleWaitlistSubmit = async () => {
    if (!channelUrl.trim()) return;
    
    setSubmitting(true);

    const { error } = await supabase.from("waitlist").insert({
      clerk_id: clerkId,
      email: userEmail,
      channel_url: channelUrl,
      platform: platform,
      type: "waitlist",
    });

    if (error) {
      console.error("Error joining waitlist:", error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  const handleReviewSubmit = async () => {
    if (!channelUrl.trim()) return;
    
    setSubmitting(true);

    const { error } = await supabase.from("waitlist").insert({
      clerk_id: clerkId,
      email: userEmail,
      channel_url: channelUrl,
      platform: platform,
      type: "review",
      review_reason: reviewReason,
    });

    if (error) {
      console.error("Error submitting review:", error);
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="bg-gray-800 rounded-xl p-12 text-center">
        <div className="text-5xl mb-4">✓</div>
        <h2 className="text-2xl font-bold text-white mb-2">You're on the list!</h2>
        <p className="text-gray-400">
          We'll email you at {userEmail} when your profile is ready to claim.
        </p>
      </div>
    );
  }

  if (showWaitlist) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <button 
          onClick={() => setShowWaitlist(false)}
          className="text-gray-400 hover:text-white mb-4"
        >
          ← Back to search
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2">Join the Waitlist</h2>
        <p className="text-gray-400 mb-6">
          We track creators with 10k+ followers. Share your channel and we'll notify you when you're eligible.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Channel URL</label>
            <input
              type="url"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleWaitlistSubmit}
            disabled={submitting || !channelUrl.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Join Waitlist"}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <button
            onClick={() => { setShowWaitlist(false); setShowReview(true); }}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            Think we made a mistake? Submit for review →
          </button>
        </div>
      </div>
    );
  }

  if (showReview) {
    return (
      <div className="bg-gray-800 rounded-xl p-6">
        <button 
          onClick={() => setShowReview(false)}
          className="text-gray-400 hover:text-white mb-4"
        >
          ← Back to search
        </button>
        
        <h2 className="text-xl font-bold text-white mb-2">Submit for Review</h2>
        <p className="text-gray-400 mb-6">
          Think you should be in our database? Let us know and we'll take a look.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-white font-medium mb-2">Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            >
              <option value="youtube">YouTube</option>
              <option value="tiktok">TikTok</option>
            </select>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Channel URL</label>
            <input
              type="url"
              value={channelUrl}
              onChange={(e) => setChannelUrl(e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">What's the issue?</label>
            <textarea
              value={reviewReason}
              onChange={(e) => setReviewReason(e.target.value)}
              placeholder="e.g., I have 25k subscribers but couldn't find my channel, or my follower count seems wrong..."
              rows={3}
              className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <button
            onClick={handleReviewSubmit}
            disabled={submitting || !channelUrl.trim()}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? "Submitting..." : "Submit for Review"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Smart Suggestions */}
      {suggestions.length > 0 && !search && (
        <div className="mb-10">
          <h2 className="text-white font-medium mb-4">
            🎯 Is this you, {userName.split(" ")[0]}?
          </h2>
          <div className="space-y-4">
            {suggestions.slice(0, 3).map((creator) => (
              <div
                key={creator.id}
                className="bg-blue-900/30 border border-blue-800 rounded-xl p-5 flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {creator.display_name}
                    </h3>
                    <p className="text-gray-400">
                      @{creator.username} · {creator.platform}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {creator.followers?.toLocaleString()} followers · {creator.niche}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(creator.id)}
                  disabled={claiming === creator.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {claiming === creator.id ? "Claiming..." : "This is me"}
                </button>
              </div>
            ))}
          </div>
          
          <p className="text-gray-500 text-sm mt-4">
            Not you? Search below or browse all profiles.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="mb-8">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or @username..."
          className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Search Results */}
      {search && (
        <div className="space-y-4 mb-10">
          {filteredCreators.length > 0 ? (
            filteredCreators.map((creator) => (
              <div
                key={creator.id}
                className="bg-gray-800 rounded-xl p-5 flex justify-between items-center"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {creator.display_name}
                    </h3>
                    <p className="text-gray-400">
                      @{creator.username} · {creator.platform}
                    </p>
                    <p className="text-gray-500 text-sm">
                      {creator.followers?.toLocaleString()} followers · {creator.niche}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleClaim(creator.id)}
                  disabled={claiming === creator.id}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {claiming === creator.id ? "Claiming..." : "This is me"}
                </button>
              </div>
            ))
          ) : (
            <div className="bg-gray-800 rounded-xl p-8 text-center">
              <p className="text-gray-400">No creators found matching "{search}"</p>
            </div>
          )}
        </div>
      )}

      {/* Browse All (when not searching) */}
      {!search && (
        <div className="mb-10">
          <h3 className="text-gray-400 text-sm font-medium mb-4">BROWSE ALL PROFILES</h3>
          <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
            {creators.slice(0, 10).map((creator) => (
              <div
                key={creator.id}
                className="bg-gray-800 rounded-lg p-6 flex justify-between items-center"
              >
                <div>
                  <p className="text-white">{creator.display_name}</p>
                  <p className="text-gray-500 text-sm">
                    @{creator.username} · {creator.followers?.toLocaleString()} followers
                  </p>
                </div>
                <button
                  onClick={() => handleClaim(creator.id)}
                  disabled={claiming === creator.id}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {claiming === creator.id ? "..." : "Claim"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Can't find profile */}
      <div className="mt-24 p-6 bg-gray-700/80 rounded-xl border-2 border-blue-500/30 shadow-lg">
        <h3 className="text-white font-medium mb-3">Can't find your profile?</h3>
        <p className="text-gray-400 text-sm mb-6">
          We track creators with 10k+ followers on YouTube and TikTok.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => setShowWaitlist(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Join Waitlist
          </button>
          <button
            onClick={() => setShowReview(true)}
            className="text-gray-300 hover:text-white px-4 py-2 border border-gray-600 rounded-lg"
          >
            Submit for Review
          </button>
        </div>
      </div>
    </div>
  );
}