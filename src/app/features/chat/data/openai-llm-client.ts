import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ChatProviderCapabilities } from '../../../core/config/app-config';
import { LlmMessage, LlmReply, ToolDefinition } from '../domain/chat';
import { ChatProviderSelection } from '../state/chat-provider-selection';
import { LlmClient } from './llm-client';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  OpenAiMessage,
  OpenAiTool,
} from './openai-chat.dto';
import { toUserContent } from './openai-content-parts';

const INLINE_THINKING = /<think>[\s\S]*?<\/think>/g;

@Injectable({ providedIn: 'root' })
export class OpenAiLlmClient extends LlmClient {
  private readonly http = inject(HttpClient);
  private readonly providers = inject(ChatProviderSelection);

  complete(
    messages: readonly LlmMessage[],
    tools: readonly ToolDefinition[],
  ): Observable<LlmReply> {
    const provider = this.providers.active();
    const request: ChatCompletionRequest = {
      model: provider.model,
      stream: false,
      messages: messages.map((message) => toOpenAiMessage(message, provider.capabilities)),
      ...(tools.length > 0 && { tools: tools.map(toOpenAiTool) }),
      ...(provider.reasoningEffort && { reasoning_effort: provider.reasoningEffort }),
    };
    return this.http
      .post<ChatCompletionResponse>(`${provider.baseUrl}/chat/completions`, request)
      .pipe(map(toReply));
  }
}

function toOpenAiMessage(
  message: LlmMessage,
  capabilities: ChatProviderCapabilities,
): OpenAiMessage {
  switch (message.role) {
    case 'assistant':
      return {
        role: 'assistant',
        content: message.content,
        ...(message.toolCalls.length > 0 && {
          tool_calls: message.toolCalls.map((call) => ({
            id: call.id,
            type: 'function' as const,
            function: { name: call.name, arguments: call.arguments },
          })),
        }),
      };
    case 'tool':
      return { role: 'tool', tool_call_id: message.toolCallId, content: message.content };
    case 'user':
      return {
        role: 'user',
        content: toUserContent(message.content, message.attachments ?? [], capabilities),
      };
    default:
      return { role: message.role, content: message.content };
  }
}

function toOpenAiTool(tool: ToolDefinition): OpenAiTool {
  return {
    type: 'function',
    function: { name: tool.name, description: tool.description, parameters: tool.parameters },
  };
}

function toReply(response: ChatCompletionResponse): LlmReply {
  const message = response.choices[0]?.message;
  if (!message) {
    throw new Error('The language model returned no answer.');
  }
  const content = message.content?.replace(INLINE_THINKING, '').trim() || null;
  return {
    content,
    toolCalls: (message.tool_calls ?? []).map((call) => ({
      id: call.id,
      name: call.function.name,
      arguments: call.function.arguments,
    })),
  };
}
