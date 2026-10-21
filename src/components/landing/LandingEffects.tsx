"use client";

import { useEffect } from "react";
// @ts-ignore: plain browser script, kept as JS on purpose
import { initLanding } from "@/lib/landing";

/** Starts the page animations and players once the markup is on screen. Renders nothing. */
export default function LandingEffects() {
  useEffect(() => {
    initLanding();
  }, []);
  return null;
}
