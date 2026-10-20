import { ToolArgumentError, ToolArguments } from './tool-arguments';

describe('ToolArguments', () => {
  it('parses a JSON object', () => {
    const args = ToolArguments.parse('{"id":"p1","query":"  Muster "}');

    expect(args.requiredString('id')).toBe('p1');
    expect(args.optionalString('query')).toBe('Muster');
  });

  it('treats empty arguments as an empty object', () => {
    const args = ToolArguments.parse('');

    expect(args.optionalString('query')).toBeNull();
    expect(args.has('query')).toBe(false);
  });

  it('rejects malformed JSON and non-objects', () => {
    expect(() => ToolArguments.parse('{oops')).toThrow(ToolArgumentError);
    expect(() => ToolArguments.parse('[1]')).toThrow('Arguments must be a JSON object.');
  });

  it('requires non-empty strings', () => {
    const args = ToolArguments.parse('{"id":"  ","n":5}');

    expect(() => args.requiredString('id')).toThrow("Argument 'id' is required.");
    expect(() => args.requiredString('missing')).toThrow("Argument 'missing' is required.");
    expect(() => args.optionalString('n')).toThrow("Argument 'n' must be a string.");
  });

  it('maps blank or null optional strings to null', () => {
    const args = ToolArguments.parse('{"email":"","phone":null}');

    expect(args.optionalString('email')).toBeNull();
    expect(args.optionalString('phone')).toBeNull();
    expect(args.has('phone')).toBe(true);
  });

  it('accepts enum values case-insensitively and rejects unknown ones', () => {
    const args = ToolArguments.parse('{"gender":"female","type":"Boss"}');

    expect(args.optionalEnum('gender', ['Male', 'Female'])).toBe('Female');
    expect(() => args.optionalEnum('type', ['Freelancer', 'Employee'])).toThrow(
      "Argument 'type' must be one of: Freelancer, Employee.",
    );
  });

  it('reads lists of objects as nested arguments', () => {
    const args = ToolArguments.parse('{"addresses":[{"city":"Basel"},{"city":"Bern"}]}');

    const cities = args.optionalObjects('addresses').map((item) => item.requiredString('city'));

    expect(cities).toEqual(['Basel', 'Bern']);
    expect(ToolArguments.parse('{}').optionalObjects('addresses')).toEqual([]);
  });

  it('rejects lists that are not lists of objects', () => {
    expect(() => ToolArguments.parse('{"a":"x"}').optionalObjects('a')).toThrow(
      "Argument 'a' must be a list of objects.",
    );
    expect(() => ToolArguments.parse('{"a":[1]}').optionalObjects('a')).toThrow(
      "Argument 'a' must be a list of objects.",
    );
  });

  it('accepts ISO dates only', () => {
    const args = ToolArguments.parse(
      '{"ok":"1990-02-28","bad":"28.02.1990","nodate":"1990-02-31"}',
    );

    expect(args.optionalDate('ok')).toBe('1990-02-28');
    expect(() => args.optionalDate('bad')).toThrow(
      "Argument 'bad' must be a date in the format yyyy-MM-dd.",
    );
    expect(() => args.optionalDate('nodate')).toThrow(ToolArgumentError);
  });
});
