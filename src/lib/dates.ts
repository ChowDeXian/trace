/** 'YYYY-MM-DD' in local time. */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d); // local midnight; immune to UTC parsing shifts
}

/** Add days in local calendar time (DST-safe: Date handles the rollover). */
export function addDays(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setDate(d.getDate() + days);
  return toDateKey(d);
}

export interface MonthCell {
  key: string;
  inMonth: boolean;
}

/** Grid of full weeks covering the given month. `month` is 0-based. */
export function monthGrid(year: number, month: number, weekStartsOn: 0 | 1): MonthCell[] {
  const first = new Date(year, month, 1);
  const lead = (first.getDay() - weekStartsOn + 7) % 7;
  const start = new Date(year, month, 1 - lead);
  const cells: MonthCell[] = [];
  const d = new Date(start);
  do {
    cells.push({ key: toDateKey(d), inMonth: d.getMonth() === month });
    d.setDate(d.getDate() + 1);
  } while (d.getMonth() === month || cells.length % 7 !== 0);
  return cells;
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function weekdayNames(weekStartsOn: 0 | 1): string[] {
  return [...DAY_NAMES.slice(weekStartsOn), ...DAY_NAMES.slice(0, weekStartsOn)];
}

export function dayName(dow: number): string {
  return DAY_NAMES[dow];
}

const FULL_FMT = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});
const SHORT_FMT = new Intl.DateTimeFormat('en', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const MONTH_FMT = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric' });
const TIME_FMT = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });

export function formatDateFull(key: string): string {
  return FULL_FMT.format(parseDateKey(key));
}

export function formatDateShort(key: string): string {
  return SHORT_FMT.format(parseDateKey(key));
}

export function formatMonth(year: number, month: number): string {
  return MONTH_FMT.format(new Date(year, month, 1));
}

export function formatTime(epochMs: number): string {
  return TIME_FMT.format(new Date(epochMs));
}
