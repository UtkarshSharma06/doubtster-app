/**
 * Proxies the admin panel's /api/config endpoint so the student app
 * always reads live feature flags and prices.
 * 
 * The admin /api/config only returns safe public fields —
 * it never includes providers, budgets, blocked words, or keys.
 * 
 * Falls back to sensible defaults if admin is unreachable.
 */
import { NextResponse } from "next/server";

const ADMIN_URL = process.env.ADMIN_URL || "";

const DEFAULT_CONFIG = {
  chat: true,
  video: true,
  notes: true,
  flashcards: true,
  quizzes: true,
  signups: true,
  maintenance: false,
  maintenanceMsg: "",
  banner: false,
  bannerMsg: "",
  trial: true,
  trialDays: 7,
  creditsPerVideo: 2,
  freeCredits: 5,
  priceTrial: 0,
  trialVideos: 2,
  priceMonthly: 9,
  monthlyCredits: 100,
  priceAnnual: 79,
  topup10: 5,
  topup25: 10,
};

export async function GET() {
  if (!ADMIN_URL) {
    return NextResponse.json(DEFAULT_CONFIG);
  }

  try {
    const res = await fetch(`${ADMIN_URL}/api/config`, {
      next: { revalidate: 60 }, // cache for 60 seconds
    });

    if (!res.ok) {
      console.error("[config] Admin config fetch failed:", res.status);
      return NextResponse.json(DEFAULT_CONFIG);
    }

    const data = await res.json();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (err) {
    console.error("[config] Admin config fetch error:", err);
    return NextResponse.json(DEFAULT_CONFIG);
  }
}
