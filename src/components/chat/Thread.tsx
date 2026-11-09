"use client";

import React, { useEffect, useRef } from "react";
import { ChatMessage } from "@/lib/chat/schema";
import { UserBubble } from "./UserBubble";
import { PlainReply } from "./PlainReply";
import { AnswerCard } from "./AnswerCard";
import { FollowUpCard } from "./FollowUpCard";

interface ThreadProps {
  messages: ChatMessage[];
  isGenerating?: boolean;
  onFollowUpClick?: (text: string) => void;
  onMakeVideo?: () => void;
  onMakeDeck?: () => void;
  onMakeQuiz?: () => void;
}

export function Thread({
  messages,
  isGenerating = false,
  onFollowUpClick,
  onMakeVideo,
  onMakeDeck,
  onMakeQuiz,
}: ThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, isGenerating]);

  return (
    <div className="thread" id="thread">
      {messages.map((msg, i) => {
        if (msg.role === "user") {
          return (
            <UserBubble
              key={msg.id || i}
              content={msg.content}
              timestamp={
                msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : undefined
              }
            />
          );
        }

        // Assistant structured answer
        if (msg.answer) {
          return (
            <div className="ai msg in" key={msg.id || i} id={`a-${msg.id}`}>
              <span className="logo" aria-hidden="true">
                ?
              </span>
              <div className="body">
                <div className="why">
                  <span className="k-new">
                    <i />
                    new question
                  </span>
                  <em>full structured answer · graph · video and cards offered once, at the end</em>
                </div>
                <div className="content">
                  <AnswerCard
                    answer={msg.answer}
                    onFollowUpClick={onFollowUpClick}
                    onMakeVideo={onMakeVideo}
                    onMakeDeck={onMakeDeck}
                    onMakeQuiz={onMakeQuiz}
                  />
                </div>
              </div>
            </div>
          );
        }

        // Assistant follow-up card (Clarify, What-if, Re-explain)
        if (msg.followUp) {
          const intentClassMap: Record<string, string> = {
            CLARIFY: "k-clar",
            WHAT_IF: "k-ext",
            RE_EXPLAIN: "k-re",
            REPEAT: "k-rep",
          };
          const intentClass = intentClassMap[msg.followUp.intent] || "k-clar";

          return (
            <div className="ai msg in" key={msg.id || i}>
              <span className="logo" aria-hidden="true">
                ?
              </span>
              <div className="body">
                <div className="why">
                  <span className={intentClass}>
                    <i />
                    {msg.followUp.intent.toLowerCase().replace("_", " ")}
                  </span>
                  {msg.intentReason && <em>{msg.intentReason}</em>}
                </div>
                <FollowUpCard
                  followUp={msg.followUp}
                  onFollowUpClick={onFollowUpClick}
                />
              </div>
            </div>
          );
        }

        // Assistant plain text response
        return (
          <PlainReply
            key={msg.id || i}
            content={msg.content}
            intent={msg.intent}
            intentReason={msg.intentReason}
            refStepId={msg.refersTo?.stepId}
            onFollowUpClick={onFollowUpClick}
          />
        );
      })}

      {/* Generating / typing indicator */}
      {isGenerating && (
        <PlainReply content="" isTyping={true} intent="NEW_QUESTION" />
      )}

      <div ref={bottomRef} style={{ height: "1px" }} />
    </div>
  );
}

