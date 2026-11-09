import { LLMMessage, LLMOptions, LLMProvider } from "./types";
import { OpenAICompatibleProvider } from "./openai-compatible";
import { MockProvider } from "./mock";

export function getProviders(requiresVision = false): LLMProvider[] {
  const providers: LLMProvider[] = [];

  const openrouterKey = process.env.OPENROUTER_API_KEY;
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;
  const nvidiaKey = process.env.NVIDIA_API_KEY;

  // When vision is required, prioritize multimodal models (OpenRouter Gemini 2.0 Flash / Llama Vision)
  if (requiresVision) {
    if (openrouterKey) {
      providers.push(
        new OpenAICompatibleProvider({
          name: "OpenRouter Vision",
          baseUrl: "https://openrouter.ai/api/v1/chat/completions",
          apiKey: openrouterKey,
          model: process.env.OPENROUTER_VISION_MODEL || "google/gemini-2.0-flash-001",
        })
      );
    }
    if (geminiKey && !geminiKey.startsWith("AQ.")) {
      providers.push(
        new OpenAICompatibleProvider({
          name: "Gemini 2.0 Flash Vision",
          baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          apiKey: geminiKey,
          model: "gemini-2.0-flash",
        })
      );
    }
    providers.push(new MockProvider());
    return providers;
  }

  // Normal text queries: prioritize high-speed, high-reasoning Groq Llama 3.3 70B
  if (groqKey) {
    providers.push(
      new OpenAICompatibleProvider({
        name: "Groq Llama 3.3 70B",
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: groqKey,
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      })
    );
    providers.push(
      new OpenAICompatibleProvider({
        name: "Groq Llama 3.1 8B",
        baseUrl: "https://api.groq.com/openai/v1/chat/completions",
        apiKey: groqKey,
        model: "llama-3.1-8b-instant",
      })
    );
  }

  if (openrouterKey) {
    providers.push(
      new OpenAICompatibleProvider({
        name: "OpenRouter Gemini 2.0 Flash",
        baseUrl: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: openrouterKey,
        model: process.env.OPENROUTER_MODEL || "google/gemini-2.0-flash-001",
      })
    );
    providers.push(
      new OpenAICompatibleProvider({
        name: "OpenRouter Llama 3.3 70B",
        baseUrl: "https://openrouter.ai/api/v1/chat/completions",
        apiKey: openrouterKey,
        model: "meta-llama/llama-3.3-70b-instruct",
      })
    );
  }

  if (geminiKey && !geminiKey.startsWith("AQ.")) {
    providers.push(
      new OpenAICompatibleProvider({
        name: "Gemini 2.0 Flash",
        baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        apiKey: geminiKey,
        model: "gemini-2.0-flash",
      })
    );
  }

  // Always keep mock provider at end of chain for testing or offline
  providers.push(new MockProvider());

  return providers;
}

export async function executeLLMChat(
  messages: LLMMessage[],
  options?: LLMOptions
): Promise<{ text: string; providerName: string }> {
  const providers = getProviders(Boolean(options?.requiresVision));
  let lastError: any = null;

  for (const provider of providers) {
    try {
      const res = await provider.chat(messages, options);
      if (res && res.trim().length > 0) {
        return { text: res, providerName: provider.name };
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[LLM] Provider ${provider.name} failed:`, err?.message);
    }
  }

  throw lastError || new Error("All LLM providers failed");
}

