"use client";

import React, { useState, useRef, useEffect } from "react";

interface ComposerProps {
  onSend: (
    text: string,
    attachment?: { name: string; type: string; base64: string } | null
  ) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function Composer({
  onSend,
  disabled = false,
  placeholder = "Ask a question, paste a problem, or attach image/doc",
}: ComposerProps) {
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    type: string;
    base64: string;
    size: number;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = input.trim();
    if ((!clean && !attachment) || disabled) return;
    onSend(clean, attachment ? { name: attachment.name, type: attachment.type, base64: attachment.base64 } : null);
    setInput("");
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (textareaRef.current) {
      textareaRef.current.style.height = "34px";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File is too large. Maximum size is 5 MB.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAttachment({
        name: file.name,
        type: file.type || "application/octet-stream",
        base64: String(ev.target?.result || ""),
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(140, Math.max(34, textareaRef.current.scrollHeight))}px`;
    }
  };

  return (
    <div className="comp">
      {attachment && (
        <div style={{ maxWidth: 860, margin: "0 auto 6px", display: "flex", alignItems: "center" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#fff",
              border: "1px solid #C9C9CF",
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: 12.5,
              boxShadow: "0 2px 6px -2px rgba(0,0,0,.15)",
            }}
          >
            📎 {attachment.name} ({Math.round(attachment.size / 1024)} KB)
            <button
              type="button"
              onClick={() => {
                setAttachment(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#8E8E98",
                fontSize: 14,
                padding: "0 2px",
                marginLeft: 4,
              }}
              aria-label="Remove attachment"
            >
              ×
            </button>
          </span>
        </div>
      )}
      <form className="cbox" onSubmit={handleSubmit}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 6px",
            color: "#6E6E78",
            display: "flex",
            alignItems: "center",
          }}
          title="Attach image or PDF document"
          aria-label="Attach file"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          rows={1}
          placeholder={placeholder}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <button
          className="send"
          type="submit"
          disabled={disabled || (!input.trim() && !attachment)}
          aria-label="Send message"
        >
          ↑
        </button>
      </form>
      <div className="cnote">Chat is free · In-memory processing ($0 storage)</div>
    </div>
  );
}

