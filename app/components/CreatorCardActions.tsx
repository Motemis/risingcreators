"use client";

import { useState } from "react";
import MessageButton from "./MessageButton";

interface CreatorCardActionsProps {
  creatorProfileId: string;
  creatorName: string;
  showMessage?: boolean;
}

export default function CreatorCardActions({
  creatorProfileId,
  creatorName,
  showMessage = true,
}: CreatorCardActionsProps) {
  return (
    <div className="flex items-center gap-2">
      {showMessage && (
        <MessageButton
          creatorProfileId={creatorProfileId}
          creatorName={creatorName}
          variant="secondary"
        />
      )}
    </div>
  );
}
