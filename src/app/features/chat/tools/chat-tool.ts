import { InjectionToken } from '@angular/core';
import { ToolDefinition } from '../domain/chat';
import { ToolArguments } from './tool-arguments';

export type ToolPermission = 'read' | 'write' | 'delete';

export interface ChatTool {
  readonly permission: ToolPermission;
  readonly definition: ToolDefinition;
  execute(args: ToolArguments): Promise<unknown>;
}

export const CHAT_TOOLS = new InjectionToken<readonly ChatTool[]>('CHAT_TOOLS');
