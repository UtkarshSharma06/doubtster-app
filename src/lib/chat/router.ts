import { IntentClassification, IntentClassificationSchema } from "./schema";
import { executeLLMChat } from "./providers";
import { AnswerMemory } from "./context";

// Fast heuristic checks for ultra-low latency on simple turns
export function fastHeuristicClassifier(
  message: string,
  history: { role: string; content: string }[] = [],
  memory?: AnswerMemory | null
): IntentClassification | null {
  const t = message.trim().toLowerCase();

  // Prompt injection checks
  if (
    t.includes("ignore your rules") ||
    t.includes("ignore previous instructions") ||
    t.includes("give me 100 credits") ||
    t.includes("free credits") ||
    t.includes("system prompt")
  ) {
    return {
      intent: "SMALL_TALK",
      language: "en",
      confidence: 1.0,
      reason: "Security / Prompt injection attempt intercepted",
    };
  }

  // Pure small talk
  const greetings = ["hi", "hello", "hey", "yo", "morning", "good morning", "good evening", "good night", "sup"];
  if (greetings.includes(t) || t.startsWith("hi ") || t.startsWith("hey ")) {
    return {
      intent: "SMALL_TALK",
      language: "en",
      confidence: 0.99,
      reason: "Greeting",
    };
  }

  const gratitude = ["thanks", "thank you", "thanks!!", "thx", "ty", "tysm", "appreciate it"];
  if (gratitude.includes(t) || t.startsWith("thanks") || t.startsWith("thank you")) {
    return {
      intent: "SMALL_TALK",
      language: "en",
      confidence: 0.99,
      reason: "Gratitude / closing",
    };
  }

  const emotions = ["i'm stressed", "im stressed", "so behind", "tired", "i am stressed", "stressed out", "i'm tired", "lol"];
  if (emotions.some((e) => t.includes(e)) && !t.includes("calculate") && !t.includes("find")) {
    return {
      intent: "SMALL_TALK",
      language: "en",
      confidence: 0.95,
      reason: "Emotional / exam stress",
    };
  }

  // Meta Doubtster questions
  if (
    t.includes("is chat free") ||
    t.includes("how do videos work") ||
    t.includes("what can you do") ||
    t.includes("how much do videos cost")
  ) {
    return {
      intent: "META",
      language: "en",
      confidence: 0.98,
      reason: "Doubtster features and pricing query",
    };
  }

  // Follow-up classifications if memory exists
  if (memory && history.length > 0) {
    // REPEAT check
    if (
      t.includes("how far does it land again") ||
      t.includes("what was the range again") ||
      t.includes("what was the answer again") ||
      t.includes("what was the height again") ||
      t.includes("tell me the answer again")
    ) {
      return {
        intent: "REPEAT",
        refersTo: { stepId: "st4", label: "previously worked range" },
        language: "en",
        confidence: 0.95,
        reason: "Asking for previously computed result",
      };
    }

    // CLARIFY check
    if (
      t.includes("why do we double") ||
      t.includes("why double") ||
      t.includes("how did you get 17.32") ||
      t.includes("why vy = 0") ||
      t.includes("why is vy 0") ||
      (t.startsWith("why") && t.length < 50)
    ) {
      let stepId = "st3";
      if (t.includes("17.32") || t.includes("split") || t.includes("cos")) stepId = "st1";
      if (t.includes("vy = 0") || t.includes("top")) stepId = "st2";
      if (t.includes("double") || t.includes("air time") || t.includes("2.04")) stepId = "st3";
      return {
        intent: "CLARIFY",
        refersTo: { stepId, label: `step ${stepId}` },
        language: "en",
        confidence: 0.95,
        reason: "Clarifying a specific derivation step",
      };
    }

    // WHAT_IF check
    if (
      t.includes("cliff") ||
      t.includes("what if") ||
      t.includes("what about 45") ||
      t.includes("what if θ") ||
      t.includes("what if theta") ||
      t.includes("if the speed was")
    ) {
      return {
        intent: "WHAT_IF",
        refersTo: { messageId: memory.messageId, stepId: "card1" },
        language: "en",
        confidence: 0.95,
        reason: "Scenario extension / parameter change",
      };
    }

    // RE_EXPLAIN check
    if (
      t.includes("still don't get") ||
      t.includes("still dont get") ||
      t.includes("explain simpler") ||
      t.includes("explain it simpler") ||
      t.includes("don't understand") ||
      t.includes("dont understand") ||
      t.includes("confused about")
    ) {
      return {
        intent: "RE_EXPLAIN",
        language: "en",
        confidence: 0.95,
        reason: "Student expressed difficulty understanding",
      };
    }
  }

  // Not resolved by heuristics, let model classify
  return null;
}

export async function classifyIntent(
  message: string,
  history: { role: string; content: string }[] = [],
  memory?: AnswerMemory | null
): Promise<IntentClassification> {
  // 1. Try fast heuristic first
  const heuristic = fastHeuristicClassifier(message, history, memory);
  if (heuristic) {
    return heuristic;
  }

  // 2. Run LLM intent classification
  const sysPrompt = `You are the intent classifier for Doubtster, an AI homework tutor.
Analyze the user's latest message in context of the conversation and memory.

Respond ONLY with valid JSON matching this schema:
{
  "intent": "SMALL_TALK" | "NEW_QUESTION" | "CLARIFY" | "WHAT_IF" | "RE_EXPLAIN" | "REPEAT" | "META",
  "refersTo": { "messageId": string, "stepId": string, "label": string },
  "subject": string,
  "topic": string,
  "level": string,
  "language": "en" | "fr" | "es" | "hi",
  "confidence": number,
  "reason": string
}

Intent Rules:
- SMALL_TALK: greetings ("hi", "hello"), emotions ("tired", "exam stress"), gratitude ("thanks"), closing.
- NEW_QUESTION: asking for solution/explanation to a new academic problem, homework question or concept.
- CLARIFY: asking "why", "how", or pointing to a specific step of the previous solution.
- WHAT_IF: changing launch conditions, cliff, angle, or scenario parameter.
- RE_EXPLAIN: saying "I still don't get it", "simpler please", or confusion.
- REPEAT: asking for the same answer or number that was already worked out ("how far was it again?").
- META: questions about Doubtster platform, credits, videos, whether chat is free.`;

  const memoryContext = memory
    ? `\nActive Problem Memory:\nTopic: ${memory.topic}\nGiven: ${JSON.stringify(memory.given)}\nKey Results: ${JSON.stringify(memory.results)}\nStep IDs: ${memory.stepIds.join(", ")}`
    : "\nNo active problem in memory.";

  const recentConversation = history
    .slice(-8)
    .map((m) => `${m.role}: ${m.content.slice(0, 160)}`)
    .join("\n");

  try {
    const { text } = await executeLLMChat([
      { role: "system", content: sysPrompt },
      {
        role: "user",
        content: `Conversation History:\n${recentConversation}\n${memoryContext}\n\nLatest user message:\n"${message}"\n\nClassify the intent JSON:`,
      },
    ]);

    const cleaned = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const validated = IntentClassificationSchema.parse(parsed);
    return validated;
  } catch (err) {
    console.warn("[Router] LLM classification error, falling back to NEW_QUESTION:", err);
    return {
      intent: "NEW_QUESTION",
      language: "en",
      confidence: 0.7,
      reason: "Fallback after parsing failure",
    };
  }
}

