import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? "https://doubtster.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "Doubtster", template: "%s | Doubtster" },
  description: "Ask any question, get step by step answers, and turn them into videos, notes, flashcards and quizzes.",
  robots: { index: false },
  openGraph: { siteName: "Doubtster", type: "website" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* Swap for next/font if you prefer self-hosting. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;500;600;700&family=Kalam:wght@300;400;700&family=Patrick+Hand&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <svg width="0" height="0" style={{ position: "absolute", pointerEvents: "none" }} aria-hidden="true">
          <defs>
            <filter id="wob" filterUnits="userSpaceOnUse" x="-20" y="-20" width="760" height="340">
              <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" result="n" />
              <feDisplacementMap in="SourceGraphic" in2="n" scale="3.5" />
            </filter>
          </defs>
        </svg>
        {children}
      </body>
    </html>
  );
}
