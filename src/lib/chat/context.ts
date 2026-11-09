import { Answer } from "./schema";

export interface AnswerMemory {
  messageId: string;
  topic: string;
  subject: string;
  given: { label: string; value: string }[];
  stepIds: string[];
  stepSummaries: { id: string; title: string; result?: string }[];
  results: { label: string; value: string; unit?: string }[];
  confusionCount: number; // tracks how many times student said they don't understand
}

export function extractAnswerMemory(messageId: string, answer: Answer): AnswerMemory {
  const givenBlock = answer.blocks.find((b) => b.type === "given") as any;
  const stepsBlock = answer.blocks.find((b) => b.type === "steps") as any;

  return {
    messageId,
    topic: answer.topic || answer.title,
    subject: answer.subject,
    given: givenBlock?.items || [],
    stepIds: stepsBlock?.steps?.map((s: any) => s.id) || [],
    stepSummaries:
      stepsBlock?.steps?.map((s: any) => ({
        id: s.id,
        title: s.title,
        result: s.result,
      })) || [],
    results: answer.result.map((r) => ({ label: r.label, value: r.value, unit: r.unit })),
    confusionCount: 0,
  };
}

export function buildContextPayload(
  history: { role: string; content: string }[],
  memory?: AnswerMemory | null
): {
  recentHistory: { role: "user" | "assistant"; content: string }[];
  summary: string;
  memorySnippet: string;
} {
  // Take last 10 turns
  const maxTurns = 10;
  const recent = history.slice(-maxTurns).map((h) => ({
    role: (h.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: h.content,
  }));

  // Summarize older turns if any
  let summary = "";
  if (history.length > maxTurns) {
    const older = history.slice(0, -maxTurns);
    summary = `Earlier conversation had ${older.length} messages discussing: ${older
      .filter((m) => m.role === "user")
      .map((m) => m.content.slice(0, 50))
      .join("; ")}`;
  }

  // Build answer memory snippet
  let memorySnippet = "";
  if (memory) {
    memorySnippet = `[Active Problem Memory]
Topic: ${memory.topic} (${memory.subject})
Given: ${memory.given.map((g) => `${g.label}: ${g.value}`).join(", ")}
Key Results: ${memory.results.map((r) => `${r.label} = ${r.value} ${r.unit || ""}`).join(", ")}
Steps Worked:
${memory.stepSummaries.map((s) => `  - Step ${s.id} (${s.title}): ${s.result || "derived"}`).join("\n")}
Times student struggled on this topic: ${memory.confusionCount}
`;
  }

  return {
    recentHistory: recent,
    summary,
    memorySnippet,
  };
}

