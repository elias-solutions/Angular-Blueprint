import { parseIsoDate, toIsoDate } from '../../../shared/date/iso-date';

export class ToolArgumentError extends Error {}

export class ToolArguments {
  private constructor(private readonly values: Readonly<Record<string, unknown>>) {}

  static parse(json: string): ToolArguments {
    if (!json.trim()) {
      return new ToolArguments({});
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new ToolArgumentError('Arguments are not valid JSON.');
    }
    if (!isPlainObject(parsed)) {
      throw new ToolArgumentError('Arguments must be a JSON object.');
    }
    return new ToolArguments(parsed);
  }

  has(name: string): boolean {
    return name in this.values;
  }

  requiredString(name: string): string {
    const value = this.optionalString(name);
    if (value === null) {
      throw new ToolArgumentError(`Argument '${name}' is required.`);
    }
    return value;
  }

  optionalString(name: string): string | null {
    const value = this.values[name];
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value !== 'string') {
      throw new ToolArgumentError(`Argument '${name}' must be a string.`);
    }
    return value.trim() || null;
  }

  optionalObjects(name: string): ToolArguments[] {
    const value = this.values[name];
    if (value === undefined || value === null) {
      return [];
    }
    if (!Array.isArray(value) || !value.every(isPlainObject)) {
      throw new ToolArgumentError(`Argument '${name}' must be a list of objects.`);
    }
    return value.map((item) => new ToolArguments(item));
  }

  optionalEnum<T extends string>(name: string, allowed: readonly T[]): T | null {
    const value = this.optionalString(name);
    if (value === null) {
      return null;
    }
    const match = allowed.find((candidate) => candidate.toLowerCase() === value.toLowerCase());
    if (!match) {
      throw new ToolArgumentError(`Argument '${name}' must be one of: ${allowed.join(', ')}.`);
    }
    return match;
  }

  optionalDate(name: string): string | null {
    const value = this.optionalString(name);
    if (value === null) {
      return null;
    }
    if (!isCalendarDate(value)) {
      throw new ToolArgumentError(`Argument '${name}' must be a date in the format yyyy-MM-dd.`);
    }
    return value;
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isCalendarDate(value: string): boolean {
  try {
    return toIsoDate(parseIsoDate(value)) === value;
  } catch {
    return false;
  }
}
