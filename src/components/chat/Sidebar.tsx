"use client";

import React from "react";
import Link from "next/link";

interface SidebarProps {
  currentChatId?: string;
  onNewChat?: () => void;
  showLegend?: boolean;
}

export function Sidebar({ currentChatId, onNewChat, showLegend = true }: SidebarProps) {
  const historyToday = [
    { id: "physics-test-prep", title: "Physics test prep" },
    { id: "projectile-30", title: "Projectile thrown at 30°" },
    { id: "ice-float", title: "Why does ice float?" },
    { id: "integrate-x-sin-x", title: "Integrate x·sin(x)" },
  ];

  const historyWeek = [
    { id: "mitosis-meiosis", title: "Mitosis vs meiosis" },
    { id: "car-loan", title: "Car loan depreciation" },
    { id: "recursion-python", title: "Recursion in Python" },
    { id: "supply-demand", title: "Supply and demand shift" },
  ];

  return (
    <aside className="side" aria-label="Chat navigation">
      <button className="newc" type="button" onClick={onNewChat}>
        + new chat
      </button>

      <div className="ng">Today</div>
      <div className="hist">
        {historyToday.map((h) => (
          <Link key={h.id} href={`/chat/${h.id}`} style={{ textDecoration: "none" }}>
            <button
              type="button"
              className={currentChatId === h.id ? "on" : ""}
            >
              {h.title}
            </button>
          </Link>
        ))}
      </div>

      <div className="ng">This week</div>
      <div className="hist">
        {historyWeek.map((h) => (
          <Link key={h.id} href={`/chat/${h.id}`} style={{ textDecoration: "none" }}>
            <button
              type="button"
              className={currentChatId === h.id ? "on" : ""}
            >
              {h.title}
            </button>
          </Link>
        ))}
      </div>

      {showLegend && (
        <div className="legend2">
          <b>Reply types</b>
          <div className="why" style={{ display: "flex", marginTop: "4px" }}>
            <span className="k-chat"><i />small talk</span>
          </div>
          <div className="why" style={{ display: "flex", marginTop: "4px" }}>
            <span className="k-new"><i />new question</span>
          </div>
          <div className="why" style={{ display: "flex", marginTop: "4px" }}>
            <span className="k-clar"><i />clarify a step</span>
          </div>
          <div className="why" style={{ display: "flex", marginTop: "4px" }}>
            <span className="k-ext"><i />what if</span>
          </div>
          <div className="why" style={{ display: "flex", marginTop: "4px" }}>
            <span className="k-re"><i />explain differently</span>
          </div>
          <div className="why" style={{ display: "flex", marginTop: "4px" }}>
            <span className="k-rep"><i />asked again</span>
          </div>
        </div>
      )}
    </aside>
  );
}

