"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatMessage } from "@/lib/chat/schema";
import { AnswerMemory } from "@/lib/chat/context";
import { Thread } from "@/components/chat/Thread";
import { Composer } from "@/components/chat/Composer";
import { Sidebar } from "@/components/chat/Sidebar";
import { AnswerToc } from "@/components/chat/AnswerToc";
import { Clock } from "@/components/Clock";
import "@/styles/chat.css";

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = (params?.id as string) || "physics-test-prep";

  const [showLogic, setShowLogic] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [memory, setMemory] = useState<AnswerMemory | null>(null);

  // Initial reference conversation matching doubtster-chat-conversation.html
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m_1",
      role: "user",
      content: "hi",
      createdAt: Date.now() - 180000,
    },
    {
      id: "m_2",
      role: "assistant",
      content: "Hey! 👋 What are you working on today?",
      intent: "SMALL_TALK",
      intentReason: "plain reply · no cards, no video, no buttons",
      createdAt: Date.now() - 170000,
    },
    {
      id: "m_3",
      role: "user",
      content: "ugh physics test tomorrow and i'm so behind lol",
      createdAt: Date.now() - 160000,
    },
    {
      id: "m_4",
      role: "assistant",
      content:
        "Oof, the night-before feeling. You're not as behind as it feels, though. What topics are on the test? Let's start with the one that scares you most.",
      intent: "SMALL_TALK",
      intentReason: "empathise, ask one question, stay short",
      createdAt: Date.now() - 150000,
    },
    {
      id: "m_5",
      role: "user",
      content:
        "projectiles. a ball is kicked at 20 m/s at 30°. how high, how long in the air, how far?",
      createdAt: Date.now() - 140000,
    },
    {
      id: "m_6",
      role: "assistant",
      content:
        "Split the launch speed into a sideways part and an upward part. Gravity only slows the upward part, so solve the vertical motion for time, then use that time for the horizontal distance.",
      intent: "NEW_QUESTION",
      intentReason: "full structured answer · graph · video and cards offered once, at the end",
      createdAt: Date.now() - 130000,
      answer: {
        title: "Projectile at 20 m/s and 30°: height, time and range",
        subject: "Physics",
        topic: "Kinematics · projectile motion",
        level: "Grade 11 to 12",
        summary:
          "Split the launch speed into a sideways part and an upward part. Gravity only slows the upward part, so solve the vertical motion for time, then use that time for the horizontal distance.",
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
            assumptions: [
              "no air resistance",
              "launched from ground level",
              "lands at the same height",
            ],
          },
          {
            type: "steps",
            steps: [
              {
                id: "st1",
                title: "Time to reach the top",
                why: "At the highest point the ball stops rising for an instant, so vᵧ = 0.",
                math: ["0 = v_y - g \\cdot t_{\\text{up}} \\implies t_{\\text{up}} = \\frac{10}{9.8} = 1.02\\text{ s}"],
                result: "1.02 s",
                deeper:
                  "Before the top it's still going up (vᵧ > 0), after the top it's coming down (vᵧ < 0). The switch happens exactly where vᵧ is zero. The ball is still moving sideways at 17.32 m/s.",
              },
              {
                id: "st2",
                title: "Maximum height",
                why: "Use the vertical motion only, with the time we just found.",
                math: [
                  "H = v_y t_{\\text{up}} - \\frac{1}{2}g t_{\\text{up}}^2 = 10(1.02) - 4.9(1.02)^2 = 5.10\\text{ m}",
                  "\\text{shortcut: } H = \\frac{v_y^2}{2g} = \\frac{100}{19.6} = 5.10\\text{ m} \\checkmark",
                ],
                result: "5.10 m",
              },
              {
                id: "st3",
                title: "Total time in the air",
                why: "Going up and coming down take the same time when it lands at launch height.",
                math: ["T = 2 \\times t_{\\text{up}} = 2 \\times 1.02 = 2.04\\text{ s}"],
                result: "2.04 s",
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
                math: ["R = \\frac{v_0^2 \\sin 2\\theta}{g} = \\frac{400 \\times \\sin 60^\\circ}{9.8} = 35.3\\text{ m} \\checkmark"],
                result: "35.3 m ✓",
              },
            ],
          },
          {
            type: "figure",
            id: "fig-traj",
            title: "See the path",
            caption: "Hover the curve · drag the angle slider",
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
            title: "Watch out for these",
            items: [
              "Using cos θ for the vertical part. Vertical uses sin θ.",
              "Stopping at 1.02 s. That's only the way up; the total is 2.04 s.",
              "Mixing signs for g. Pick 'up is positive' and keep g = -9.8 in vertical equations.",
              "Calculator in radians. sin 30 in radians is -0.99, not 0.5.",
            ],
          },
          {
            type: "callout",
            tone: "ok",
            title: "Quick sanity check",
            items: [
              "At 60° the range is the same (35.3 m) but the ball goes 3× higher. Complementary angles share a range.",
              "H should be much smaller than R for low angles. 5.1 m vs 35.3 m, fine.",
            ],
          },
        ],
        board: [
          "split: vₓ = v cos θ,  vᵧ = v sin θ",
          "top: vᵧ = 0 → t = vᵧ/g = 1.02 s",
          "height: H = vᵧ²/2g = 5.10 m",
          "air time: T = 2t = 2.04 s · range: R = vₓT = 35.3 m",
        ],
        quiz: [
          {
            q: "If the same ball is kicked at 60° instead, what is the range?",
            options: ["17.7 m", "35.3 m", "40.8 m", "70.7 m"],
            answer: 1,
            why: "sin(2 × 60°) = sin 120° = sin 60°, so the range is the same: 35.3 m. It just goes higher.",
          },
          {
            q: "At the very top of the path, what is the ball's speed?",
            options: ["0 m/s", "10 m/s", "17.32 m/s", "20 m/s"],
            answer: 2,
            why: "Only vᵧ is zero at the top. It still moves sideways at vₓ = 17.32 m/s.",
          },
        ],
        followUps: [
          "what if it's kicked from a 10 m cliff?",
          "how does air resistance change this?",
          "why is 45° the best angle?",
          "give me a harder one",
        ],
        offerVideo: true,
      },
    },
    {
      id: "m_7",
      role: "user",
      content: "wait why do we double the time?",
      createdAt: Date.now() - 110000,
    },
    {
      id: "m_8",
      role: "assistant",
      content:
        "Because the trip is symmetric. Gravity takes the ball from 10 m/s up to 0 in 1.02 s, then speeds it from 0 back to 10 m/s downward in exactly the same time.\n\nThis only works when it lands at the same height it started from. Off a cliff or onto a table, you can't just double it.",
      intent: "CLARIFY",
      intentReason: "answer only that step · reuse earlier numbers · no repeat of the full solution",
      createdAt: Date.now() - 100000,
      followUp: {
        intent: "CLARIFY",
        refersTo: { stepId: "st3", label: "↑ about step 3: T = 2 × 1.02 s" },
        text: "Because the trip is symmetric. Gravity takes the ball from 10 m/s up to 0 in 1.02 s, then speeds it from 0 back to 10 m/s downward in exactly the same time.\n\nThis only works when it lands at the same height it started from. Off a cliff or onto a table, you can't just double it.",
        handNote: "quick test: up-time = down-time only on flat ground",
        timeline: {
          leftLabel: "going up · 1.02 s",
          leftColor: "#2F7BFF",
          rightLabel: "coming down · 1.02 s",
          rightColor: "#1F9D55",
        },
      },
    },
    {
      id: "m_9",
      role: "user",
      content: "ok what if it's kicked off a 10 m cliff?",
      createdAt: Date.now() - 80000,
    },
    {
      id: "m_10",
      role: "assistant",
      content:
        "Nice, this is exactly the case where doubling breaks. The split velocity stays the same; only the landing height changes, so solve for when the height hits -10 m:\n\n-10 = 10t - 4.9t² → 4.9t² - 10t - 10 = 0 → t = 2.78 s",
      intent: "WHAT_IF",
      intentReason: "new calculation built on the old one · only what changes",
      createdAt: Date.now() - 70000,
      followUp: {
        intent: "WHAT_IF",
        refersTo: { stepId: "card1", label: "↑ same kick as before: vₓ = 17.32, vᵧ = 10" },
        text: "Nice, this is exactly the case where doubling breaks. The split velocity stays the same; only the landing height changes, so solve for when the height hits -10 m:\n\n−10 = 10t − 4.9t²  →  4.9t² − 10t − 10 = 0  →  t = 2.78 s",
        diffTiles: [
          { label: "time in air", value: "2.78 s", diff: "+0.74 s" },
          { label: "range", value: "48.1 m", diff: "+12.8 m" },
          { label: "highest point above ground", value: "15.1 m", diff: "10 + 5.1" },
          { label: "speed when it lands", value: "24.4 m/s", diff: "faster than 20" },
        ],
      },
    },
    {
      id: "m_11",
      role: "user",
      content: "honestly i still don't get the split part",
      createdAt: Date.now() - 50000,
    },
    {
      id: "m_12",
      role: "assistant",
      content:
        "Totally fair, let's try it without formulas. Picture two torches shining on the ball:\n\nThe real ball is just both shadows happening at once. That's all 'splitting' means: we study the floor shadow (steady) and the wall shadow (thrown straight up) separately, then put them back together.\n\nDoes that click better? If yes, try this: at the very top of the path, which shadow has stopped?",
      intent: "RE_EXPLAIN",
      intentReason: "new angle (an analogy), simpler words, no copy of step 1",
      createdAt: Date.now() - 40000,
      followUp: {
        intent: "RE_EXPLAIN",
        text: "Totally fair, let's try it without formulas. Picture two torches shining on the ball:\n\nThe real ball is just both shadows happening at once. That's all 'splitting' means: we study the floor shadow (steady) and the wall shadow (thrown straight up) separately, then put them back together.\n\nDoes that click better? If yes, try this: at the very top of the path, which shadow has stopped?",
        analogy: {
          leftTitle: "Torch from above",
          leftDesc: "moves the same distance every second → vₓ",
          rightTitle: "Torch from the side",
          rightDesc: "goes up, slows, stops, falls back → vᵧ",
          kind: "shadows",
        },
      },
    },
    {
      id: "m_13",
      role: "user",
      content: "so how far does it land again?",
      createdAt: Date.now() - 30000,
    },
    {
      id: "m_14",
      role: "assistant",
      content:
        "35.3 m on flat ground, or 48.1 m if it's kicked off the 10 m cliff. Both are worked out above.",
      intent: "REPEAT",
      intentReason: "short recall + link back · never paste the same answer twice",
      createdAt: Date.now() - 20000,
      refersTo: { stepId: "st4" },
      followUp: {
        intent: "REPEAT",
        refersTo: { stepId: "st4", label: "↑ see the flat-ground working" },
        text: "35.3 m on flat ground, or 48.1 m if it's kicked off the 10 m cliff. Both are worked out above.",
        followUps: ["give me a similar one to try"],
      },
    },
    {
      id: "m_15",
      role: "user",
      content: "thanks!! this actually helped",
      createdAt: Date.now() - 10000,
    },
    {
      id: "m_16",
      role: "assistant",
      content:
        "Anytime! You clearly get it now. Get some sleep tonight, it helps more than one extra hour of revision. Good luck tomorrow 🍀",
      intent: "SMALL_TALK",
      intentReason: "warm and short · no upsell",
      createdAt: Date.now() - 5000,
    },
  ]);

  // Sync memory on mount if structured answer exists
  useEffect(() => {
    const lastAnswer = messages.find((m) => m.answer)?.answer;
    if (lastAnswer && !memory) {
      setMemory({
        messageId: "m_6",
        topic: lastAnswer.topic,
        subject: lastAnswer.subject,
        given: [{ label: "speed", value: "20 m/s" }, { label: "angle", value: "30°" }],
        stepIds: ["st1", "st2", "st3", "st4", "st5"],
        stepSummaries: [
          { id: "st1", title: "Time to reach the top", result: "1.02 s" },
          { id: "st2", title: "Maximum height", result: "5.10 m" },
          { id: "st3", title: "Total time in the air", result: "2.04 s" },
          { id: "st4", title: "Range", result: "35.3 m" },
        ],
        results: lastAnswer.result,
        confusionCount: 1,
      });
    }
  }, [messages, memory]);

  // Sending a new message
  const handleSendMessage = async (
    text: string,
    attachment?: { name: string; type: string; base64: string } | null
  ) => {
    if ((!text.trim() && !attachment) || isGenerating) return;

    const userText = text.trim() || (attachment ? `Analyze ${attachment.name}` : "");
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: "user",
      content: attachment ? `${userText} [Attached: ${attachment.name}]` : userText,
      createdAt: Date.now(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setIsGenerating(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          memory,
          attachment: attachment || null,
        }),
      });

      const data = await res.json();
      setIsGenerating(false);

      if (res.ok) {
        const assistantMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: "assistant",
          content: data.content || (data.answer ? data.answer.summary : ""),
          intent: data.intent,
          intentReason: data.intentReason,
          answer: data.answer,
          followUp: data.followUp,
          refersTo: data.refersTo,
          createdAt: Date.now(),
        };

        setMessages((prev) => [...prev, assistantMsg]);

        if (data.memory) {
          setMemory(data.memory);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `err_${Date.now()}`,
            role: "assistant",
            content: data.error || "Sorry, I had trouble generating a reply. Please try again.",
            intent: "SMALL_TALK",
            createdAt: Date.now(),
          },
        ]);
      }
    } catch {
      setIsGenerating(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: "assistant",
          content: "Could not reach server. Please check connection and try again.",
          intent: "SMALL_TALK",
          createdAt: Date.now(),
        },
      ]);
    }
  };

  const hasStructuredAnswer = messages.some((m) => !!m.answer);

  return (
    <div className={`pg-chat ${showLogic ? "logic" : ""}`}>
      <div className="dots" />

      {/* Top Header Bar */}
      <header className="bar">
        <div className="in">
          <a className="brand" href="/">
            <span className="logo">?</span>
            Doubtster
          </a>
          <div className="r">
            <button
              className={`tog ${showLogic ? "on" : ""}`}
              id="tog"
              type="button"
              aria-pressed={showLogic}
              onClick={() => setShowLogic((prev) => !prev)}
            >
              <i />
              <span>show how it decides</span>
            </button>
            <span className="crb">
              <b>27</b> credits
            </span>
            <span className="av">M</span>
          </div>
        </div>
      </header>

      {/* App 3-Column Layout */}
      <div className="app">
        <Sidebar
          currentChatId={chatId}
          onNewChat={() => router.push("/chat/new")}
          showLegend={showLogic}
        />

        <main className="main">
          <Thread
            messages={messages}
            isGenerating={isGenerating}
            onFollowUpClick={handleSendMessage}
            onMakeVideo={() => alert("Explainer video generation queued (2 credits).")}
            onMakeDeck={() => alert("Flashcards generated and added to your Library.")}
            onMakeQuiz={() => alert("Practice quiz created.")}
          />
        </main>

        {hasStructuredAnswer && <AnswerToc />}
      </div>

      {/* Composer at Bottom */}
      <Composer onSend={handleSendMessage} disabled={isGenerating} />
    </div>
  );
}

