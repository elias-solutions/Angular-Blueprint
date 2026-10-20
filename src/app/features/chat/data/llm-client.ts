import { Observable } from 'rxjs';
import { LlmMessage, LlmReply, ToolDefinition } from '../domain/chat';

export abstract class LlmClient {
  abstract complete(
    messages: readonly LlmMessage[],
    tools: readonly ToolDefinition[],
  ): Observable<LlmReply>;
}
