import { Injectable, inject } from '@angular/core';
import { AuthSession } from '../../../core/auth/auth-session';
import { Language } from '../../../i18n/language';
import { LanguageService } from '../../../i18n/language.service';
import { toIsoDate } from '../../../shared/date/iso-date';
import { ToolPermissionPolicy } from '../tools/tool-permission-policy';

const LANGUAGE_NAMES: Readonly<Record<Language, string>> = { de: 'German', en: 'English' };

@Injectable({ providedIn: 'root' })
export class ChatSystemPrompt {
  private readonly auth = inject(AuthSession);
  private readonly language = inject(LanguageService);
  private readonly policy = inject(ToolPermissionPolicy);

  build(): string {
    return [
      'You are the assistant of a person and address management application.',
      'For persons and addresses you work exclusively through the provided tools;',
      'never invent persons, addresses or results.',
      'The user may attach files to a message; their content follows the message text.',
      'Do with the files what the user asks, e.g. summarise them or create persons from them.',
      `The signed-in user is "${this.auth.userName()}" and may ${this.rights()}.`,
      'If the user asks for something these rights do not allow, say so instead of trying.',
      'Look persons up with search_persons or get_person before changing them.',
      'Only use ids that a tool result returned; never guess an id. Call a tool that needs an id',
      'only after the result containing that id has arrived, one call at a time.',
      'If a tool fails because of a wrong id, look the id up and try again.',
      'Ask for missing required data (first and last name) instead of guessing.',
      'Never show ids, versions or other technical fields to the user.',
      'After a change, state briefly what was done. If a tool returns an error, explain it.',
      `Today is ${toIsoDate(new Date())}. Dates in tool arguments use the format yyyy-MM-dd.`,
      `Always answer in ${LANGUAGE_NAMES[this.language.active()]}, short and in plain text without tables.`,
    ].join('\n');
  }

  private rights(): string {
    if (this.policy.allows('delete')) {
      return 'read, create, change and delete persons and addresses';
    }
    if (this.policy.allows('write')) {
      return 'read, create and change persons and addresses, but not delete persons';
    }
    return 'read only (no creating, changing or deleting)';
  }
}
