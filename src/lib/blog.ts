export type CatKey = "guides" | "updates" | "behind" | "tips" | "examples";
export const CATS: Record<CatKey, { label: string; tag: string; tint: string; desc: string }> = {
  guides: { label: "Guides", tag: "GUIDE", tint: "#5CC8CF", desc: "How Doubtster works: the trial, credits and what to expect." },
  updates: { label: "Product updates", tag: "UPDATE", tint: "#A596FF", desc: "What works today and what is on the way." },
  behind: { label: "Behind the scenes", tag: "BEHIND THE SCENES", tint: "#8FBF5A", desc: "How we build explainers and how we think about accuracy." },
  tips: { label: "Study tips", tag: "STUDY TIP", tint: "#E3B34F", desc: "Habits and ways of asking that make answers clearer." },
  examples: { label: "Worked examples", tag: "WORKED EXAMPLE", tint: "#E58AA8", desc: "Real questions solved one step at a time." },
};
export const CAT_ORDER: CatKey[] = ["guides", "updates", "behind", "tips", "examples"];

export type Section = { id: string; heading: string; html: string };
export type Article = {
  slug: string;
  cat: CatKey;
  subject?: string;
  minutes: number;
  title: string;
  excerpt: string;
  lead?: boolean;
  calculator?: boolean;
  tldr: string;
  sections: Section[];
  takeaways: string[];
};

/** Short chalkboard-style snippet shown on cards and in the reading hero. Split on " / " for lines. */
export const BOARD: Record<string, string> = {
  "start-here-how-doubtster-works": "Ask. Read. Watch.",
  "how-the-7-day-trial-works": "$1.99 / 7 days / 3 videos",
  "credits-explained": "1 credit = 1 video",
  "what-we-are-building-next": "Now / Next / Soon",
  "why-we-build-videos-from-code": "draw, narrate, render",
  "reducing-balance-depreciation": "V = P(1 − r)ⁿ",
  "turn-a-wrong-answer-into-a-revision-note": "What / Right / Why",
  "how-we-think-about-accuracy": "Check what matters",
  "velocity-and-acceleration": "a = Δv / Δt",
  "ask-a-question-that-gets-a-clearer-explanation": "Level / Attempt / Stuck",
  "supply-and-demand-equilibrium": "Qd = Qs, so P = 16",
  "a-simple-weekly-revision-plan": "Short and often",
  "big-o-notation-deck-of-cards": "O(log n) vs O(n²)",
};
export const boardLines = (slug: string) => (BOARD[slug] ?? "").split(" / ");
export const boardText = (slug: string) => boardLines(slug).join(" / ");

export const metaLabel = (a: Article) =>
  `${CATS[a.cat].tag}${a.subject ? " / " + a.subject.toUpperCase() : ""} / ${a.minutes} MIN`;

export const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function matches(a: Article, q: string) {
  const n = norm(q.trim());
  if (!n) return true;
  const hay = norm([a.title, a.excerpt, CATS[a.cat].label, a.subject ?? ""].join(" "));
  return n.split(/\s+/).every((w) => hay.includes(w));
}
