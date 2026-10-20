import { JsonSchema } from '../domain/chat';

export interface OpenAiToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type OpenAiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } }
  | { type: 'file'; file: { filename: string; file_data: string } };

export type OpenAiMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string | OpenAiContentPart[] }
  | { role: 'assistant'; content: string | null; tool_calls?: OpenAiToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string };

export interface OpenAiTool {
  type: 'function';
  function: { name: string; description: string; parameters: JsonSchema };
}

export interface ChatCompletionRequest {
  model: string;
  stream: false;
  messages: OpenAiMessage[];
  tools?: OpenAiTool[];
  reasoning_effort?: string;
}

export interface ChatCompletionResponse {
  choices: {
    message: { role: 'assistant'; content: string | null; tool_calls?: OpenAiToolCall[] };
  }[];
}
