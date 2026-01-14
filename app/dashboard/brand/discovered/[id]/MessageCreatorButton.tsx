"use client";

import { useState } from "react";
import StartConversationModal from "@/components/StartConversationModal";

interface MessageCreatorButtonProps {
  discoveredCreatorId: string;
  creatorName: string;
}

export default function MessageCreatorButton({
  discoveredCreatorId,
  creatorName,
}: MessageCreatorButtonProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-4 py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium hover:bg-[var(--color-accent-hover)] transition-colors flex items-center justify-center gap-2"
      >
        <span>💬</span>
        <span>Message {creatorName.split(" ")[0]}</span>
      </button>

      <StartConversationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        discoveredCreatorId={discoveredCreatorId}
        creatorName={creatorName}
      />
    </>
  );
}
