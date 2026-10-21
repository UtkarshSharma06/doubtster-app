"use client";
import { useEffect } from "react";
import { Clock } from "@/components/Clock";
import { mountApp } from "@/lib/appEngine";
import { APP, site } from "@/lib/config";

/**
 * Static shell for the app. The views (home, chat, flashcards, quizzes, videos, notes, planner, library, account) are
 * painted into #view by the engine in src/lib/appEngine.ts, which also fills #nv, #hist, #pl,
 * #crb (credits) and #avt (avatar).
 */
export function AppShell() {
  useEffect(() => mountApp(APP), []);
  return (
    <div className="pg-app" suppressHydrationWarning>
      <a className="skip" href="#view">Skip to content</a>
      <header className="bar">
        <div className="in">
          <div className="l">
            <a className="brand" href={site("/") || "/"} aria-label="Doubtster home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/doubtster-logo-light.svg" alt="Doubtster" height={36} />
            </a>
            <nav aria-label="Main">
              <a href={site("/#pricing")}>pricing</a>
              <a href={site("/blog")}>blog</a>
            </nav>
          </div>
          <div className="logo" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/doubtster-icon.svg" alt="" width={28} height={28} />
          </div>
          <div className="r">
            <span><Clock /></span>
            <button className="cr" id="crb" type="button" aria-label="Credits and plan" />
            <button className="av" id="avt" type="button" aria-label="Account" />
          </div>
        </div>
      </header>
      <div className="dots" style={{ position: "fixed", inset: "50px 0 0 0", zIndex: 0, pointerEvents: "none" }} />
      <div className="app">
        <aside className="side" aria-label="App">
          <button className="newc" id="newc" type="button">+ new chat</button>
          <nav className="nv" id="nv" aria-label="Sections" />
          <div className="hh">recent chats</div>
          <div className="hist" id="hist" />
          <div className="pl" id="pl" />
        </aside>
        <main className="main" id="view" tabIndex={-1} style={{ position: "relative", zIndex: 1 }} />
      </div>
      <div className="toast" id="toast" role="status" aria-live="polite" hidden />
    </div>
  );
}
