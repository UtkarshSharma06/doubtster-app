"use client";
import { useEffect, useState } from "react";

export function Clock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 30000);
    return () => window.clearInterval(id);
  }, []);
  return <span suppressHydrationWarning>{t}</span>;
}
