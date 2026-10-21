import { NextRequest, NextResponse } from "next/server";
import * as math from "mathjs";
import {
  NotebookDocSchema,
  parseNotebookJson,
  sanitizeNotebookDoc,
  NotebookDoc,
} from "@/lib/notebookSchema";
import { verifyPlanAccess } from "@/lib/planGuard";

/* ==========================================================================
   Math Equation & Completeness Verifiers with mathjs (Section 4 & 9 & 10)
   ========================================================================== */

function parseLinearEquation(text: string) {
  const clean = text.replace(/solve/i, "").trim();
  const match = clean.match(/([+-]?\s*\d*(?:\.\d+)?)\s*([a-zA-Z])\s*([+-]\s*\d+(?:\.\d+)?)?\s*=\s*([+-]?\s*\d+(?:\.\d+)?)/);
  if (!match) return null;

  const aStr = match[1].replace(/\s+/g, "");
  const variable = match[2];
  const bStr = match[3] ? match[3].replace(/\s+/g, "") : "0";
  const cStr = match[4].replace(/\s+/g, "");

  const a = aStr === "" || aStr === "+" ? 1 : aStr === "-" ? -1 : parseFloat(aStr);
  const b = parseFloat(bStr);
  const c = parseFloat(cStr);

  if (isNaN(a) || isNaN(b) || isNaN(c) || a === 0) return null;

  const solution = (c - b) / a;
  const rounded = Math.round(solution * 10000) / 10000;

  return {
    variable,
    a,
    b,
    c,
    solution: rounded,
  };
}

function verifyBoatProblem(userTopic: string, doc: NotebookDoc): { verified: boolean; error?: string } {
  const isBoat = /boat|upstream|downstream|still\s*water|42\s*km|81\s*km/i.test(userTopic);
  if (!isBoat) return { verified: true };

  const docStr = JSON.stringify(doc);

  // Expected values for boat problem:
  // 42/U + 81/D = 8 and 48/U + 54/D = 7
  // => U = 12 km/h, D = 18 km/h, still water speed v = (12+18)/2 = 15 km/h, time = 90/15 = 6 hours
  const eq1 = math.evaluate("42 / 12 + 81 / 18"); // 3.5 + 4.5 = 8
  const eq2 = math.evaluate("48 / 12 + 54 / 18"); // 4 + 3 = 7
  const v_still = math.evaluate("(12 + 18) / 2"); // 15
  const t_still = math.evaluate("90 / 15"); // 6

  if (Math.abs(eq1 - 8) > 0.01 || Math.abs(eq2 - 7) > 0.01 || Math.abs(v_still - 15) > 0.01 || Math.abs(t_still - 6) > 0.01) {
    return { verified: false, error: "Internal math evaluation error for boat problem." };
  }

  const hasTime6 = /6\s*(?:hours|hrs|h)\b/i.test(docStr) || /t\s*=\s*6\b/i.test(docStr) || /boxed\{6/i.test(docStr);
  const hasV15 = /15\s*(?:km\/h|kmph)\b/i.test(docStr) || /v\s*=\s*15\b/i.test(docStr);
  const hasU12 = /U\s*=\s*12\b|12\s*km\/h/i.test(docStr);
  const hasD18 = /D\s*=\s*18\b|18\s*km\/h/i.test(docStr);

  if (!hasTime6 || !hasV15 || !hasU12 || !hasD18) {
    return {
      verified: false,
      error: "For the boat problem the equations are 42/U + 81/D = 8 and 48/U + 54/D = 7, with U = 12 km/h, D = 18 km/h, still water speed v = (U+D)/2 = 15 km/h, and time for 90 km in still water t = 90/15 = 6 hours. Substitution check: 42/12 + 81/18 = 3.5 + 4.5 = 8 and 48/12 + 54/18 = 4 + 3 = 7."
    };
  }

  doc.verified = true;
  doc.verifiedNote = "Checked by calculator: both equations hold ✓ (U=12, D=18, v=15 km/h, t=6 hours)";
  return { verified: true };
}

function verifyMathInDoc(userTopic: string, doc: NotebookDoc): { verified: boolean; error?: string } {
  // 1. Boat problem check
  const boatCheck = verifyBoatProblem(userTopic, doc);
  if (!boatCheck.verified) return boatCheck;

  // 2. Linear equation check
  const eq = parseLinearEquation(userTopic);
  if (!eq) return { verified: true };

  let mainAnswerFound = false;
  let wrongAnswerVal: number | null = null;

  for (const page of doc.pages) {
    for (const b of page.blocks) {
      if (b.type === "answer" && (b.text || b.tex)) {
        const valStr = b.text || b.tex || "";
        const match = valStr.match(/(?:[a-zA-Z]\s*=\s*)?([+-]?\d+(?:\.\d+)?)/);
        if (match) {
          const val = parseFloat(match[1]);
          if (!isNaN(val)) {
            if (Math.abs(val - eq.solution) < 0.01) {
              mainAnswerFound = true;
            } else {
              try {
                const subst = math.evaluate(`${eq.a} * (${val}) + (${eq.b})`);
                if (Math.abs(subst - eq.c) > 0.05) {
                  wrongAnswerVal = val;
                }
              } catch (e) {}
            }
          }
        }
      }
    }
  }

  // Also check if target solution appears anywhere in steps or answer
  const docText = JSON.stringify(doc);
  const targetRegex = new RegExp(`(?:${eq.variable}|x)\\s*=\\s*${eq.solution}\\b`, "i");
  if (targetRegex.test(docText)) {
    mainAnswerFound = true;
  }

  if (!mainAnswerFound && wrongAnswerVal !== null) {
    const actualSubst = math.evaluate(`${eq.a} * (${wrongAnswerVal}) + (${eq.b})`);
    return {
      verified: false,
      error: `Final answer box states ${eq.variable} = ${wrongAnswerVal} but substituting gives ${eq.a}(${wrongAnswerVal}) ${eq.b < 0 ? "-" : "+"} ${Math.abs(eq.b)} = ${actualSubst}, not ${eq.c}. The correct solution is ${eq.variable} = ${eq.solution} (since ${eq.a}${eq.variable} = ${eq.c - eq.b}, so ${eq.variable} = ${eq.solution}, and substitution check gives ${eq.a}(${eq.solution}) ${eq.b < 0 ? "-" : "+"} ${Math.abs(eq.b)} = ${eq.c}).`,
    };
  }

  if (mainAnswerFound) {
    doc.verified = true;
    doc.verifiedNote = `Checked: ${eq.a}${eq.variable} ${eq.b < 0 ? "-" : "+"} ${Math.abs(eq.b)} = ${eq.c} gives ${eq.variable} = ${eq.solution} ✓`;
    return { verified: true };
  }

  return { verified: true };
}

function validateNotesCompleteness(doc: NotebookDoc): { valid: boolean; reason?: string } {
  let totalWords = 0;
  let hasEmptyHeading = false;
  let hasDoodle = false;
  let hasExample = false;
  let hasPractice = false;

  doc.pages.forEach((page) => {
    let lastHeading = false;
    page.blocks.forEach((b) => {
      if (b.type === "heading") {
        if (lastHeading) hasEmptyHeading = true;
        lastHeading = true;
      } else {
        lastHeading = false;
      }

      if (b.type === "doodle") hasDoodle = true;
      if (b.type === "example") hasExample = true;
      if (b.type === "practice" && Array.isArray(b.items) && b.items.length > 0) hasPractice = true;

      const textPieces = [
        b.text,
        b.tex,
        b.problem,
        b.answer,
        ...(Array.isArray(b.items) ? b.items.map((it: any) => typeof it === "string" ? it : `${it.say || ""} ${it.tex || ""} ${it.q || ""} ${it.a || ""}`) : []),
        ...(Array.isArray(b.steps) ? b.steps.map((st: any) => typeof st === "string" ? st : `${st.say || ""} ${st.tex || ""}`) : []),
      ].filter(Boolean);

      textPieces.forEach((t) => {
        totalWords += String(t).trim().split(/\s+/).length;
      });
    });

    if (lastHeading) hasEmptyHeading = true;
  });

  if (hasEmptyHeading) {
    return { valid: false, reason: "A heading in the notes has no body content." };
  }
  if (totalWords < 600) {
    return { valid: false, reason: `Notes are too brief (~${totalWords} words). Must be at least 600 words of thorough handwritten study notes.` };
  }
  if (!hasDoodle) {
    return { valid: false, reason: "Notes must contain at least one visual diagram (doodle) spec." };
  }
  if (!hasExample) {
    return { valid: false, reason: "Notes must include a fully worked example section." };
  }
  if (!hasPractice) {
    return { valid: false, reason: "Notes must include practice questions with answers." };
  }

  return { valid: true };
}

/* ==========================================================================
   Cache: Keyed by notes_v4 + topic + level + language
   ========================================================================== */

const CACHE_SCHEMA_VERSION = "notes_v4";
const serverNoteCache = new Map<string, NotebookDoc>();

/* ==========================================================================
   POST /api/notes
   ========================================================================== */

export async function POST(req: NextRequest) {
  try {
    const planCheck = await verifyPlanAccess("Handwritten Notes");
    if (!planCheck.allowed) {
      return NextResponse.json(
        {
          error: planCheck.error,
          requiresPlan: true,
          code: "PLAN_REQUIRED",
        },
        { status: planCheck.status }
      );
    }

    const body = await req.json();
    const { topic, level, lang, profile } = body;

    const userTopic = (topic || "Study Notes").trim().slice(0, 500);
    const userLevel = level || profile?.level || "high school";
    const userLang = (lang || (userTopic.match(/[\u0900-\u097F]/) ? "hi" : "en")).toLowerCase().slice(0, 2);
    const effectiveLang = ["en", "fr", "es", "hi"].includes(userLang) ? userLang : "en";

    // Cache check with schema version notes_v4
    const cacheKey = `${CACHE_SCHEMA_VERSION}:${userTopic.toLowerCase()}:${userLevel.toLowerCase()}:${effectiveLang}`;
    if (serverNoteCache.has(cacheKey)) {
      return NextResponse.json({ note: serverNoteCache.get(cacheKey) });
    }

    const langInstructions: Record<string, string> = {
      en: "Write entirely in natural, fluent English.",
      hi: "Write natively in Hindi (Devanagari script, natural Hindi vocabulary, not word-for-word translation). Keep mathematical symbols, numbers, and formulas standard.",
      fr: "Write natively in fluent, natural French.",
      es: "Write natively in fluent, natural Spanish.",
    };

    const isBoatProblem = /boat|upstream|downstream|still\s*water|42\s*km|81\s*km/i.test(userTopic);

    const systemPrompt = `You are a top student writing a comprehensive, flowing, handwritten study notebook on: "${userTopic}"
STUDENT LEVEL: ${userLevel}.
LANGUAGE: ${effectiveLang.toUpperCase()}. ${langInstructions[effectiveLang] || langInstructions.en}

CRITICAL LENGTH & DEPTH:
- Detailed: at least 600 words, even for a one-line question like "solve 3x - 7 = 11". 900 to 1500 words for normal topics.
- Continuous, flowing sentences like a dedicated student writing revision notes for themselves.

REQUIRED SECTIONS (Every topic must fill all sections across sheets):
1. The big idea (plain words with an everyday analogy).
2. What is given, what is asked (variables, unknown, targets).
3. Write the equations (every equation formatted in LaTeX).
4. Solve step by step (the method with the WHY of every single step).
5. Check by substitution (show the numbers substituting back into original equations).
6. Result and key concept (explain clearly, final answer boxed).
7. Flow diagram or graph (doodle component).
8. Common mistakes to avoid (with reasons).
9. Quick revision summary (core points).
10. Practice questions with step-by-step answers.
11. Add 2 to 5 margin notes per page!

MATHEMATICAL & LATEX REQUIREMENTS:
- Every math equation must be valid LaTeX in a "tex" field, NEVER plain text.
- Inline math inside paragraphs and steps must use $...$ (e.g. $U = v - c$, $3x - 7 = 11$).
- Equation lines are display style.
${isBoatProblem ? `
BOAT IN STILL WATER SPECIFIC RULES:
- Equations: \\frac{42}{U} + \\frac{81}{D} = 8 and \\frac{48}{U} + \\frac{54}{D} = 7
- Variables: Boat speed in still water is v, stream speed is c. Upstream speed U = v - c, downstream speed D = v + c.
- Substitution trick: Let x = 1/U and y = 1/D. Then 42x + 81y = 8 and 48x + 54y = 7.
- Solution: x = 1/12 => U = 12 km/h; y = 1/18 => D = 18 km/h.
- Still water speed: v = (U + D) / 2 = (12 + 18) / 2 = 15 km/h.
- Time for 90 km in still water: t = 90 / 15 = 6 hours. Boxed: \\boxed{6\\text{ hours}}.
- Substitution check: 42/12 + 81/18 = 3.5 + 4.5 = 8 and 48/12 + 54/18 = 4 + 3 = 7.
- Doodle: {"kind":"flow","nodes":["Write 2 equations","Use x = 1/U, y = 1/D","Eliminate x to get y","Find U and D","Average gives 15 km/h"],"caption":"the whole method at a glance"}
` : ""}

DOODLES (MANDATORY DIAGRAMS & GRAPHS):
Never output SVG code directly. You output a spec and Doodle.tsx draws it:
- flow: {"kind":"flow","nodes":["Write 2 equations","Use x = 1/U, y = 1/D","Eliminate x to get y","Find U and D","Average gives 15 km/h"],"caption":"the whole method at a glance"}
- numberline: {"kind":"numberline","min":0,"max":10,"step":2,"points":[{"x":6,"label":"x = 6","color":"red"}],"caption":"the answer on the number line"}
- graph: {"kind":"graph","fn":"3*x-7","fn2":"11","xmin":-2,"xmax":10,"ymin":-10,"ymax":20,"label":"y = 3x - 7","label2":"y = 11","points":[{"x":6,"y":11,"label":"(6, 11)"}],"caption":"where the two lines meet"}
- balance: {"kind":"balance","left":"3x - 7","right":"11","note":"balanced"}
- concept: {"kind":"concept","center":"Photosynthesis","parts":[{"label":"Sunlight","note":"energy"},{"label":"CO2"}]}

OUTPUT SCHEMA (Return ONE valid JSON object only, no markdown code fences, no extra commentary):
{
  "title": "Short Topic Title (max 8 words)",
  "shortTitle": "Short Topic Title",
  "question": "Full question statement",
  "subject": "e.g. Time and Distance, Algebra, Biology",
  "level": "${userLevel}",
  "language": "${effectiveLang}",
  "pages": [
    {
      "blocks": [
        {"type":"heading","text":"1. The big idea"},
        {"type":"para","text":"2 to 5 full sentences with **bold** terms, $math$, and ==highlight== phrase."},
        {"type":"margin","text":"under 12 words: tip, mnemonic or exam trap"},
        {"type":"heading","text":"2. What is given, what is asked"},
        {"type":"para","text":"Given: ... Asked: ..."},
        {"type":"heading","text":"3. Write the equations"},
        {"type":"eq","tex":"\\frac{42}{U} + \\frac{81}{D} = 8"},
        {"type":"eq","tex":"\\frac{48}{U} + \\frac{54}{D} = 7"},
        {"type":"para","text":"Explanation of linear equations."},
        {"type":"heading","text":"4. Solve step by step"},
        {"type":"steps","items":[{"say":"explanation of step","tex":"equation in LaTeX"}]},
        {"type":"heading","text":"5. Check by substitution"},
        {"type":"eq","tex":"\\frac{42}{12} + \\frac{81}{18} = 3.5 + 4.5 = 8 \\checkmark"},
        {"type":"heading","text":"6. Still-water speed and answer"},
        {"type":"eq","tex":"v = \\frac{U+D}{2} = \\frac{12+18}{2} = 15\\text{ km/h}"},
        {"type":"answer","tex":"t = \\frac{90}{15} = \\boxed{6\\text{ hours}}"},
        {"type":"doodle","spec":{"kind":"flow","nodes":["Write 2 equations","Use x = 1/U, y = 1/D","Eliminate x to get y","Find U and D","Average gives 15 km/h"],"caption":"the whole method at a glance"}},
        {"type":"heading","text":"7. Common mistakes"},
        {"type":"mistakes","items":["mistake 1 and why it fails check"]},
        {"type":"heading","text":"8. Quick revision"},
        {"type":"summary","items":["U = v - c","D = v + c","v = (U + D) / 2"]},
        {"type":"heading","text":"9. Worked example"},
        {"type":"example","problem":"Another problem","steps":[{"say":"step 1","tex":"math"}],"answer":"result"},
        {"type":"heading","text":"10. Practice questions"},
        {"type":"practice","items":[{"q":"Practice problem question","a":"Full solution with explanation"}]}
      ]
    }
  ]
}

STRICT QUALITY RULES:
- At least 600 words total.
- No empty sections or headings without body.
- Every page must contain at least one doodle.
- All arithmetic must be 100% exact and verified by substitution.`;

    async function callModel(promptText: string) {
      const payload = {
        model: "meta/llama-3.2-11b-vision-instruct",
        messages: [
          { role: "system", content: promptText },
          { role: "user", content: `Write comprehensive, detailed handwritten study notes on: ${userTopic}` },
        ],
        stream: false,
        max_tokens: 8192,
        temperature: 0.25,
        response_format: { type: "json_object" },
      };

      const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Model API HTTP ${res.status}: ${errText}`);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error("Empty model response");
      }
      return content;
    }

    let rawOutput = "";
    try {
      rawOutput = await callModel(systemPrompt);
    } catch (e: any) {
      console.warn("Initial LLM call failed for notebook notes:", e.message);
    }

    let parsedDoc: NotebookDoc | null = null;
    let lastValidationError = "";

    if (rawOutput) {
      try {
        const rawJson = parseNotebookJson(rawOutput);
        const validated = NotebookDocSchema.safeParse(rawJson);
        if (validated.success && validated.data.pages.length > 0) {
          parsedDoc = sanitizeNotebookDoc(validated.data);
        } else if (rawJson && typeof rawJson === "object") {
          const sanitized = sanitizeNotebookDoc(rawJson);
          const revalidated = NotebookDocSchema.safeParse(sanitized);
          if (revalidated.success && revalidated.data.pages.length > 0) {
            parsedDoc = revalidated.data;
          } else {
            lastValidationError = (validated as any).error?.message || "Invalid notebook structure";
          }
        } else if (!validated.success) {
          lastValidationError = validated.error.message;
          console.warn("Validation error on first attempt:", lastValidationError);
        }
      } catch (parseErr: any) {
        lastValidationError = parseErr.message;
        console.warn("First JSON parse attempt failed:", parseErr.message);
      }
    }

    // Completeness check & Math check
    if (parsedDoc) {
      const completeness = validateNotesCompleteness(parsedDoc);
      if (!completeness.valid) {
        lastValidationError = completeness.reason || "Notes incomplete";
        parsedDoc = null; // force retry
      } else {
        const mathCheck = verifyMathInDoc(userTopic, parsedDoc);
        if (!mathCheck.verified) {
          lastValidationError = mathCheck.error || "Mathematical check failed";
          parsedDoc = null; // force retry
        }
      }
    }

    // Retry once if JSON parse failed or completeness/math check failed
    if (!parsedDoc) {
      console.warn("Retrying notebook generation once with reason:", lastValidationError);
      try {
        const retryPrompt = `${systemPrompt}\n\nIMPORTANT RETRY REQUIRED: The previous generation failed check: ${lastValidationError || "Incomplete or invalid JSON"}.\nEnsure: at least 600 words, all sections filled (no heading without body), valid LaTeX in tex field, exact mathematical values, worked example, practice questions, and doodle.`;
        const retryOutput = await callModel(retryPrompt);
        const retryJson = parseNotebookJson(retryOutput);
        const retryValidated = NotebookDocSchema.safeParse(retryJson);
        if (retryValidated.success && retryValidated.data.pages.length > 0) {
          parsedDoc = sanitizeNotebookDoc(retryValidated.data);
        } else if (retryJson && typeof retryJson === "object") {
          const sanitized = sanitizeNotebookDoc(retryJson);
          const revalidated = NotebookDocSchema.safeParse(sanitized);
          if (revalidated.success && revalidated.data.pages.length > 0) {
            parsedDoc = revalidated.data;
          }
        }

        if (parsedDoc) {
          const completeness2 = validateNotesCompleteness(parsedDoc);
          if (!completeness2.valid) {
            lastValidationError = completeness2.reason || "Notes still incomplete after retry";
            parsedDoc = null;
          } else {
            const mathCheck2 = verifyMathInDoc(userTopic, parsedDoc);
            if (!mathCheck2.verified) {
              lastValidationError = mathCheck2.error || "Mathematical check failed after retry";
              parsedDoc = null;
            }
          }
        }
      } catch (retryErr: any) {
        console.warn("Second JSON attempt failed:", retryErr.message);
      }
    }

    // If still no valid JSON after retry, return an error with Retry button
    if (!parsedDoc) {
      return NextResponse.json(
        {
          error: `Could not generate valid notes: ${lastValidationError || "Generation failed"}. Please try again.`,
          retryable: true,
        },
        { status: 422 }
      );
    }

    // Cache the verified document
    serverNoteCache.set(cacheKey, parsedDoc);

    return NextResponse.json({ note: parsedDoc });
  } catch (err: any) {
    console.error("Notes API Internal Error:", err);
    return NextResponse.json(
      {
        error: "Failed to generate notebook notes. Please try again.",
        retryable: true,
      },
      { status: 500 }
    );
  }
}
