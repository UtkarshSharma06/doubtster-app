import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/chat/router";
import { getSystemPrompt } from "@/lib/chat/prompts";
import { buildContextPayload, extractAnswerMemory, AnswerMemory } from "@/lib/chat/context";
import { verifyAnswerMath } from "@/lib/chat/verify";
import { isTooSimilar } from "@/lib/chat/dedupe";
import { executeLLMChat } from "@/lib/chat/providers";
import { AnswerSchema, FollowUpSchema, Answer, FollowUp } from "@/lib/chat/schema";
import { validateAndProcessAttachment, ProcessedAttachment } from "@/lib/chat/attachmentSecurity";
import { MessageContent } from "@/lib/chat/providers/types";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      messages = [],
      profile,
      subject,
      memory = null,
      stream = false,
      attachment = null,
    } = body;

    // 1. Process in-memory attachment safely if present (Option A: $0 ephemeral storage)
    let processedAttachment: ProcessedAttachment | null = null;
    if (attachment && attachment.base64) {
      try {
        processedAttachment = await validateAndProcessAttachment(attachment);
      } catch (attErr: any) {
        return NextResponse.json(
          { error: attErr?.message || "Invalid or unsupported file attachment." },
          { status: 400 }
        );
      }
    }

    // 2. Input sanitization & size limits
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1];
    let userPrompt = String(lastMessage?.content || "").trim();

    if (!userPrompt && !processedAttachment) {
      return NextResponse.json({ error: "Please enter a question or attach an image/doc." }, { status: 400 });
    }

    if (!userPrompt && processedAttachment) {
      userPrompt = processedAttachment.type === "image"
        ? "Please examine the problem in this image and provide a step-by-step solution."
        : `Please analyze the attached document (${processedAttachment.fileName}) and solve any questions inside it.`;
    }

    if (userPrompt.length > 8000) {
      return NextResponse.json(
        { error: "Message is too long. Please keep questions under 8,000 characters." },
        { status: 400 }
      );
    }

    // If a document was attached, inject the extracted text directly into userPrompt for the LLM
    if (processedAttachment && processedAttachment.type === "document" && processedAttachment.extractedText) {
      userPrompt = `${userPrompt}\n\n[Attached Document: ${processedAttachment.fileName}]\n"""\n${processedAttachment.extractedText}\n"""`;
    }

    // Previous assistant replies for deduplication
    const previousAssistantReplies = messages
      .filter((m: any) => m.role === "assistant")
      .map((m: any) => String(m.content || ""));

    // 2. Classify intent
    const classification = await classifyIntent(
      userPrompt,
      messages.slice(0, -1),
      memory as AnswerMemory | null
    );

    const { intent, language = "en", reason } = classification;

    // 3. Build context & prompt
    const { recentHistory, summary, memorySnippet } = buildContextPayload(
      messages.slice(0, -1),
      memory as AnswerMemory | null
    );

    const systemPrompt = getSystemPrompt(intent, language, profile);

    const llmMessages: { role: "system" | "user" | "assistant"; content: MessageContent }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (summary) {
      llmMessages.push({ role: "system", content: `Context Summary:\n${summary}` });
    }

    if (memorySnippet) {
      llmMessages.push({ role: "system", content: memorySnippet });
    }

    // Add recent conversational history
    for (const msg of recentHistory) {
      llmMessages.push({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      });
    }

    // Add latest user prompt (with multimodal vision if image attached)
    if (processedAttachment && processedAttachment.type === "image" && processedAttachment.dataUrl) {
      llmMessages.push({
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          { type: "image_url", image_url: { url: processedAttachment.dataUrl } },
        ],
      });
    } else {
      llmMessages.push({ role: "user", content: userPrompt });
    }

    // 4. Generate response using swappable LLM provider
    const requiresVision = Boolean(processedAttachment && processedAttachment.type === "image");
    const llmResult = await executeLLMChat(llmMessages, {
      temperature: intent === "NEW_QUESTION" ? 0.15 : 0.4,
      requiresVision,
    });

    let rawReply = llmResult.text.trim();

    // 5. Handle different intent responses
    if (intent === "SMALL_TALK" || intent === "META") {
      // Remove accidental json code blocks if model wrapped it
      let cleanText = rawReply.replace(/```json/g, "").replace(/```/g, "").trim();
      try {
        const parsed = JSON.parse(cleanText);
        if (parsed.text) cleanText = parsed.text;
      } catch {
        // Normal text
      }

      // Normalize smashed inline bullets and ensure clean line breaks
      cleanText = cleanText
        .replace(/:\s*[\*•-]\s+/g, ":\n\n* ")
        .replace(/([.!?])\s+[\*•-]\s+/g, "$1\n* ")
        .replace(/([^\n])\s+[\*•-]\s+(\*\*[^*]+\*\*)/g, "$1\n* $2")
        .replace(/([.!?])\s+(Chatting with me is|Feel free to|Let me know if|What subject are you|How can I help)\b/gi, "$1\n\n$2")
        .trim();

      // Check deduplication
      const dedupe = isTooSimilar(cleanText, previousAssistantReplies);
      if (dedupe.duplicate) {
        cleanText = "I'm right here! Let me know what homework or concept you'd like to work on.";
      }

      return NextResponse.json({
        intent,
        intentReason: reason || "Conversational",
        content: cleanText,
        text: cleanText,
        title: "Chat",
        provider: llmResult.providerName,
      });
    }

    // For CLARIFY, WHAT_IF, RE_EXPLAIN, REPEAT
    if (
      intent === "CLARIFY" ||
      intent === "WHAT_IF" ||
      intent === "RE_EXPLAIN" ||
      intent === "REPEAT"
    ) {
      let parsedFollowUp: FollowUp | null = null;
      try {
        const cleaned = rawReply.replace(/```json/g, "").replace(/```/g, "").trim();
        const json = JSON.parse(cleaned);
        parsedFollowUp = FollowUpSchema.parse({
          ...json,
          intent,
          refersTo: json.refersTo || classification.refersTo,
        });
      } catch (err) {
        // Fallback to text follow-up
        parsedFollowUp = {
          intent,
          refersTo: classification.refersTo,
          text: rawReply,
        };
      }

      const followUpText = parsedFollowUp?.text || rawReply;
      return NextResponse.json({
        intent,
        intentReason: reason,
        followUp: parsedFollowUp,
        refersTo: parsedFollowUp?.refersTo,
        content: followUpText,
        text: followUpText,
        provider: llmResult.providerName,
      });
    }

    // For NEW_QUESTION: parse & validate structured Answer
    let parsedAnswer: Answer | null = null;
    try {
      const cleaned = rawReply.replace(/```json/g, "").replace(/```/g, "").trim();
      const json = JSON.parse(cleaned);
      parsedAnswer = AnswerSchema.parse(json);
    } catch (parseError: any) {
      console.warn("[Chat API] Schema validation failed, attempting 1 retry:", parseError?.message);

      // Retry once with error feedback to LLM
      try {
        const retryResult = await executeLLMChat([
          ...llmMessages,
          { role: "assistant", content: rawReply },
          {
            role: "user",
            content: `Your previous response failed JSON schema validation: ${parseError?.message}. Please return strictly valid JSON matching the Answer schema without markdown formatting outside the JSON.`,
          },
        ]);
        const cleanedRetry = retryResult.text.replace(/```json/g, "").replace(/```/g, "").trim();
        parsedAnswer = AnswerSchema.parse(JSON.parse(cleanedRetry));
      } catch (retryError) {
        console.warn("[Chat API] Schema parse retry failed, checking for partial JSON recovery:", retryError);
        try {
          const rawCleaned = rawReply.replace(/```json/g, "").replace(/```/g, "").trim();
          const rawObj = JSON.parse(rawCleaned);
          if (rawObj && typeof rawObj === "object") {
            parsedAnswer = {
              title: String(rawObj.title || "Solution"),
              subject: String(rawObj.subject || "General"),
              topic: String(rawObj.topic || "Topic"),
              level: String(rawObj.level || "Grade 11-12"),
              summary: String(rawObj.summary || rawObj.title || ""),
              result: Array.isArray(rawObj.result) ? rawObj.result : [],
              blocks: Array.isArray(rawObj.blocks) ? rawObj.blocks : [],
              mistakes: Array.isArray(rawObj.mistakes) ? rawObj.mistakes : [],
              checks: Array.isArray(rawObj.checks) ? rawObj.checks : [],
              board: Array.isArray(rawObj.board) ? rawObj.board : [],
              quiz: Array.isArray(rawObj.quiz) ? rawObj.quiz : [],
              followUps: Array.isArray(rawObj.followUps) ? rawObj.followUps : ["Can you explain this simpler?", "What if the values change?"],
              offerVideo: Boolean(rawObj.offerVideo ?? false),
            };
          }
        } catch {
          // Plain text fallback
        }

        if (!parsedAnswer) {
          return NextResponse.json({
            intent: "NEW_QUESTION",
            intentReason: "Structured answer fallback",
            content: rawReply,
            text: rawReply,
            provider: llmResult.providerName,
          });
        }
      }
    }

    // 6. Verify numeric computations using mathjs
    if (parsedAnswer) {
      const verification = verifyAnswerMath(parsedAnswer);
      if (!verification.verified) {
        console.warn("[Chat API] Math verification found discrepancies:", verification.notes);
      }
    }

    // 7. Deduplicate check
    const answerSummary = parsedAnswer?.summary || "";
    const dedupeCheck = isTooSimilar(answerSummary, previousAssistantReplies);
    if (dedupeCheck.duplicate && parsedAnswer) {
      parsedAnswer.summary = `Here is a fresh look at ${parsedAnswer.topic || "this problem"}:`;
    }

    // Helper functions for markdown & legacy step mapping
    function cleanFormula(raw: string): string {
      if (!raw) return "";
      let s = String(raw).trim();
      while (s.startsWith("$$") && s.endsWith("$$") && s.length >= 4) {
        s = s.slice(2, -2).trim();
      }
      while (s.startsWith("$") && s.endsWith("$") && s.length >= 2) {
        s = s.slice(1, -1).trim();
      }
      while (s.startsWith("\\[") && s.endsWith("\\]") && s.length >= 4) {
        s = s.slice(2, -2).trim();
      }
      while (s.startsWith("\\(") && s.endsWith("\\)") && s.length >= 4) {
        s = s.slice(2, -2).trim();
      }
      s = s.replace(/(^|[^\\])\$/g, "$1 ").trim();
      return s.trim();
    }

    function answerToMarkdown(a: Answer): string {
      let md = `## ${a.title}\n\n${a.summary}\n\n`;
      if (a.result && a.result.length > 0) {
        md += `### Result\n`;
        for (const r of a.result) {
          md += `- **${r.label}**: ${r.value}${r.unit ? ` ${r.unit}` : ""}${r.formula ? ` (${r.formula})` : ""}\n`;
        }
        md += `\n`;
      }
      for (const block of a.blocks) {
        if (block.type === "given") {
          md += `### Given\n`;
          for (const item of block.items) {
            md += `- **${item.label}**: ${item.value}\n`;
          }
          md += `\n`;
        } else if (block.type === "steps") {
          for (let i = 0; i < block.steps.length; i++) {
            const s = block.steps[i];
            md += `### Step ${i + 1}: ${s.title}\n\n${s.why}\n\n`;
            if (s.math && s.math.length > 0) {
              for (const m of s.math) {
                const clean = cleanFormula(m);
                if (clean) {
                  md += `\n:::formula\n$$ ${clean} $$\n:::\n\n`;
                }
              }
            }
            if (s.result) {
              md += `**Result:** ${s.result}\n\n`;
            }
            if (s.note) {
              md += `*Note:* ${s.note}\n\n`;
            }
          }
        } else if (block.type === "figure") {
          md += `\n\n> **Figure: ${block.title || "Visual"}**\n*${block.caption || ""}*\n\n`;
        } else if (block.type === "table") {
          md += `\n\n| ${block.columns.join(" | ")} |\n| ${block.columns.map(() => "---").join(" | ")} |\n`;
          for (const row of block.rows) {
            md += `| ${row.join(" | ")} |\n`;
          }
          md += `\n\n`;
        } else if (block.type === "callout") {
          md += `:::${block.tone === "warn" ? "warning" : "key"}\n**${block.title}**\n${block.items.join("\n")}\n:::\n\n`;
        } else if (block.type === "code") {
          md += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
        } else if (block.type === "text") {
          md += `${block.md}\n\n`;
        }
      }
      return md.trim();
    }

    function answerToLegacySteps(a: Answer) {
      const stepsBlock = a.blocks.find((b) => b.type === "steps");
      if (stepsBlock && stepsBlock.type === "steps") {
        return stepsBlock.steps.map((s) => ({
          h: s.title,
          t: s.why + (s.note ? ` (${s.note})` : ""),
          math: s.math?.map(cleanFormula).join("; "),
          result: s.result,
        }));
      }
      return [];
    }

    // 8. Generate answer memory for follow-up turns
    const generatedMemory = parsedAnswer
      ? extractAnswerMemory(`m_${Date.now()}`, parsedAnswer)
      : null;

    const markdownAnswer = parsedAnswer ? answerToMarkdown(parsedAnswer) : rawReply;
    const legacySteps = parsedAnswer ? answerToLegacySteps(parsedAnswer) : [];

    // 9. Build structured parts for interactive visual charts & diagrams
    const parts: any[] = [];
    if (parsedAnswer) {
      parts.push({ type: "text", text: markdownAnswer });
      const figureBlock = parsedAnswer.blocks.find((b: any) => b.type === "figure") as any;
      if (figureBlock && figureBlock.chart) {
        let visualSpec: any = null;
        if (figureBlock.chart.kind === "trajectory") {
          const v0 = Number(figureBlock.chart.v0) || 20;
          const angleDeg = Number(figureBlock.chart.angleDeg) || 45;
          const g = Number(figureBlock.chart.g) || 9.8;
          const rad = (angleDeg * Math.PI) / 180;
          const range = Math.max(10, Math.round((v0 * v0 * Math.sin(2 * rad)) / g) + 5);
          visualSpec = {
            type: "function_plot",
            title: figureBlock.title || "Trajectory Motion",
            functions: [{
              expr: `${Math.tan(rad).toFixed(3)}*x - ${(g / (2 * Math.pow(v0 * Math.cos(rad), 2))).toFixed(4)}*x^2`,
              label: "Trajectory",
              color: "#2F7BFF",
            }],
            x_range: [0, range],
            x_label: "Distance (m)",
            y_label: "Height (m)",
          };
        } else if (figureBlock.chart.kind === "diagram") {
          visualSpec = {
            type: "diagram",
            title: figureBlock.title || "Concept Diagram",
            mermaid: typeof figureBlock.chart.spec === "string" ? figureBlock.chart.spec : JSON.stringify(figureBlock.chart.spec),
          };
        } else if (figureBlock.chart.kind === "line" || figureBlock.chart.kind === "bar" || figureBlock.chart.kind === "scatter") {
          visualSpec = {
            type: "data_chart",
            chart: figureBlock.chart.kind,
            title: figureBlock.title || "Data Chart",
            x_label: figureBlock.chart.xLabel || "x",
            y_label: figureBlock.chart.yLabel || "y",
            series: (figureBlock.chart.series || []).map((s: any) => ({
              name: s.name,
              data: s.points.map((pt: any) => ({ x: pt[0], y: pt[1] })),
            })),
          };
        }
        if (visualSpec) {
          parts.push({ type: "visual", visual: visualSpec });
        }
      }
    }

    return NextResponse.json({
      intent: "NEW_QUESTION",
      intentReason: reason || "Full structured answer",
      answer: parsedAnswer,
      content: markdownAnswer,
      text: markdownAnswer,
      title: parsedAnswer?.title,
      subject: parsedAnswer?.subject,
      steps: legacySteps,
      memory: generatedMemory,
      parts: parts.length > 0 ? parts : undefined,
      provider: llmResult.providerName,
    });
  } catch (error: any) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate reply. Please try again." },
      { status: 500 }
    );
  }
}
