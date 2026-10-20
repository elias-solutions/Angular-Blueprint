import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { ApiErrorMapper } from '../../../core/http/api-error-mapper';
import { ToolCall, ToolDefinition } from '../domain/chat';
import { CHAT_TOOLS, ChatTool } from './chat-tool';
import { ToolArguments } from './tool-arguments';
import { ToolPermissionPolicy } from './tool-permission-policy';

export interface ToolOutcome {
  readonly succeeded: boolean;
  readonly content: string;
}

@Injectable({ providedIn: 'root' })
export class ChatToolRegistry {
  private readonly tools = inject(CHAT_TOOLS);
  private readonly policy = inject(ToolPermissionPolicy);
  private readonly errors = inject(ApiErrorMapper);

  private readonly available = computed(() =>
    this.tools.filter((tool) => this.policy.allows(tool.permission)),
  );

  readonly definitions = computed<readonly ToolDefinition[]>(() =>
    this.available().map((tool) => tool.definition),
  );

  async execute(call: ToolCall): Promise<ToolOutcome> {
    const tool = this.find(call.name);
    if (!tool) {
      return failed(`Tool '${call.name}' is not available to the current user.`);
    }
    try {
      const result = await tool.execute(ToolArguments.parse(call.arguments));
      return { succeeded: true, content: JSON.stringify(result) };
    } catch (error) {
      const status = error instanceof HttpErrorResponse ? error.status : undefined;
      return failed(this.errors.toMessage(error), status);
    }
  }

  private find(name: string): ChatTool | undefined {
    return this.available().find((tool) => tool.definition.name === name);
  }
}

function failed(error: string, status?: number): ToolOutcome {
  return { succeeded: false, content: JSON.stringify(status ? { error, status } : { error }) };
}
