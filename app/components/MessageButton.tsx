"use client";

import { useState } from "react";
import StartConversationModal from "./StartConversationModal";

interface MessageButtonProps {
  creatorProfileId?: string;
  discoveredCreatorId?: string;
  creatorName: string;
  variant?: "primary" | "secondary" | "icon";
  className?: string;
}

export default function MessageButton({
  creatorProfileId,
  discoveredCreatorId,
  creatorName,
  variant = "primary",
  className = "",
}: MessageButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const baseStyles = {
    primary:
      "px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg font-medium hover:bg-[var(--color-accent-hover)]",
    secondary:
      "px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg font-medium hover:bg-[var(--color-bg-tertiary)]",
    icon: "p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-bg-tertiary)] rounded-lg",
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`${baseStyles[variant]} ${className}`}
      >
        {variant === "icon" ? "💬" : "Message"}
      </button>

      <StartConversationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        creatorProfileId={creatorProfileId}
        discoveredCreatorId={discoveredCreatorId}
        creatorName={creatorName}
      />
    </>
  );
}
