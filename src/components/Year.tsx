"use client";
import { useEffect, useState } from "react";

/** Current year, filled in after mount so static pages never go stale. */
export function Year() {
  const [y, setY] = useState("");
  useEffect(() => setY(String(new Date().getFullYear())), []);
  return <span suppressHydrationWarning>{y}</span>;
}
