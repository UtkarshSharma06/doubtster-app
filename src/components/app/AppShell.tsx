"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock } from "@/components/Clock";
import { mountApp } from "@/lib/appEngine";
import { APP, site } from "@/lib/config";
import { ProfileMenu } from "@/components/app/ProfileMenu";

/**
 * Static shell for the app matching the modern Scite UI layout.
 * The views are painted into #view by the engine in src/lib/appEngine.ts.
 */
export function AppShell({ user }: { user?: { id: string; email?: string; name?: string } | null }) {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Initialize sidebar collapsed state from localStorage
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const saved = localStorage.getItem("doubtster-sidebar-collapsed");
        if (saved === "1") {
          setSidebarCollapsed(true);
        }
      }
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("doubtster-sidebar-collapsed", next ? "1" : "0");
        }
      } catch {}
      return next;
    });
  }, []);

  // Global shortcut for Settings (Ctrl+Shift+,)
  useEffect(() => {
    (window as any).doubtsterToggleProfileMenu = () => setProfileMenuOpen((prev) => !prev);
    (window as any).doubtsterCloseProfileMenu = () => setProfileMenuOpen(false);

    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "[" || e.key === "b" || e.key === "B")) {
        e.preventDefault();
        toggleSidebar();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === "," || e.key === "<")) {
        e.preventDefault();
        window.location.hash = "#settings";
        setProfileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleGlobalShortcuts);
    return () => window.removeEventListener("keydown", handleGlobalShortcuts);
  }, [toggleSidebar]);

  // Hook up avatar and trigger buttons to toggle Claude-style profile dropdown
  useEffect(() => {
    const handleTriggerClick = (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setProfileMenuOpen((prev) => !prev);
    };

    const sideTrigger = document.getElementById("side-profile-trigger");
    if (sideTrigger) {
      sideTrigger.addEventListener("click", handleTriggerClick);
    }

    const avt = document.getElementById("avt");
    if (avt) {
      avt.addEventListener("click", handleTriggerClick, true);
    }

    return () => {
      if (sideTrigger) sideTrigger.removeEventListener("click", handleTriggerClick);
      if (avt) avt.removeEventListener("click", handleTriggerClick, true);
    };
  }, []);

  useEffect(() => mountApp(APP, user), [user]);

  const userName = user?.name || (user?.email ? user.email.split("@")[0] : "Student");
  const userInitial = (userName[0] || "U").toUpperCase();

  return (
    <div className={`pg-app ${sidebarCollapsed ? "sidebar-closed" : ""}`} suppressHydrationWarning>
      <a className="skip" href="#view">Skip to content</a>

      <div className="app">
        <aside className="side" id="side" aria-label="Sidebar">
          <div className="side-head">
            <a className="side-brand" href={site("/") || "/"} aria-label="Doubtster home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/doubtster-logo-light.svg"
                alt="Doubtster"
                height={28}
                className="side-logo-img logo-light-only"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/doubtster-logo-dark.svg"
                alt="Doubtster"
                height={28}
                className="side-logo-img logo-dark-only"
              />
            </a>
            <button
              className="sidebar-toggle-btn"
              type="button"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
              title="Close sidebar (Ctrl+[)"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          </div>

          <nav className="nv" id="nv" aria-label="Sections" />

          <div className="side-action-wrap">
            <button className="newc" id="newc" type="button">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Chat</span>
            </button>
          </div>

          <div className="hist" id="hist" />

          <div className="side-footer">
            <div className="side-profile-section" style={{ position: "relative" }}>
              <button
                type="button"
                className="side-profile-btn"
                id="side-profile-trigger"
                aria-label="Account options"
                aria-expanded={profileMenuOpen}
              >
                <span className="side-profile-avatar" id="side-profile-avatar">
                  {userInitial}
                </span>
                <div className="side-profile-info">
                  <span className="side-profile-name" id="side-profile-name">
                    {userName}
                  </span>
                  <span className="side-profile-badge" id="side-profile-badge">
                    Free
                  </span>
                </div>
                <svg
                  className="side-profile-more"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="1.2"/>
                  <circle cx="12" cy="5" r="1.2"/>
                  <circle cx="12" cy="19" r="1.2"/>
                </svg>
              </button>

              <ProfileMenu
                user={user}
                isOpen={profileMenuOpen}
                onClose={() => setProfileMenuOpen(false)}
              />
            </div>

            {/* Hidden compatibility bridges for engine paintTop */}
            <div style={{ display: "none" }} aria-hidden="true">
              <button className="cr" id="crb" type="button" />
              <button className="av" id="avt" type="button" />
              <div className="pl" id="pl" />
            </div>
          </div>
        </aside>

        <div className="main-content-wrap">
          {sidebarCollapsed && (
            <button
              className="floating-sidebar-toggle"
              type="button"
              onClick={toggleSidebar}
              aria-label="Open sidebar"
              title="Open sidebar (Ctrl+[)"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
              </svg>
            </button>
          )}
          <main className="main" id="view" tabIndex={-1} style={{ position: "relative", zIndex: 1 }} />
        </div>
      </div>
      <div className="toast" id="toast" role="status" aria-live="polite" hidden />
    </div>
  );
}
