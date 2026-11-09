export type MessageContent =
  | string
  | Array<
      | { type: "text"; text: string }
      | { type: "image_url"; image_url: { url: string } }
    >;

export interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: MessageContent;
}

export interface LLMOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: { type: "json_object" };
  requiresVision?: boolean;
}

export interface LLMProvider {
  name: string;
  chat(messages: LLMMessage[], options?: LLMOptions): Promise<string>;
  stream?(
    messages: LLMMessage[],
    options: LLMOptions,
    onChunk: (chunk: string) => void
  ): Promise<string>;
}

