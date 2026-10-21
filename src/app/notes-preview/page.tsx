"use client";

import React, { useState } from "react";
import { NotebookNotes } from "@/components/notes/NotebookNotes";
import { NotebookDoc } from "@/lib/notebookSchema";

// Fixture 0: Exact slide from the reference screenshot: Chapter 4 Quadratic Equations Example 15
export const FIXTURE_EX15_QUADRATIC_BOAT: NotebookDoc = {
  title: "Quadratic Equations",
  shortTitle: "Quadratic Equations",
  chapter: "Chapter 4",
  pageNo: "86",
  exampleNo: "15",
  question:
    "Example 15: A motor boat whose speed is 18km/h in __still water__ takes 1hour more to go 24km upstream than to return downstream to the same spot. Find the speed of the stream.",
  subject: "Quadratic Equations",
  level: "Chapter 4",
  language: "en",
  verified: true,
  verifiedNote: "Checked by quadratic formula: x = 6 km/hr ✓",
  pages: [
    {
      blocks: [
        {
          type: "doodle",
          spec: {
            kind: "boat",
            distance: "24km",
            speed: "18km/h",
            caption: "River current, boat speed, and upstream vector",
          },
        },
        {
          type: "steps",
          items: [
            {
              say: "Let the speed of stream = $x$ km/hr",
            },
            {
              say: "Speed of boat upstream = $18\\text{ km/h} - x\\text{ km/hr} = (18 - x)\\text{ km/hr}$",
            },
            {
              say: "Speed of boat downstream = $18\\text{ km/h} + x\\text{ km/hr} = (18 + x)\\text{ km/hr}$",
            },
            {
              say: "Time taken upstream = $\\frac{24}{18-x}\\text{ hr}$ and downstream = $\\frac{24}{18+x}\\text{ hr}$",
              tex: "\\frac{24}{18 - x} - \\frac{24}{18 + x} = 1",
            },
            {
              say: "Simplifying the rational expression:",
              tex: "24\\left[\\frac{(18+x) - (18-x)}{(18-x)(18+x)}\\right] = 1 \\implies 24(2x) = 324 - x^2",
            },
            {
              say: "Standard quadratic form:",
              tex: "x^2 + 48x - 324 = 0",
            },
            {
              say: "Factorise $(x + 54)(x - 6) = 0$. Since speed cannot be negative:",
              tex: "x = 6\\text{ km/hr}",
            },
          ],
        },
        {
          type: "answer",
          tex: "\\text{Speed of the stream } = \\boxed{6\\text{ km/hr}}",
        },
      ],
    },
  ],
};

// Fixture 1: Exact reference content for Boat in Still Water from reference picture
const FIXTURE_BOAT: NotebookDoc = {
  title: "Boat in Still Water",
  shortTitle: "Boat in Still Water",
  question: "A boat covers 42 km upstream and 81 km downstream in 8 hours, and 48 km upstream and 54 km downstream in 7 hours. Find the time to cover 90 km in still water.",
  subject: "Time and Distance",
  level: "Class 10",
  language: "en",
  verified: true,
  verifiedNote: "Checked by calculator: both equations hold ✓",
  pages: [
    {
      blocks: [
        { type: "heading", text: "1. The big idea" },
        {
          type: "para",
          text: "Against the stream the boat slows down, with the stream it speeds up. If the boat alone goes at $v$ and the stream at $c$, then ==upstream speed $U = v - c$== and ==downstream speed $D = v + c$==. $\\text{Time} = \\text{distance} \\div \\text{speed}$.",
        },
        {
          type: "margin",
          text: "Think of a walkway: with it you are faster, against it slower.",
        },
        { type: "heading", text: "2. What is given, what is asked" },
        {
          type: "para",
          text: "Unknowns: $U$ and $D$ (km/h). Asked: time for 90 km in still water, so I need $v$ first.",
        },
        { type: "heading", text: "3. Write the equations" },
        {
          type: "eq",
          tex: "\\frac{42}{U} + \\frac{81}{D} = 8 \\qquad (1)",
        },
        {
          type: "eq",
          tex: "\\frac{48}{U} + \\frac{54}{D} = 7 \\qquad (2)",
        },
        {
          type: "para",
          text: "Fractions are awkward. Let $x = 1/U$ and $y = 1/D$. Now both are ordinary linear equations.",
        },
        {
          type: "margin",
          text: "Substitution trick: turn 1/U into x.",
        },
        {
          type: "eq",
          tex: "42x + 81y = 8 \\qquad 48x + 54y = 7",
        },
        { type: "heading", text: "4. Solve step by step" },
        {
          type: "steps",
          items: [
            {
              say: "Make the $x$ terms equal: multiply (1) by 48 and (2) by 42.",
              tex: "2016x + 3888y = 384 \\qquad 2016x + 2268y = 294",
            },
            {
              say: "Subtract. The $x$ terms cancel.",
              tex: "1620y = 90 \\implies y = \\frac{1}{18} \\implies D = 18",
            },
            {
              say: "Put $y$ back into (1) to find $x$.",
              tex: "42x + \\frac{81}{18} = 8 \\implies 42x = 3.5 \\implies x = \\frac{1}{12} \\implies U = 12",
            },
          ],
        },
        { type: "heading", text: "5. Check (always)" },
        {
          type: "eq",
          tex: "\\frac{42}{12} + \\frac{81}{18} = 3.5 + 4.5 = 8 \\checkmark",
        },
        {
          type: "eq",
          tex: "\\frac{48}{12} + \\frac{54}{18} = 4 + 3 = 7 \\checkmark",
        },
        { type: "heading", text: "6. Still-water speed and the answer" },
        {
          type: "para",
          text: "$v$ is halfway between $U$ and $D$, because $U = v - c$ and $D = v + c$. Adding them cancels $c$.",
        },
        {
          type: "margin",
          text: "Add U and D: the stream cancels out.",
        },
        {
          type: "eq",
          tex: "v = \\frac{U+D}{2} = \\frac{12+18}{2} = 15\\text{ km/h}",
        },
        {
          type: "answer",
          tex: "t = \\frac{90}{15} = \\boxed{6\\text{ hours}}",
        },
        {
          type: "doodle",
          spec: {
            kind: "flow",
            nodes: [
              "Write 2 equations",
              "Use x = 1/U, y = 1/D",
              "Eliminate x to get y",
              "Find U and D",
              "Average gives 15 km/h",
            ],
            caption: "the whole method at a glance",
          },
        },
        { type: "heading", text: "7. Common mistakes" },
        {
          type: "mistakes",
          items: [
            "Using U = 6 and D = 18. It fails equation (1): 42/6 + 81/18 = 11.5, not 8.",
            "Using the speed average of the two equations instead of solving them together.",
            "Skipping the check.",
          ],
        },
        { type: "heading", text: "8. Quick revision" },
        {
          type: "summary",
          items: [
            "U = v - c",
            "D = v + c",
            "v = (U + D) / 2",
            "1/U = x trick",
          ],
        },
      ],
    },
  ],
};

// Fixture 2: Exact reference content for "solve 3x - 7 = 11"
const FIXTURE_SOLVE_3X: NotebookDoc = {
  title: "Linear Equations: solve 3x − 7 = 11",
  shortTitle: "Linear Equations",
  question: "Solve 3x − 7 = 11",
  subject: "Class 8 Algebra",
  level: "Class 8",
  language: "en",
  verified: true,
  verifiedNote: "Checked: 3(6) − 7 = 18 − 7 = 11 gives x = 6 ✓",
  pages: [
    {
      blocks: [
        { type: "heading", text: "1. What are we really doing?" },
        {
          type: "para",
          text: "An equation is a **balance scale**. The left side weighs the same as the right side. Whatever I do to one side I must do to the other, or the scale tips over. My goal is to get ==x alone== on one side, so the scale tells me what x weighs.",
        },
        {
          type: "margin",
          text: "Think of a see-saw. Add a kid on one end and you need a kid on the other.",
        },
        {
          type: "doodle",
          spec: {
            kind: "balance",
            left: "3x − 7",
            right: "11",
            note: "balanced",
            caption: "both sides weigh the same, so I can only change them together",
          },
        },
        { type: "heading", text: "2. Read the equation like a story" },
        {
          type: "para",
          text: "$3x − 7 = 11$ says: take $x$, **multiply by 3**, then **subtract 7**, and you land on 11. To walk back to $x$ I undo the steps in reverse order. The last thing done is the first thing undone, so I ==add 7 first== and then ==divide by 3==.",
        },
        {
          type: "margin",
          text: "Shoes and socks! Socks went on first, so they come off last.",
        },
        { type: "heading", text: "3. Solution, step by step" },
        {
          type: "steps",
          items: [
            {
              say: "Cancel the −7 by adding 7 to both sides.",
              tex: "3x - 7 + 7 = 11 + 7 \\implies 3x = 18",
            },
            {
              say: "Now x is stuck to a 3 (multiplication). Divide both sides by 3 to free it.",
              tex: "3x \\div 3 = 18 \\div 3 \\implies x = 6",
            },
            {
              say: "Check. Put 6 back into the original equation.",
              tex: "3(6) - 7 = 18 - 7 = 11 \\quad \\checkmark \\text{ left = right}",
            },
          ],
        },
        { type: "answer", tex: "\\boxed{x = 6}" },
        { type: "margin", text: "Check = free marks." },
        { type: "heading", text: "4. Picture it: where x lives" },
        {
          type: "doodle",
          spec: {
            kind: "numberline",
            min: 0,
            max: 10,
            step: 2,
            points: [{ x: 6, label: "x = 6", color: "red" }],
            caption: "3x − 7 = 11 is true only here",
          },
        },
        {
          type: "para",
          text: "Any other point on the line breaks the equation. At $x = 4$ I get $3(4) − 7 = 5$, which is too small. At $x = 8$ I get $17$, which is too big. Only $x = 6$ gives exactly 11.",
        },
        { type: "heading", text: "5. Why does it work?" },
        {
          type: "para",
          text: "Adding 7 and subtracting 7 cancel each other. They are **inverse operations**. The same is true for $\\times 3$ and $\\div 3$. Because I do the same thing to both sides, the scale stays level, so the solution never changes while I simplify. That is why $x = 6$ at the end is still the answer to the equation I started with.",
        },
        { type: "margin", text: "Inverse pairs: + and −, × and ÷." },
        { type: "heading", text: "6. Common mistakes" },
        {
          type: "mistakes",
          items: [
            "Adding 7 to only one side. The scale tips and the answer is wrong.",
            "Dividing by 3 first but forgetting that 7 must be divided too. Correct: (3x − 7) ÷ 3 = x − 7/3.",
            "Writing x = 6 and never checking it.",
            "Getting 4.67? You divided 14 by 3. The 14 came from 11 + 3 instead of 11 + 7.",
          ],
        },
        { type: "heading", text: "7. Another one, worked fully" },
        {
          type: "example",
          problem: "5x + 2 = 27",
          steps: [
            { say: "Subtract 2 from both sides.", tex: "5x + 2 - 2 = 27 - 2 \\implies 5x = 25" },
            { say: "Divide by 5.", tex: "x = 25 \\div 5 \\implies x = 5" },
          ],
          answer: "5 (Check: 5(5) + 2 = 27 ✓)",
        },
        { type: "heading", text: "8. Quick summary" },
        {
          type: "summary",
          items: [
            "Undo in reverse order",
            "Same on both sides",
            "Always check by substitution",
          ],
        },
        { type: "heading", text: "9. Your turn" },
        {
          type: "practice",
          items: [
            { q: "Solve 4x − 9 = 15", a: "x = 6 (since 4x = 24)" },
            { q: "Solve 2x + 7 = 1", a: "x = -3 (since 2x = -6)" },
            { q: "Solve x/3 + 4 = 9", a: "x = 15 (since x/3 = 5)" },
          ],
        },
      ],
    },
  ],
};

export default function NotesPreviewPage() {
  const [selectedTopic, setSelectedTopic] = useState<"ex15" | "boat" | "solve">("ex15");
  const [liveDoc, setLiveDoc] = useState<NotebookDoc | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFetchLive = async (topic: string, lang = "en") => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, lang }),
      });
      const data = await res.json();
      if (data && data.note) {
        setLiveDoc(data.note);
      } else {
        setErrorMsg(data.error || "Failed to generate notes.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Network error.");
    } finally {
      setLoading(false);
    }
  };

  let activeDoc: NotebookDoc = FIXTURE_EX15_QUADRATIC_BOAT;
  if (selectedTopic === "boat") {
    activeDoc = FIXTURE_BOAT;
  } else if (selectedTopic === "solve") {
    activeDoc = FIXTURE_SOLVE_3X;
  }
  if (liveDoc) {
    activeDoc = liveDoc;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--desk, #d9d2c3)" }}>
      {/* Test Bar to switch topics */}
      <div
        style={{
          background: "#1e293b",
          color: "#fff",
          padding: "8px 16px",
          display: "flex",
          gap: "10px",
          alignItems: "center",
          flexWrap: "wrap",
          fontSize: "13px",
        }}
      >
        <span style={{ fontWeight: 700, color: "#facc15" }}>WHITEBOARD & NOTES PREVIEW:</span>
        <button
          type="button"
          onClick={() => { setSelectedTopic("ex15"); setLiveDoc(null); }}
          style={{ padding: "4px 12px", background: selectedTopic === "ex15" && !liveDoc ? "#c62828" : "#334155", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: selectedTopic === "ex15" ? 700 : 400 }}
        >
          ★ Example 15 (Reference Slide)
        </button>
        <button
          type="button"
          onClick={() => { setSelectedTopic("boat"); setLiveDoc(null); }}
          style={{ padding: "4px 10px", background: selectedTopic === "boat" && !liveDoc ? "#b3261e" : "#334155", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Fixture: Boat in Still Water
        </button>
        <button
          type="button"
          onClick={() => { setSelectedTopic("solve"); setLiveDoc(null); }}
          style={{ padding: "4px 10px", background: selectedTopic === "solve" && !liveDoc ? "#b3261e" : "#334155", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          Fixture: solve 3x - 7 = 11
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={() => { setSelectedTopic("ex15"); handleFetchLive("A motor boat whose speed is 18km/h in still water takes 1hour more to go 24km upstream than to return downstream to the same spot. Find the speed of the stream."); }}
          style={{ padding: "4px 10px", background: "#2563eb", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer" }}
        >
          {loading ? "Generating..." : "Live API: Example 15"}
        </button>
        {errorMsg && <span style={{ color: "#f87171" }}>{errorMsg}</span>}
      </div>

      <NotebookNotes note={activeDoc} />
    </div>
  );
}
