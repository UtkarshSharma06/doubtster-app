"use client";

import React, { useEffect, useState } from "react";

export function AnswerToc() {
  const [activeSection, setActiveSection] = useState<string>("s-given");
  const [scrollProgress, setScrollProgress] = useState(0);

  const sections = [
    { id: "s-given", label: "What we know" },
    { id: "s-split", label: "Split the velocity" },
    { id: "s-steps", label: "Step by step" },
    { id: "s-graph", label: "See the path" },
    { id: "s-vel", label: "Speed over time" },
    { id: "s-mist", label: "Common mistakes" },
    { id: "s-sum", label: "On the board" },
    { id: "s-quiz", label: "Check yourself" },
    { id: "s-make", label: "Video & cards" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const y = window.innerHeight * 0.35;
      let cur = sections[0].id;

      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el && el.getBoundingClientRect().top < y) {
          cur = sec.id;
        }
      }
      setActiveSection(cur);

      const h = document.documentElement;
      const progress = window.scrollY / (h.scrollHeight - window.innerHeight || 1);
      setScrollProgress(Math.min(100, Math.max(0, progress * 100)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <aside className="toc">
      <h4>On this answer</h4>
      {sections.map((sec) => (
        <a
          key={sec.id}
          href={`#${sec.id}`}
          className={activeSection === sec.id ? "on" : ""}
          onClick={(e) => handleClick(e, sec.id)}
        >
          <i />
          {sec.label}
        </a>
      ))}
      <div className="prog">
        <i style={{ width: `${scrollProgress}%` }} />
      </div>
    </aside>
  );
}

