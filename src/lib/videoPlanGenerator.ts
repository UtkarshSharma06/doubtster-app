// Multilingual and multi-duration video plan generator for Doubtster Video Engine
// Produces verified { solution: {...}, lesson: {...} } schemas tailored to the target language and duration.

export type SupportedLanguage = "en" | "hi" | "fr" | "it" | "es" | "tr";

export const LANGUAGE_META: Record<
  SupportedLanguage,
  { name: string; nativeName: string; code: string; sampleSay: string }
> = {
  en: {
    name: "English",
    nativeName: "English",
    code: "en-US",
    sampleSay: "Let's work through this step by step.",
  },
  hi: {
    name: "Hindi",
    nativeName: "हिन्दी",
    code: "hi-IN",
    sampleSay: "आइए इसे चरणबद्ध तरीके से समझते हैं।",
  },
  fr: {
    name: "French",
    nativeName: "Français",
    code: "fr-FR",
    sampleSay: "Résolvons ce problème étape par étape.",
  },
  it: {
    name: "Italian",
    nativeName: "Italiano",
    code: "it-IT",
    sampleSay: "Risolviamo questo problema passo dopo passo.",
  },
  es: {
    name: "Spanish",
    nativeName: "Español",
    code: "es-ES",
    sampleSay: "Resolvamos este problema paso a paso con claridad.",
  },
  tr: {
    name: "Turkish",
    nativeName: "Türkçe",
    code: "tr-TR",
    sampleSay: "Bu problemi adım adım birlikte çözelim.",
  },
};

export interface PlanGeneratorOptions {
  question: string;
  lang?: string;
  minutes?: number;
  subject?: string;
}

export async function generateVideoPlan(opts: PlanGeneratorOptions): Promise<any> {
  const langKey = ((opts.lang || "en").toLowerCase().slice(0, 2) as SupportedLanguage) in LANGUAGE_META
    ? ((opts.lang || "en").toLowerCase().slice(0, 2) as SupportedLanguage)
    : "en";
  const langMeta = LANGUAGE_META[langKey] || LANGUAGE_META.en;
  const is5Min = Number(opts.minutes) === 5;
  const targetWords = is5Min ? "650 to 850 spoken words" : "250 to 350 spoken words";
  const numBoards = is5Min ? "5 to 8 distinct board scenes" : "2 to 4 board scenes";

  const systemPrompt = `You are Doubtster AI, a world-class master teacher and explainer video director.
Your job is to generate a complete, rigorous, high-quality video lesson plan JSON object for a student asking a doubt.

CRITICAL REQUIREMENTS:
1. LANGUAGE: The video must be written entirely in ${langMeta.name} (${langMeta.nativeName}).
   - All spoken "say" narration strings MUST be natural, grammatically flawless, warm, and spoken in ${langMeta.name}.
   - All titles, headings, plan descriptions, explanations, and warnings MUST be in ${langMeta.name}.
   - Standard mathematical LaTeX (e.g. "2x + 6 = 10", "\\frac{a}{b}") remains standard LaTeX, but verbal explanations of the steps in "say" must be in ${langMeta.name}.
2. TARGET DURATION: ${is5Min ? "5 MINUTES DEEP-DIVE MASTERCLASS" : "2 MINUTES QUICK EXPLAINER"}.
   - Spoken words requirement: Provide ${targetWords} total across all scenes.
   ${is5Min
     ? `- For 5 minutes, DO NOT provide a short summary. Provide an exhaustive, deeply educational breakdown:
        * Full conceptual intuition & motivation (why this concept exists, real-world context).
        * Clear roadmap plan of attack.
        * ${numBoards} covering EVERY algebraic/derivation step in detail without skipping intermediate steps.
        * Explain WHY each theorem or formula applies at each step.
        * Provide an explicit sanity check and unit/boundary verification.
        * Detail common student mistakes and traps to avoid.
        * A full summary recap and a practice prompt for the student.`
     : `- For 2 minutes, provide a crisp, clear, step-by-step explainer with ${numBoards}, the answer, check, and common mistake.`}
3. OUTPUT FORMAT: Return ONLY a valid JSON object with EXACTLY this structure:
{
  "solution": {
    "title": "Short title in ${langMeta.name}",
    "subject": "${opts.subject || "maths"}",
    "knowns": ["Given item 1", "Given item 2"],
    "goal": "Clear goal in ${langMeta.name}",
    "method": "Method name in ${langMeta.name}",
    "method_reason": "Why this method works in ${langMeta.name}",
    "steps": [
      {
        "latex": "2x + 6 = 10",
        "explain": "Clear explanation of what changed in ${langMeta.name}",
        "sympy": "Eq(2*x + 6, 10)"
      }
    ],
    "answer_latex": "x = 2",
    "answer_sympy": "Eq(x, 2)",
    "check": "Verification explanation in ${langMeta.name}",
    "common_mistake": "Common misconception in ${langMeta.name}",
    "diagram": null,
    "graph": null,
    "context_image": null,
    "code": null,
    "choices": [],
    "correct": null
  },
  "lesson": {
    "title": "Title in ${langMeta.name}",
    "subject": "${opts.subject || "maths"}",
    "scenes": [
      {
        "type": "title",
        "heading": "Heading in ${langMeta.name}",
        "subheading": "Subheading in ${langMeta.name}",
        "say": ["Hook sentence in ${langMeta.name}"]
      },
      {
        "type": "plan",
        "knowns": ["Known in ${langMeta.name}"],
        "goal": "Goal in ${langMeta.name}",
        "method": "Method in ${langMeta.name}",
        "why": "Why in ${langMeta.name}",
        "say": ["Roadmap sentence 1", "Roadmap sentence 2 in ${langMeta.name}"]
      },
      {
        "type": "board",
        "heading": "Board heading in ${langMeta.name}",
        "lines": [
          {
            "step": 0,
            "show": "write",
            "parts": [
              { "tex": "2x + 6 = 10", "say": "Spoken explanation while writing in ${langMeta.name}" }
            ],
            "marks": [],
            "note": null
          }
        ]
      },
      {
        "type": "answer",
        "tex": "Final answer LaTeX",
        "caption": "Short caption in ${langMeta.name}",
        "say": ["Final conclusion sentence in ${langMeta.name}"]
      },
      {
        "type": "check",
        "lines": [
          {
            "step": 0,
            "show": "write",
            "parts": [{ "tex": "2(2) + 6 = 10", "say": "Check explanation in ${langMeta.name}" }],
            "marks": [],
            "note": null
          }
        ]
      },
      {
        "type": "mistake",
        "wrong_tex": null,
        "text": "Mistake description in ${langMeta.name}",
        "say": ["What to watch out for in ${langMeta.name}"]
      }
    ]
  }
}

RULES FOR LINES & SCENES:
- In "board" scenes, every line has "step": <index in solution.steps>, "show": "write"|"morph", "parts": [{ "tex": "...", "say": "..." }].
- Concat of "parts.tex" must match the step's latex.
- Each scene's "say" array has spoken sentences. Write complete, friendly, teacher-like spoken sentences in ${langMeta.name}.
- Do NOT output markdown code blocks (no \`\`\`json). Output pure JSON.
- Escape LaTeX backslashes properly in JSON (e.g. \\\\frac or \\\\cdot).`;

  const userPrompt = `Topic or Question: "${opts.question.trim()}"
Language requested: ${langMeta.name} (${langMeta.nativeName})
Target Duration: ${opts.minutes || 2} minutes (${targetWords})`;

  const groqKey = process.env.GROQ_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;

  let rawJson = "";

  // 1. Primary: Groq Cloud (ultra fast response)
  if (groqKey) {
    try {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-120b",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 8192,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        rawJson = d.choices?.[0]?.message?.content || "";
      } else if (d.error?.failed_generation) {
        // Groq strict validator rejected unescaped LaTeX backslash, but failed_generation has the JSON!
        rawJson = d.error.failed_generation;
      }
    } catch (e) {
      console.warn("[videoPlanGenerator] Groq exception:", e);
    }
  }

  // 2. Secondary: OpenRouter
  if (!rawJson && openRouterKey) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openRouterKey}`,
        },
        body: JSON.stringify({
          model: "deepseek/deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: 8192,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        rawJson = d.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.warn("[videoPlanGenerator] OpenRouter exception:", e);
    }
  }

  // 3. Tertiary: Gemini
  if (!rawJson && geminiKey) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
        })
      });
      if (res.ok) {
        const d = await res.json();
        rawJson = d.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
    } catch (e) {
      console.warn("[videoPlanGenerator] Gemini exception:", e);
    }
  }

  // 4. Quaternary: NVIDIA NIM
  if (!rawJson && nvidiaKey) {
    try {
      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${nvidiaKey}`,
        },
        body: JSON.stringify({
          model: "meta/llama-3.3-70b-instruct",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.2,
          max_tokens: 8192,
        }),
      });
      if (res.ok) {
        const d = await res.json();
        rawJson = d.choices?.[0]?.message?.content || "";
      }
    } catch (e) {
      console.warn("[videoPlanGenerator] NVIDIA exception:", e);
    }
  }

  if (!rawJson) {
    throw new Error("Failed to generate video lesson plan from AI providers.");
  }

  // Sanitize JSON
  let cleaned = rawJson.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-z]*\s*/i, "").replace(/\s*```$/, "");
  }

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    // Attempt relaxed parsing if raw backslashes exist
    const relaxed = cleaned.replace(/\\([a-zA-Z]+)/g, "\\\\$1");
    parsed = JSON.parse(relaxed);
  }

  // Validate basic schema integrity
  if (!parsed.solution || !parsed.lesson || !Array.isArray(parsed.lesson.scenes)) {
    throw new Error("Invalid plan schema returned by AI: missing solution or lesson.scenes");
  }

  // Ensure scenes have valid line step bindings
  const solSteps = parsed.solution.steps || [];
  for (const sc of parsed.lesson.scenes) {
    if (sc.type === "board" && Array.isArray(sc.lines)) {
      for (let li = 0; li < sc.lines.length; li++) {
        const ln = sc.lines[li];
        if (typeof ln.step !== "number" || ln.step < 0 || ln.step >= solSteps.length) {
          ln.step = Math.min(li, Math.max(0, solSteps.length - 1));
        }
        if (!Array.isArray(ln.parts) || ln.parts.length === 0) {
          const fallbackTex = solSteps[ln.step]?.latex || "x";
          ln.parts = [{ tex: fallbackTex, say: solSteps[ln.step]?.explain || "" }];
        }
        if (!Array.isArray(ln.marks)) ln.marks = [];
        if (!ln.show) ln.show = "write";
      }
    }
    if (sc.type === "check" && Array.isArray(sc.lines)) {
      for (const ln of sc.lines) {
        if (!Array.isArray(ln.parts) || ln.parts.length === 0) {
          ln.parts = [{ tex: parsed.solution.answer_latex || "x = 0", say: parsed.solution.check || "" }];
        }
        if (!Array.isArray(ln.marks)) ln.marks = [];
        if (!ln.show) ln.show = "write";
      }
    }
  }

  return parsed;
}
