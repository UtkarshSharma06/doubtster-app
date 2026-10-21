import type { CatKey } from "@/lib/blog";

/** Card accent colours and icons per category (listing page). */
export const CARD_STYLE: Record<CatKey, { fg: string; bg: string; icon: "book" | "spark" | "code" | "chart" | "bulb" }> = {
  guides: { fg: "#0E7C86", bg: "#E3F3F4", icon: "book" },
  updates: { fg: "#5B3FD9", bg: "#ECE8FB", icon: "spark" },
  behind: { fg: "#3C7A1E", bg: "#E8F1DF", icon: "code" },
  tips: { fg: "#A86A00", bg: "#FBF0D8", icon: "bulb" },
  examples: { fg: "#B8326B", bg: "#FBE6EE", icon: "chart" },
};

export const ICON_PATHS: Record<string, string[]> = {
  book: ["M8 6h22a4 4 0 0 1 4 4v28H12a4 4 0 0 1-4-4V6z", "M14 16h14M14 23h14M14 30h8"],
  spark: ["M24 6l4.5 10.5L39 21l-10.5 4.5L24 36l-4.5-10.5L9 21l10.5-4.5z"],
  code: ["M16 14l-8 10 8 10M32 14l8 10-8 10M27 9l-6 30"],
  chart: ["M10 38V10M10 38h28", "M14 20c8 0 10 12 22 12"],
  bulb: ["M24 6a12 12 0 0 0-6 22v6h12v-6a12 12 0 0 0-6-22z", "M19 40h10"],
};
