import { NextRequest, NextResponse } from "next/server";
import { SHOW_VISUAL_TOOL, VISUALS_SYSTEM_PROMPT } from "@/lib/visuals/tool";
import { validateVisualSpec, MessagePart, VisualSpec } from "@/lib/visuals/schema";

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, profile, subject, stream = true } = body;

    const baseSystemPrompt = `${VISUALS_SYSTEM_PROMPT}
 
You are Doubtster, a patient tutor. Answer in clean Markdown using EXACTLY this structure:

## Quick answer
One or two sentences with the final result first.

## Concept
Clear, intuitive explanation of the core idea, intuition, and why it works. Use :::key blocks for the 1 to 3 most important conceptual insights.

## Solution
One ### heading per step: "### Step 1: <clear action>". Under each step: explain the rationale and intuition clearly so a student deeply understands WHY this step is taken, then provide the complete, step-by-step working. Put every formula in LaTeX: inline $...$ and display $$...$$. Never write maths as plain text or with asterisks. Show one operation per line. Keep units in every step.

## Check
How to sanity check the result (units, estimate, substitute back).

## Common mistake
One typical error, inside a :::warning block.

## Final answer
The result in a :::answer block, with units.

Special blocks (use this exact syntax, each on its own lines):
:::key
Most important idea or sentence
:::
:::formula
$$ formula $$
:::
:::warning
Common mistake or trap
:::
:::tip
Shortcut or memory trick
:::
:::answer
**Final answer:** $...$ with units
:::

Rules: do not use ** for headings, use ## and ###. Use ==text== to mark a key phrase inside a sentence (max 3 per answer). No em dashes. Provide complete, rich, patient, and deeply educational explanations like a master teacher. Never skip intermediate steps. Never invent facts. Write in the user's language (English, French, Spanish or Hindi).`;

    const contextParts: string[] = [];
    if (profile && Object.keys(profile).length > 0) {
      contextParts.push(`Profile context: ${JSON.stringify(profile)}`);
    }
    if (subject && subject !== "General" && subject !== "Auto") {
      contextParts.push(`Subject: ${subject}`);
    }

    const sysInstruction = contextParts.length > 0
      ? `${baseSystemPrompt}\n\n${contextParts.join("\n")}`
      : baseSystemPrompt;

    const chatMessages = (messages || []).map((msg: any) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    }));

    chatMessages.unshift({ role: "system", content: sysInstruction });

    const tools = [SHOW_VISUAL_TOOL];
    const tool_choice = "auto";

    // Setup providers to attempt in order
    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const nvidiaKey = process.env.NVIDIA_API_KEY;

    interface ProviderConfig {
      name: string;
      url: string;
      key: string;
      model: string;
    }

    const providers: ProviderConfig[] = [];

    // 1. Groq Cloud (ultra-fast reasoning)
    if (groqKey) {
      providers.push({
        name: "Groq 120B",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: groqKey,
        model: "openai/gpt-oss-120b",
      });
      providers.push({
        name: "Groq 20B",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: groqKey,
        model: "openai/gpt-oss-20b",
      });
      providers.push({
        name: "Groq Qwen",
        url: "https://api.groq.com/openai/v1/chat/completions",
        key: groqKey,
        model: "qwen/qwen3.8-27b",
      });
    }

    // 2. Gemini OpenAI-compatible
    if (geminiKey && !geminiKey.startsWith("AQ.")) {
      providers.push({
        name: "Gemini",
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        key: geminiKey,
        model: "gemini-3.8-flash",
      });
    }

    // 3. NVIDIA NIM
    if (nvidiaKey) {
      providers.push({
        name: "NVIDIA",
        url: "https://integrate.api.nvidia.com/v1/chat/completions",
        key: nvidiaKey,
        model: "deepseek-ai/deepseek-v4.1-flash",
      });
    }

    // 4. OpenRouter
    if (openrouterKey) {
      providers.push({
        name: "OpenRouter",
        url: "https://openrouter.ai/api/v1/chat/completions",
        key: openrouterKey,
        model: "google/gemini-2.5-flash",
      });
    }

    if (providers.length === 0) {
      throw new Error("No AI provider API keys configured in environment.");
    }

    // Try providers sequentially
    let selectedResponse: Response | null = null;
    let selectedProviderName = "";
    let selectedProvider: ProviderConfig | null = null;

    for (const provider of providers) {
      try {
        const payload: any = {
          model: provider.model,
          messages: chatMessages,
          tools,
          tool_choice,
          temperature: 0.3,
          stream,
        };

        const res = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${provider.key}`,
          },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          selectedResponse = res;
          selectedProviderName = provider.name;
          selectedProvider = provider;
          break;
        } else {
          const errBody = await res.text().catch(() => "");
          console.warn(`[Chat API] Provider ${provider.name} failed (${res.status}):`, errBody.slice(0, 200));
        }
      } catch (err: any) {
        console.warn(`[Chat API] Provider ${provider.name} connection error:`, err.message);
      }
    }

    if (!selectedResponse) {
      throw new Error("All AI providers were unavailable or failed.");
    }

    // =========================================================================
    // A. Streaming Response Mode (SSE)
    // =========================================================================
    if (stream && selectedResponse.body) {
      const upstreamReader = selectedResponse.body.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      const transformStream = new ReadableStream({
        async start(controller) {
          let textAccumulator = "";
          let textBeforeTool = "";
          const toolCallMap = new Map<number, { id: string; name: string; args: string }>();
          let placeholderEmitted = false;
          let buffer = "";

          try {
            while (true) {
              const { value, done } = await upstreamReader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() || "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith(":")) continue;
                if (trimmed === "data: [DONE]") continue;

                if (trimmed.startsWith("data: ")) {
                  try {
                    const json = JSON.parse(trimmed.slice(6));
                    const delta = json.choices?.[0]?.delta;

                    if (!delta) continue;

                    // 1. Text delta
                    if (delta.content) {
                      textAccumulator += delta.content;
                      controller.enqueue(
                        encoder.encode(`data: ${JSON.stringify({ type: "text", delta: delta.content })}\n\n`)
                      );
                    }

                    // 2. Tool calls delta
                    if (delta.tool_calls && Array.isArray(delta.tool_calls)) {
                      for (const tc of delta.tool_calls) {
                        const index = tc.index ?? 0;
                        const existing = toolCallMap.get(index) || {
                          id: tc.id || "",
                          name: tc.function?.name || "",
                          args: "",
                        };

                        if (tc.id) existing.id = tc.id;
                        if (tc.function?.name) existing.name = tc.function.name;
                        if (tc.function?.arguments) existing.args += tc.function.arguments;

                        toolCallMap.set(index, existing);

                        if (!placeholderEmitted && (existing.name === "show_visual" || !existing.name)) {
                          placeholderEmitted = true;
                          textBeforeTool = textAccumulator;
                          controller.enqueue(
                            encoder.encode(
                              `data: ${JSON.stringify({
                                type: "placeholder",
                                message: "Drawing the graph...",
                              })}\n\n`
                            )
                          );
                        }
                      }
                    }
                  } catch {
                    // Ignore JSON parse errors for incomplete chunks
                  }
                }
              }
            }

            // Stream complete: validate tool calls
            const validatedVisuals: VisualSpec[] = [];
            for (const [, toolCall] of toolCallMap) {
              if (toolCall.name === "show_visual" && toolCall.args) {
                const validation = validateVisualSpec(toolCall.args);
                if (validation.success) {
                  validatedVisuals.push(validation.data);
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "visual", visual: validation.data })}\n\n`)
                  );
                } else {
                  console.warn("[Chat API] Dropped invalid visual tool spec:", validation.error, "args:", toolCall.args);
                }
              }
            }

            // If the model called a tool and generated little/no text (standard OpenAI tool finish),
            // call the provider with the tool result so the model completes the full step-by-step written answer!
            if (validatedVisuals.length > 0 && textAccumulator.trim().length < 80 && selectedProvider) {
              try {
                const rawToolCalls = Array.from(toolCallMap.values()).map((tc, idx) => ({
                  id: tc.id || `call_${idx}`,
                  type: "function",
                  function: { name: tc.name || "show_visual", arguments: tc.args },
                }));

                const assistantMsg: any = {
                  role: "assistant",
                  tool_calls: rawToolCalls,
                };
                if (textAccumulator) assistantMsg.content = textAccumulator;

                const followUpMessages = [
                  ...chatMessages,
                  assistantMsg,
                  ...rawToolCalls.map((tc) => ({
                    role: "tool",
                    tool_call_id: tc.id,
                    content: "The visual has been rendered inline to the student. Now provide the full, step-by-step master-teacher written answer and explanation in text matching the Doubtster structure (## Quick answer, ## Concept, ## Solution, ## Check, ## Common mistake, ## Final answer). The numbers in your explanation must match the numbers in the visual.",
                  })),
                ];

                const followUpRes = await fetch(selectedProvider.url, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${selectedProvider.key}`,
                  },
                  body: JSON.stringify({
                    model: selectedProvider.model,
                    messages: followUpMessages,
                    temperature: 0.3,
                    stream: true,
                  }),
                });

                if (followUpRes.ok && followUpRes.body) {
                  const followUpReader = followUpRes.body.getReader();
                  let followUpBuffer = "";
                  while (true) {
                    const { value, done } = await followUpReader.read();
                    if (done) break;
                    followUpBuffer += decoder.decode(value, { stream: true });
                    const fLines = followUpBuffer.split("\n");
                    followUpBuffer = fLines.pop() || "";
                    for (const fLine of fLines) {
                      const trimmed = fLine.trim();
                      if (!trimmed || !trimmed.startsWith("data: ")) continue;
                      if (trimmed === "data: [DONE]") continue;
                      try {
                        const fJson = JSON.parse(trimmed.slice(6));
                        const fDelta = fJson.choices?.[0]?.delta;
                        if (fDelta?.content) {
                          textAccumulator += fDelta.content;
                          controller.enqueue(
                            encoder.encode(`data: ${JSON.stringify({ type: "text", delta: fDelta.content })}\n\n`)
                          );
                        }
                      } catch {}
                    }
                  }
                }
              } catch (followUpErr: any) {
                console.warn("[Chat API] Follow-up text generation error:", followUpErr.message);
              }
            }

            // Construct final structured parts in inline order
            const parts: MessagePart[] = [];
            const trimmedBefore = textBeforeTool.trim();
            const afterToolText = textAccumulator.slice(textBeforeTool.length).trim();

            if (trimmedBefore) {
              parts.push({ type: "text", text: trimmedBefore });
            }
            for (const visual of validatedVisuals) {
              parts.push({ type: "visual", visual });
            }
            if (afterToolText) {
              parts.push({ type: "text", text: afterToolText });
            } else if (!trimmedBefore && textAccumulator.trim()) {
              parts.push({ type: "text", text: textAccumulator.trim() });
            }

            // Emit completion event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "done",
                  text: textAccumulator,
                  parts,
                  visuals: validatedVisuals,
                })}\n\n`
              )
            );
          } catch (err: any) {
            console.error("[Chat API Stream error]:", err);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(transformStream, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    // =========================================================================
    // B. Non-Streaming JSON Response Mode
    // =========================================================================
    const data = await selectedResponse.json();
    const choice = data.choices?.[0];
    const message = choice?.message || {};
    let rawText = message.content || "";
    const toolCalls = message.tool_calls || [];

    const validatedVisuals: VisualSpec[] = [];

    if (Array.isArray(toolCalls)) {
      for (const tc of toolCalls) {
        if (tc.function?.name === "show_visual" && tc.function.arguments) {
          const valRes = validateVisualSpec(tc.function.arguments);
          if (valRes.success) {
            validatedVisuals.push(valRes.data);
          } else {
            console.warn("[Chat API Non-stream] Dropped invalid visual:", valRes.error);
          }
        }
      }
    }

    if (validatedVisuals.length > 0 && (!rawText || rawText.trim().length < 80) && selectedProvider) {
      try {
        const assistantMsg: any = {
          role: "assistant",
          tool_calls: toolCalls,
        };
        if (rawText) assistantMsg.content = rawText;

        const followUpMessages = [
          ...chatMessages,
          assistantMsg,
          ...toolCalls.map((tc: any, idx: number) => ({
            role: "tool",
            tool_call_id: tc.id || `call_${idx}`,
            content: "The visual has been rendered inline to the student. Now provide the full, step-by-step master-teacher written answer and explanation in text matching the Doubtster structure (## Quick answer, ## Concept, ## Solution, ## Check, ## Common mistake, ## Final answer). The numbers in your explanation must match the numbers in the visual.",
          })),
        ];

        const followUpRes = await fetch(selectedProvider.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${selectedProvider.key}`,
          },
          body: JSON.stringify({
            model: selectedProvider.model,
            messages: followUpMessages,
            temperature: 0.3,
            stream: false,
          }),
        });

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json();
          const followUpText = followUpData.choices?.[0]?.message?.content || "";
          if (followUpText) {
            rawText = rawText ? `${rawText}\n\n${followUpText}` : followUpText;
          }
        } else {
          const errText = await followUpRes.text();
          console.warn("[Chat API Non-stream] Follow-up failed:", followUpRes.status, errText.slice(0, 200));
        }
      } catch (err: any) {
        console.warn("[Chat API Non-stream] Follow-up text error:", err.message);
      }
    }

    const parts: MessagePart[] = [];
    for (const visual of validatedVisuals) {
      parts.push({ type: "visual", visual });
    }
    if (rawText) {
      parts.push({ type: "text", text: rawText });
    }

    return NextResponse.json({
      text: rawText,
      parts,
      visuals: validatedVisuals,
      provider: selectedProviderName,
    });
  } catch (err: any) {
    console.error("Chat API Error:", err);
    return NextResponse.json(
      { text: `System Error: ${err.message}`, parts: [] },
      { status: 500 }
    );
  }
}
