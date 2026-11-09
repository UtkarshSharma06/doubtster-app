"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { visit } from "unist-util-visit";
import { Intent } from "@/lib/chat/schema";

function remarkSanitizeMath() {
  return (tree: any) => {
    visit(tree, (node: any) => {
      if (node.type === "math" || node.type === "inlineMath") {
        if (typeof node.value === "string" && node.value.includes("$")) {
          node.value = node.value.replace(/(^|[^\\])\$/g, "$1 ").trim();
        }
      }
    });
  };
}

interface PlainReplyProps {
  content: string;
  intent?: Intent;
  intentReason?: string;
  isTyping?: boolean;
  followUps?: string[];
  refStepId?: string;
  onFollowUpClick?: (text: string) => void;
}

export function PlainReply({
  content,
  intent = "SMALL_TALK",
  intentReason,
  isTyping = false,
  followUps,
  refStepId,
  onFollowUpClick,
}: PlainReplyProps) {
  const intentClassMap: Record<Intent, string> = {
    SMALL_TALK: "k-chat",
    NEW_QUESTION: "k-new",
    CLARIFY: "k-clar",
    WHAT_IF: "k-ext",
    RE_EXPLAIN: "k-re",
    REPEAT: "k-rep",
    META: "k-chat",
  };

  const intentLabelMap: Record<Intent, string> = {
    SMALL_TALK: "small talk",
    NEW_QUESTION: "new question",
    CLARIFY: "clarify step",
    WHAT_IF: "what if",
    RE_EXPLAIN: "explain differently",
    REPEAT: "asked again",
    META: "doubtster info",
  };

  const handleJump = () => {
    if (refStepId) {
      const target = document.getElementById(refStepId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        target.classList.add("hl");
        setTimeout(() => target.classList.remove("hl"), 2000);
      }
    }
  };

  const normalizedContent = React.useMemo(() => {
    let s = String(content || "").trim();
    s = s.replace(/:\s*[\*•-]\s+/g, ":\n\n* ");
    s = s.replace(/([.!?])\s+[\*•-]\s+/g, "$1\n* ");
    s = s.replace(/([^\n])\s+[\*•-]\s+(\*\*[^*]+\*\*)/g, "$1\n* $2");
    s = s.replace(/([.!?])\s+(Chatting with me is|Feel free to|Let me know if|What subject are you|How can I help)\b/gi, "$1\n\n$2");
    return s;
  }, [content]);

  return (
    <div className="ai msg in">
      <span className="logo" aria-hidden="true">
        ?
      </span>
      <div className="body">
        {/* Debug Intent Bar */}
        <div className="why">
          <span className={intentClassMap[intent]}>
            <i />
            {intentLabelMap[intent]}
          </span>
          {intentReason && <em>{intentReason}</em>}
        </div>

        {isTyping && (
          <div className="typing" style={{ display: "flex" }}>
            <i />
            <i />
            <i />
          </div>
        )}

        {!isTyping && (
          <div className="content plain prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath, remarkSanitizeMath]}
              rehypePlugins={[[rehypeKatex, { throwOnError: false, strict: false, errorColor: "#c92a2a" }]]}
            >
              {normalizedContent}
            </ReactMarkdown>

            {followUps && followUps.length > 0 && (
              <div className="fups" style={{ marginTop: "12px" }}>
                {refStepId && (
                  <button type="button" onClick={handleJump}>
                    ↑ see the flat-ground working
                  </button>
                )}
                {followUps.map((f, idx) => (
                  <button key={idx} type="button" onClick={() => onFollowUpClick?.(f)}>
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

