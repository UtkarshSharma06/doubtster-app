"use client";

import React, { useEffect, useRef } from "react";

interface ProfileMenuProps {
  user?: { id?: string; email?: string; name?: string } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileMenu({ user, isOpen, onClose }: ProfileMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // Do not close if clicking the profile trigger button itself (handled by toggle)
      if (target.closest("#side-profile-trigger") || target.closest("#avt") || (menuRef.current && menuRef.current.contains(target as Node))) {
        return;
      }
      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Global shortcut for Settings (Ctrl+Shift+,)
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "," || e.key === "<")) {
        e.preventDefault();
        onClose();
        if ((window as any).doubtsterGo) {
          (window as any).doubtsterGo("settings");
        } else {
          window.location.hash = "#settings";
        }
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [onClose]);

  if (!isOpen) return null;

  const emailDisplay = user?.email || "student@doubtster.com";

  const handleAction = (action: string) => {
    onClose();
    const navigateTo = (view: string) => {
      if (typeof window !== "undefined") {
        if ((window as any).doubtsterGo) {
          (window as any).doubtsterGo(view);
        } else {
          window.location.hash = "#" + view;
        }
      }
    };

    switch (action) {
      case "settings":
        navigateTo("settings");
        break;
      case "usage":
        navigateTo("usage");
        break;
      case "language":
        navigateTo("language");
        break;
      case "help":
        navigateTo("help");
        break;
      case "plans":
        if (typeof window !== "undefined") {
          if ((window as any).doubtsterPromo) {
            (window as any).doubtsterPromo();
          } else {
            const promoBtn = document.querySelector('[data-act="promo"]') as HTMLButtonElement | null;
            if (promoBtn) {
              promoBtn.click();
            } else if ((window as any).doubtsterGo) {
              (window as any).doubtsterGo("account");
            }
          }
        }
        break;
      case "apps":
        navigateTo("apps");
        break;
      case "learn":
        navigateTo("learn");
        break;
      case "logout":
        performLogout();
        break;
      default:
        break;
    }
  };

  const performLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    try {
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const k = localStorage.key(i);
        if (k && (k.startsWith("doubtster-") || k.startsWith("sb-"))) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
    window.location.href = "/login";
  };

  return (
    <div
      ref={menuRef}
      className="claude-profile-popover"
      role="menu"
      aria-label="User account menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="cpm-header" title={emailDisplay}>
        {emailDisplay}
      </div>

      <div className="cpm-list">
        {/* Settings */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("settings")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span className="cpm-label">Settings</span>
          <span className="cpm-hint">Ctrl+Shift+,</span>
        </button>

        {/* Usage */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("usage")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="cpm-label">Usage</span>
        </button>

        {/* Language */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("language")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span className="cpm-label">Language</span>
        </button>

        {/* Get help */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("help")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="cpm-label">Get help</span>
        </button>

        <div className="cpm-divider" />

        {/* View all plans */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("plans")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <span className="cpm-label">View all plans</span>
        </button>

        {/* Get apps and extensions */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("apps")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="14" height="11" rx="2" />
            <path d="M6 18h6" />
            <path d="M9 14v4" />
            <rect x="16" y="9" width="6" height="12" rx="1.5" />
          </svg>
          <span className="cpm-label">Get apps and extensions</span>
        </button>

        {/* Learn more */}
        <button
          type="button"
          className="cpm-item"
          role="menuitem"
          onClick={() => handleAction("learn")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span className="cpm-label">Learn more</span>
          <svg className="cpm-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <div className="cpm-divider" />

        {/* Log out */}
        <button
          type="button"
          className="cpm-item cpm-logout"
          role="menuitem"
          onClick={() => handleAction("logout")}
        >
          <svg className="cpm-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span className="cpm-label">Log out</span>
        </button>
      </div>
    </div>
  );
}

