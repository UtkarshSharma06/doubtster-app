// One place for the site's name, address and search wording.
export const SITE = {
  name: "Doubtster",
  url: "https://doubtster.com",
  title: "Doubtster: AI Homework Helper That Explains It on Video",
  description:
    "Ask any homework question in maths, physics, chemistry, biology or coding. Get free step-by-step answers in chat, then watch it explained in a short video.",
  tagline: "Ask a question. Watch it explained.",
  locale: "en_US",
  // Google ignores the keywords meta tag, Bing gives it very little weight. The real keyword work is in the
  // page copy, headings, titles and the example pages. Kept here for reference and for other engines.
  keywords: [
    "AI homework helper", "homework help", "step by step answers", "AI tutor", "math solver step by step",
    "video explanation", "explainer video", "physics help", "chemistry help", "biology help", "coding help",
    "calculus help", "study notes", "flashcards", "free homework help", "Photomath alternative", "Chegg alternative",
  ],
  // Add your social profiles here once they exist (Instagram, YouTube, X, LinkedIn). They help Google connect the brand.
  sameAs: [] as string[],
};

export const abs = (path: string) => new URL(path, SITE.url).toString();
