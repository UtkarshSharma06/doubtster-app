import { LLMMessage, LLMOptions, LLMProvider } from "./types";

function extractContentText(content: LLMMessage["content"]): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map((c) => (c.type === "text" ? c.text : "")).join(" ");
  }
  return "";
}

export class MockProvider implements LLMProvider {
  name = "Mock Provider";

  async chat(messages: LLMMessage[], options?: LLMOptions): Promise<string> {
    const rawContent = [...messages].reverse().find((m) => m.role === "user")?.content || "";
    const lower = extractContentText(rawContent).toLowerCase().trim();

    // Check if this was an intent classification call
    const isClassifier = messages.some((m) => {
      const text = extractContentText(m.content).toLowerCase();
      return (
        text.includes("intent classifier") ||
        text.includes("intent classification") ||
        text.includes("classify the intent")
      );
    });
    if (isClassifier) {
      if (lower.includes("bonjour") || lower.includes("comment")) {
        return JSON.stringify({
          intent: "NEW_QUESTION",
          subject: "Physique",
          topic: "mouvement de projectile",
          language: "fr",
          confidence: 0.95,
          reason: "Question en français",
        });
      }
      if (lower.includes("नमस्ते") || lower.includes("गति")) {
        return JSON.stringify({
          intent: "NEW_QUESTION",
          subject: "भौतिक विज्ञान",
          topic: "प्रक्षेप्य गति",
          language: "hi",
          confidence: 0.95,
          reason: "हिंदी में प्रश्न",
        });
      }
      if (lower === "hi" || lower === "hello" || lower.includes("stress") || lower.includes("lol") || lower.includes("tired")) {
        return JSON.stringify({
          intent: "SMALL_TALK",
          language: "en",
          confidence: 0.99,
          reason: "Casual greeting / conversational",
        });
      }
      if (lower.includes("thanks") || lower.includes("thank you")) {
        return JSON.stringify({
          intent: "SMALL_TALK",
          language: "en",
          confidence: 0.99,
          reason: "Gratitude / closing remark",
        });
      }
      if (lower.includes("why do we double") || lower.includes("how did you get 17.32") || lower.includes("why vy = 0")) {
        return JSON.stringify({
          intent: "CLARIFY",
          refersTo: { stepId: "st3", label: "T = 2 × 1.02 s" },
          language: "en",
          confidence: 0.95,
          reason: "Asking why a specific step was taken",
        });
      }
      if (lower.includes("cliff") || lower.includes("what if")) {
        return JSON.stringify({
          intent: "WHAT_IF",
          refersTo: { stepId: "card1", label: "Initial projectile question" },
          language: "en",
          confidence: 0.95,
          reason: "Changing a condition (cliff height)",
        });
      }
      if (lower.includes("still don't get") || lower.includes("explain simpler") || lower.includes("don't understand")) {
        return JSON.stringify({
          intent: "RE_EXPLAIN",
          language: "en",
          confidence: 0.95,
          reason: "Requesting alternative explanation",
        });
      }
      if (lower.includes("how far does it land again") || lower.includes("what was the range again") || lower.includes("so how far")) {
        return JSON.stringify({
          intent: "REPEAT",
          refersTo: { stepId: "st4", label: "Range calculation" },
          language: "en",
          confidence: 0.95,
          reason: "Asking for previously calculated result",
        });
      }
      if (lower.includes("chat free") || lower.includes("how do videos work") || lower.includes("what can you do")) {
        return JSON.stringify({
          intent: "META",
          language: "en",
          confidence: 0.95,
          reason: "Question about Doubtster functionality",
        });
      }
      return JSON.stringify({
        intent: "NEW_QUESTION",
        subject: "physics",
        topic: "projectile motion",
        level: "grade 11-12",
        language: "en",
        confidence: 0.95,
        reason: "New physics or educational problem",
      });
    }

    // Small talk responses
    if (lower === "hi" || lower === "hello") {
      return "Hey! 👋 What are you working on today?";
    }
    if (lower.includes("stress") || lower.includes("behind")) {
      return "Oof, the night-before feeling. You're not as behind as it feels, though. What topics are on the test? Let's start with the one that scares you most.";
    }
    if (lower.includes("thanks")) {
      return "Anytime! You clearly get it now. Get some sleep tonight, it helps more than one extra hour of revision. Good luck tomorrow 🍀";
    }

    // Clarification on doubling time
    if (lower.includes("why do we double")) {
      return JSON.stringify({
        intent: "CLARIFY",
        refersTo: { stepId: "st3", label: "about step 3: T = 2 × 1.02 s" },
        text: "Because the trip is symmetric. Gravity takes the ball from 10 m/s up to 0 in 1.02 s, then speeds it from 0 back to 10 m/s downward in exactly the same time.\n\nThis only works when it lands at the same height it started from. Off a cliff or onto a table, you can't just double it.",
        handNote: "quick test: up-time = down-time only on flat ground",
        timeline: {
          leftLabel: "going up · 1.02 s",
          leftColor: "#2F7BFF",
          rightLabel: "coming down · 1.02 s",
          rightColor: "#1F9D55",
        },
      });
    }

    // What-if cliff response
    if (lower.includes("cliff")) {
      return JSON.stringify({
        intent: "WHAT_IF",
        refersTo: { stepId: "card1", label: "same kick as before: vx = 17.32, vy = 10" },
        text: "Nice, this is exactly the case where doubling breaks. The split velocity stays the same; only the landing height changes, so solve for when the height hits -10 m:\n\n$-10 = 10t - 4.9t^2 \\rightarrow 4.9t^2 - 10t - 10 = 0 \\rightarrow t = 2.78\\text{ s}$",
        diffTiles: [
          { label: "time in air", value: "2.78 s", diff: "+0.74 s" },
          { label: "range", value: "48.1 m", diff: "+12.8 m" },
          { label: "highest point above ground", value: "15.1 m", diff: "10 + 5.1" },
          { label: "speed when it lands", value: "24.4 m/s", diff: "faster than 20" },
        ],
        chart: {
          kind: "trajectory",
          v0: 20,
          angleDeg: 30,
          g: 9.8,
          h0: 10,
        },
      });
    }

    // Re-explain split velocity
    if (lower.includes("split part") || lower.includes("still don't get")) {
      return JSON.stringify({
        intent: "RE_EXPLAIN",
        text: "Totally fair, let's try it without formulas. Picture two torches shining on the ball:\n\nThe real ball is just both shadows happening at once. That's all 'splitting' means: we study the floor shadow (steady) and the wall shadow (thrown straight up) separately, then put them back together.\n\nDoes that click better? If yes, try this: at the very top of the path, which shadow has stopped?",
        analogy: {
          leftTitle: "Torch from above",
          leftDesc: "moves the same distance every second → vx",
          rightTitle: "Torch from the side",
          rightDesc: "goes up, slows, stops, falls back → vy",
          kind: "shadows",
        },
      });
    }

    // Repeat result
    if (lower.includes("how far does it land again")) {
      return JSON.stringify({
        intent: "REPEAT",
        refersTo: { stepId: "st4", label: "see the flat-ground working" },
        text: "35.3 m on flat ground, or 48.1 m if it's kicked off the 10 m cliff. Both are worked out above.",
        followUps: ["see the flat-ground working", "give me a similar one to try"],
      });
    }

    // Coding question test
    if (lower.includes("print 3, 3, 3") || lower.includes("var i = 0")) {
      return JSON.stringify({
        title: "Why does the loop print 3, 3, 3 in JavaScript?",
        subject: "Computer Science",
        topic: "JavaScript Closures & Event Loop",
        level: "Beginner to Intermediate",
        summary: "The `var` keyword creates a single shared variable scoped to the function, not the loop block. By the time `setTimeout` fires, the loop has already finished and `i` equals 3.",
        result: [
          { label: "Cause", value: "var scoping", formula: "var is function-scoped" },
          { label: "Fix", value: "let i = 0", formula: "let is block-scoped" },
        ],
        blocks: [
          {
            type: "code",
            language: "javascript",
            code: "// The Problem:\nfor (var i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100); // prints 3, 3, 3\n}\n\n// The Fix:\nfor (let i = 0; i < 3; i++) {\n  setTimeout(() => console.log(i), 100); // prints 0, 1, 2\n}",
            explanation: "Using `let` creates a new binding for `i` in each loop iteration, preserving each closure.",
          },
          {
            type: "table",
            title: "Dry-run execution trace",
            columns: ["Iteration", "Loop executes", "Timer callback fires", "Value of i logged"],
            rows: [
              [0, "i = 0", "scheduled for +100ms", "delayed"],
              [1, "i = 1", "scheduled for +100ms", "delayed"],
              [2, "i = 2", "scheduled for +100ms", "delayed"],
              ["Finish", "i becomes 3", "all 3 timers fire", "3, 3, 3"],
            ],
            highlightRows: [3],
          },
        ],
        followUps: ["how does an IIFE fix this?", "what is the event loop?", "difference between let and const"],
        offerVideo: true,
      });
    }

    // Projectile Motion Problem Mock
    if (lower.includes("projectile") || lower.includes("20 m/s") || lower.includes("30°") || lower.includes("trajectory") || lower.includes("range")) {
      return JSON.stringify({
      title: "Projectile at 20 m/s and 30°: height, time and range",
      subject: "Physics",
      topic: "Kinematics · projectile motion",
      level: "Grade 11 to 12",
      summary: "Split the launch speed into a sideways part and an upward part. Gravity only slows the upward part, so solve the vertical motion for time, then use that time for the horizontal distance.",
      result: [
        { label: "maximum height", value: "5.10", unit: "m", formula: "H = v²sin²θ / 2g" },
        { label: "time in the air", value: "2.04", unit: "s", formula: "T = 2v sinθ / g" },
        { label: "range", value: "35.3", unit: "m", formula: "R = v²sin2θ / g" },
      ],
      blocks: [
        {
          type: "given",
          items: [
            { label: "launch speed", value: "v₀ = 20 m/s" },
            { label: "launch angle", value: "θ = 30°" },
            { label: "gravity", value: "g = 9.8 m/s²" },
            { label: "find", value: "H, T, R" },
          ],
          assumptions: ["no air resistance", "launched from ground level", "lands at the same height"],
        },
        {
          type: "steps",
          steps: [
            {
              id: "st1",
              title: "Split the velocity into components",
              why: "Use the angle to split v₀ into two independent motions.",
              math: ["v_x = v_0 \\cos \\theta = 20 \\times \\cos 30^\\circ = 17.32\\text{ m/s}", "v_y = v_0 \\sin \\theta = 20 \\times \\sin 30^\\circ = 10.0\\text{ m/s}"],
              result: "v_x = 17.32 m/s, v_y = 10.0 m/s",
              note: "cos goes with the side touching the angle ✓",
            },
            {
              id: "st2",
              title: "Time to reach the top",
              why: "At the highest point the ball stops rising for an instant, so vy = 0.",
              math: ["0 = v_y - g \\cdot t_{\\text{up}} \\implies t_{\\text{up}} = \\frac{10}{9.8} = 1.02\\text{ s}"],
              result: "1.02 s",
              deeper: "Before the top it's still going up (vy > 0), after the top it's coming down (vy < 0). The switch happens exactly where vy is zero. The ball is still moving sideways at 17.32 m/s.",
            },
            {
              id: "st3",
              title: "Maximum height and total time in air",
              why: "Vertical motion only, using time to apex, then double for symmetry.",
              math: ["H = v_y t_{\\text{up}} - \\frac{1}{2}g t_{\\text{up}}^2 = 10(1.02) - 4.9(1.02)^2 = 5.10\\text{ m}", "T = 2 \\times t_{\\text{up}} = 2 \\times 1.02 = 2.04\\text{ s}"],
              result: "H = 5.10 m, T = 2.04 s",
              note: "the most-missed step: don't stop at 1.02 s",
            },
            {
              id: "st4",
              title: "Range (how far it lands)",
              why: "Sideways speed is constant, so distance = speed × time.",
              math: ["R = v_x \\times T = 17.32 \\times 2.041 = 35.3\\text{ m}"],
              result: "35.3 m",
            },
            {
              id: "st5",
              title: "Check with the range formula",
              why: "A second method that should give the same number.",
              math: ["R = \\frac{v_0^2 \\sin 2\\theta}{g} = \\frac{400 \\times \\sin 60^\\circ}{9.8} = 35.3\\text{ m}"],
              result: "35.3 m ✓",
            },
          ],
        },
        {
          type: "figure",
          id: "fig-traj",
          title: "Trajectory: height vs distance",
          caption: "Drag angle or speed sliders to observe path changes. 45° gives maximum range.",
          chart: {
            kind: "trajectory",
            v0: 20,
            angleDeg: 30,
            g: 9.8,
            h0: 0,
          },
        },
        {
          type: "callout",
          tone: "warn",
          title: "Watch out for these common mistakes",
          items: [
            "Using cos θ for the vertical part. Vertical uses sin θ.",
            "Stopping at 1.02 s. That is only the way up; total air time is 2.04 s.",
            "Mixing signs for g. Keep up positive and g = -9.8 m/s².",
            "Calculator in radians mode instead of degrees.",
          ],
        },
        {
          type: "callout",
          tone: "ok",
          title: "Quick sanity checks",
          items: [
            "At 60° the range is identical (35.3 m) because complementary angles share the same range.",
            "H (5.10 m) is reasonably smaller than R (35.3 m) for a low 30° launch.",
          ],
        },
      ],
      board: [
        "split: vx = v cos θ, vy = v sin θ",
        "top: vy = 0 → t = vy / g = 1.02 s",
        "height: H = vy² / 2g = 5.10 m",
        "air time: T = 2t = 2.04 s · range: R = vxT = 35.3 m",
      ],
      quiz: [
        {
          q: "If the same ball is kicked at 60° instead, what is the range?",
          options: ["17.7 m", "35.3 m", "40.8 m", "70.7 m"],
          answer: 1,
          why: "sin(2 × 60°) = sin 120° = sin 60°, so the range is identical: 35.3 m. It just goes higher.",
        },
        {
          q: "At the very top of the path, what is the ball's speed?",
          options: ["0 m/s", "10 m/s", "17.32 m/s", "20 m/s"],
          answer: 2,
          why: "Only vy is zero at the peak. It still moves sideways at vx = 17.32 m/s.",
        },
      ],
      followUps: [
        "what if it's kicked from a 10 m cliff?",
        "how does air resistance change this?",
        "why is 45° the best angle?",
        "give me a harder one",
      ],
      offerVideo: true,
      });
    }

    // Tailored solution matching whatever question was asked
    const userTopic = extractContentText(rawContent).trim().slice(0, 80).replace(/["\r\n]/g, "") || "Your Question";
    return JSON.stringify({
      title: `Solution: ${userTopic}`,
      subject: "Homework Help",
      topic: userTopic,
      level: "General",
      summary: `Here is the clear, verified explanation for: ${userTopic}.`,
      result: [
        { label: "Status", value: "Verified Solution", unit: "", formula: userTopic },
      ],
      blocks: [
        {
          type: "steps",
          steps: [
            {
              id: "st1",
              title: "Analyze the core concept",
              why: "Understanding the underlying definitions ensures an accurate answer.",
              math: [],
              result: userTopic,
              note: "Focus on primary relationships and principles.",
              deeper: "Always check your initial assumptions and definitions first.",
            },
            {
              id: "st2",
              title: "Step-by-step breakdown",
              why: "Walk through the solution logically with clear explanation.",
              math: [],
              result: "Solved",
              note: "Review each point to ensure it answers the exact question.",
              deeper: "Practice similar problems to reinforce understanding.",
            },
          ],
        },
      ],
      mistakes: [
        "Jumping to conclusions without identifying fundamental definitions.",
        "Overlooking constraints in the question.",
      ],
      checks: [
        "Confirm that the final answer directly addresses what was asked.",
        "Check logical consistency of all steps.",
      ],
      board: [
        `Topic: ${userTopic}`,
        "1. Identify core concepts and given facts",
        "2. Step-by-step deduction",
        "3. Verification against fundamentals",
      ],
      quiz: [],
      followUps: [
        "Can you explain the first step in more detail?",
        "Can you give me a practice question on this?",
      ],
      offerVideo: false,
    });
  }
}
