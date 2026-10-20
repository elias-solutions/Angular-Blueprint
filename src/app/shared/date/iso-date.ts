const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function toIsoDate(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function parseIsoDate(value: string): Date {
  const match = ISO_DATE.exec(value);
  if (!match) {
    throw new Error(`Invalid ISO date '${value}'.`);
  }
  const [, year, month, day] = match;
  return new Date(Number(year), Number(month) - 1, Number(day));
}
