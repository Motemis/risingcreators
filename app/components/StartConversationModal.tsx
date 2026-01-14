"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Campaign {
  id: string;
  name: string;
}

interface StartConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  creatorProfileId?: string;
  discoveredCreatorId?: string;
  creatorName: string;
}

const SUGGESTED_TITLES = [
  "Partnership Opportunity",
  "Collaboration Discussion",
  "Sponsorship Inquiry",
  "Content Partnership",
  "Brand Ambassador Opportunity",
];

export default function StartConversationModal({
  isOpen,
  onClose,
  creatorProfileId,
  discoveredCreatorId,
  creatorName,
}: StartConversationModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"type" | "compose">("type");
  const [conversationType, setConversationType] = useState<"campaign" | "direct">("direct");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [message, setMessage] = useState("");
  const [templates, setTemplates] = useState<any[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCampaigns();
      loadTemplates();
      // Reset state
      setStep("type");
      setConversationType("direct");
      setSelectedCampaignId("");
      setTitle("");
      setCustomTitle("");
      setMessage("");
    }
  }, [isOpen]);

  const loadCampaigns = async () => {
    setLoading(true);
    const res = await fetch("/api/campaigns");
    const data = await res.json();
    if (data.campaigns) {
      setCampaigns(data.campaigns.filter((c: any) => c.status === "active"));
    }
    setLoading(false);
  };

  const loadTemplates = async () => {
    const res = await fetch("/api/messages/templates");
    const data = await res.json();
    if (data.templates) {
      setTemplates(data.templates);
    }
  };

  const handleNext = () => {
    if (conversationType === "campaign" && !selectedCampaignId) {
      alert("Please select a campaign");
      return;
    }
    if (conversationType === "direct" && !title && !customTitle) {
      alert("Please select or enter a title");
      return;
    }
    setStep("compose");
  };

  const handleUseTemplate = (template: any) => {
    let content = template.content;
    content = content.replace(/\{creator_name\}/g, creatorName);
    setMessage(content);
    setShowTemplates(false);
  };

  const handleSend = async () => {
    if (!message.trim()) {
      alert("Please enter a message");
      return;
    }

    setSending(true);

    const finalTitle =
      conversationType === "campaign"
        ? campaigns.find((c) => c.id === selectedCampaignId)?.name || "Campaign"
        : title || customTitle;

    const res = await fetch("/api/messages/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creator_profile_id: creatorProfileId || null,
        discovered_creator_id: discoveredCreatorId || null,
        campaign_id: conversationType === "campaign" ? selectedCampaignId : null,
        title: finalTitle,
        initial_message: message.trim(),
      }),
    });

    const data = await res.json();

    if (data.conversation) {
      router.push(`/messages?conversation=${data.conversation.id}`);
      onClose();
    } else if (data.queued) {
      // Message was queued for non-joined creator
      alert("Message sent! The creator will see it when they join.");
      onClose();
      router.push("/dashboard/brand/watchlist");
    } else if (data.error) {
      if (data.conversation_id) {
        router.push(`/messages?conversation=${data.conversation_id}`);
        onClose();
      } else {
        alert(data.error);
      }
    }

    setSending(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--color-bg-secondary)] rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Message {creatorName}
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {step === "type" ? (
            <div className="space-y-6">
              {/* Conversation Type */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  What's this about?
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => setConversationType("campaign")}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      conversationType === "campaign"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📋</span>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          Campaign Invitation
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          Invite to a specific campaign
                        </p>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setConversationType("direct")}
                    className={`w-full p-4 rounded-xl border text-left transition-colors ${
                      conversationType === "direct"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                        : "border-[var(--color-border)] hover:border-[var(--color-accent)]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">💬</span>
                      <div>
                        <p className="font-medium text-[var(--color-text-primary)]">
                          Direct Outreach
                        </p>
                        <p className="text-sm text-[var(--color-text-secondary)]">
                          General partnership discussion
                        </p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Campaign Selection */}
              {conversationType === "campaign" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Select Campaign
                  </label>
                  {loading ? (
                    <p className="text-[var(--color-text-tertiary)]">Loading campaigns...</p>
                  ) : campaigns.length === 0 ? (
                    <p className="text-[var(--color-text-tertiary)]">
                      No active campaigns. Create one first.
                    </p>
                  ) : (
                    <select
                      value={selectedCampaignId}
                      onChange={(e) => setSelectedCampaignId(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                    >
                      <option value="">Select a campaign...</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Direct Outreach Title */}
              {conversationType === "direct" && (
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    Conversation Title
                  </label>
                  <div className="space-y-2">
                    {SUGGESTED_TITLES.map((suggested) => (
                      <button
                        key={suggested}
                        onClick={() => {
                          setTitle(suggested);
                          setCustomTitle("");
                        }}
                        className={`w-full px-4 py-2 rounded-lg border text-left text-sm transition-colors ${
                          title === suggested
                            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text-primary)]"
                            : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-accent)]/50"
                        }`}
                      >
                        {suggested}
                      </button>
                    ))}
                    <div className="pt-2">
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => {
                          setCustomTitle(e.target.value);
                          setTitle("");
                        }}
                        placeholder="Or type a custom title..."
                        className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected Context */}
              <div className="p-3 bg-[var(--color-bg-tertiary)] rounded-lg">
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {conversationType === "campaign" ? "Campaign:" : "Topic:"}
                </p>
                <p className="font-medium text-[var(--color-text-primary)]">
                  {conversationType === "campaign"
                    ? campaigns.find((c) => c.id === selectedCampaignId)?.name
                    : title || customTitle}
                </p>
              </div>

              {/* Templates */}
              {templates.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="text-sm text-[var(--color-accent)] hover:underline"
                  >
                    {showTemplates ? "Hide templates" : "Use a template"}
                  </button>

                  {showTemplates && (
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => handleUseTemplate(template)}
                          className="w-full p-3 rounded-lg border border-[var(--color-border)] text-left hover:bg-[var(--color-bg-tertiary)]"
                        >
                          <p className="font-medium text-sm text-[var(--color-text-primary)]">
                            {template.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                            {template.content}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Your Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi ${creatorName}, I came across your content and...`}
                  rows={6}
                  className="w-full px-4 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] resize-none"
                />
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Tip: Be specific about why you're reaching out and what you're looking for.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border)] flex justify-between">
          {step === "compose" && (
            <button
              onClick={() => setStep("type")}
              className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              ← Back
            </button>
          )}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
            >
              Cancel
            </button>
            {step === "type" ? (
              <button
                onClick={handleNext}
                disabled={
                  (conversationType === "campaign" && !selectedCampaignId) ||
                  (conversationType === "direct" && !title && !customTitle)
                }
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Message"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
