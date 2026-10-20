import { EnvironmentProviders, inject, makeEnvironmentProviders } from '@angular/core';
import { LlmClient } from './data/llm-client';
import { OpenAiLlmClient } from './data/openai-llm-client';
import { CHAT_TOOLS } from './tools/chat-tool';
import {
  AddAddressTool,
  CreatePersonTool,
  DeletePersonTool,
  GetPersonTool,
  RemoveAddressTool,
  SearchPersonsTool,
  UpdatePersonTool,
} from './tools/person-tools';

export function provideChat(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: LlmClient, useExisting: OpenAiLlmClient },
    {
      provide: CHAT_TOOLS,
      useFactory: () => [
        inject(SearchPersonsTool),
        inject(GetPersonTool),
        inject(CreatePersonTool),
        inject(UpdatePersonTool),
        inject(AddAddressTool),
        inject(RemoveAddressTool),
        inject(DeletePersonTool),
      ],
    },
  ]);
}
