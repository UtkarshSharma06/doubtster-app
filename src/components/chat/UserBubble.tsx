import React from "react";

interface UserBubbleProps {
  content: string;
  timestamp?: string;
}

export function UserBubble({ content, timestamp }: UserBubbleProps) {
  return (
    <>
      <div className="um msg in">{content}</div>
      {timestamp && <div className="umeta">you · {timestamp}</div>}
    </>
  );
}

