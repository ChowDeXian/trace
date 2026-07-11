import { describe, expect, it } from 'vitest';
import { addDays, monthGrid, parseDateKey, toDateKey, weekdayNames } from '../src/lib/dates';

describe('toDateKey / parseDateKey', () => {
  it('round-trips a local date', () => {
    const d = new Date(2026, 6, 11); // 2026-07-11 local
    expect(toDateKey(d)).toBe('2026-07-11');
    expect(toDateKey(parseDateKey('2026-07-11'))).toBe('2026-07-11');
  });

  it('pads single-digit months and days', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('uses local time near midnight, not UTC', () => {
    const lateNight = new Date(2026, 2, 15, 23, 59, 59);
    expect(toDateKey(lateNight)).toBe('2026-03-15');
  });
});

describe('addDays', () => {
  it('adds and subtracts days', () => {
    expect(addDays('2026-07-11', 1)).toBe('2026-07-12');
    expect(addDays('2026-07-11', -11)).toBe('2026-06-30');
  });

  it('crosses month and year boundaries', () => {
    expect(addDays('2025-12-31', 1)).toBe('2026-01-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
  });

  it('handles leap years', () => {
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2025-02-28', 1)).toBe('2025-03-01');
  });

  it('walks across DST transitions one day at a time', () => {
    // US spring-forward 2026-03-08; must not skip or duplicate a day
    expect(addDays('2026-03-07', 1)).toBe('2026-03-08');
    expect(addDays('2026-03-08', 1)).toBe('2026-03-09');
    expect(addDays('2026-03-09', -1)).toBe('2026-03-08');
  });
});

describe('monthGrid', () => {
  it('covers the whole month in full weeks', () => {
    const cells = monthGrid(2026, 6, 1); // July 2026, Monday start
    expect(cells.length % 7).toBe(0);
    const inMonth = cells.filter((c) => c.inMonth);
    expect(inMonth.length).toBe(31);
    expect(inMonth[0].key).toBe('2026-07-01');
    expect(inMonth[30].key).toBe('2026-07-31');
  });

  it('handles February in a leap year', () => {
    const cells = monthGrid(2024, 1, 0); // Feb 2024, Sunday start
    expect(cells.filter((c) => c.inMonth).length).toBe(29);
    expect(cells.length % 7).toBe(0);
  });

  it('respects weekStartsOn', () => {
    // 2026-07-01 is a Wednesday
    const mon = monthGrid(2026, 6, 1);
    const sun = monthGrid(2026, 6, 0);
    expect(mon[0].key).toBe('2026-06-29'); // Monday before
    expect(sun[0].key).toBe('2026-06-28'); // Sunday before
  });
});

describe('weekdayNames', () => {
  it('rotates by week start', () => {
    expect(weekdayNames(0)[0]).toBe('Sun');
    expect(weekdayNames(1)[0]).toBe('Mon');
    expect(weekdayNames(1)[6]).toBe('Sun');
  });
});
