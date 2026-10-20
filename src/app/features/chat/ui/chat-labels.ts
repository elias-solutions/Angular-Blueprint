import { de } from '../../../i18n/de';

type ToolName = keyof typeof de.chat.tools;

const TOOL_NAMES = Object.keys(de.chat.tools) as readonly ToolName[];

export function toolLabelKey(name: string): string | null {
  return TOOL_NAMES.includes(name as ToolName) ? `chat.tools.${name}` : null;
}
