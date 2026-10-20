export interface JsonSchema {
  readonly type: 'object' | 'string' | 'array';
  readonly description?: string;
  readonly properties?: Readonly<Record<string, JsonSchema>>;
  readonly required?: readonly string[];
  readonly enum?: readonly string[];
  readonly items?: JsonSchema;
}

export interface ToolDefinition {
  readonly name: string;
  readonly description: string;
  readonly parameters: JsonSchema;
}

export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: string;
}

export type AttachmentKind = 'text' | 'image' | 'pdf';

export interface ChatAttachment {
  readonly name: string;
  readonly kind: AttachmentKind;
  readonly content: string;
}

export type LlmMessage =
  | { readonly role: 'system'; readonly content: string }
  | {
      readonly role: 'user';
      readonly content: string;
      readonly attachments?: readonly ChatAttachment[];
    }
  | {
      readonly role: 'assistant';
      readonly content: string | null;
      readonly toolCalls: readonly ToolCall[];
    }
  | { readonly role: 'tool'; readonly toolCallId: string; readonly content: string };

export interface LlmReply {
  readonly content: string | null;
  readonly toolCalls: readonly ToolCall[];
}

export type ChatEntry =
  | { readonly kind: 'user'; readonly text: string; readonly attachments: readonly string[] }
  | { readonly kind: 'assistant' | 'error'; readonly text: string }
  | { readonly kind: 'tool'; readonly toolName: string; readonly succeeded: boolean };
