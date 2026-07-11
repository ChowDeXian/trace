import type { Entry, Tag } from '../types';
import { addDays } from './dates';

export interface DayPoint {
  dateKey: string;
  avg: number;
  count: number;
}

/** Average mood per day, sorted ascending by dateKey. */
export function dailyAverages(entries: Entry[]): DayPoint[] {
  const sums = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    const s = sums.get(e.dateKey) ?? { sum: 0, count: 0 };
    s.sum += e.mood;
    s.count += 1;
    sums.set(e.dateKey, s);
  }
  return [...sums.entries()]
    .map(([dateKey, { sum, count }]) => ({ dateKey, avg: sum / count, count }))
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
}

/** Trailing moving average over the previous `window` points (inclusive). */
export function movingAverage(points: DayPoint[], window: number): number[] {
  return points.map((_, i) => {
    const slice = points.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, p) => s + p.avg, 0) / slice.length;
  });
}

export interface Streaks {
  current: number;
  longest: number;
}

/**
 * A day counts toward a streak when it has >= 1 entry. The current streak stays
 * alive if today has no entry yet (counted from yesterday backwards).
 */
export function computeStreaks(dateKeys: Set<string>, todayKey: string): Streaks {
  let current = 0;
  let cursor = dateKeys.has(todayKey) ? todayKey : addDays(todayKey, -1);
  while (dateKeys.has(cursor)) {
    current += 1;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  for (const key of dateKeys) {
    if (dateKeys.has(addDays(key, -1))) continue; // only start counting at run starts
    let len = 0;
    let k = key;
    while (dateKeys.has(k)) {
      len += 1;
      k = addDays(k, 1);
    }
    if (len > longest) longest = len;
  }
  return { current, longest };
}

export function bestWorstDays(daily: DayPoint[], n = 3): { best: DayPoint[]; worst: DayPoint[] } {
  const sorted = [...daily].sort((a, b) => b.avg - a.avg || (a.dateKey < b.dateKey ? -1 : 1));
  return { best: sorted.slice(0, n), worst: sorted.slice(-n).reverse() };
}

export interface DowStat {
  dow: number; // 0=Sun..6=Sat
  avg: number;
  count: number;
}

export function dayOfWeekAverages(daily: DayPoint[]): DowStat[] {
  const acc = new Map<number, { sum: number; count: number }>();
  for (const p of daily) {
    const [y, m, d] = p.dateKey.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    const s = acc.get(dow) ?? { sum: 0, count: 0 };
    s.sum += p.avg;
    s.count += 1;
    acc.set(dow, s);
  }
  return [...acc.entries()]
    .map(([dow, { sum, count }]) => ({ dow, avg: sum / count, count }))
    .sort((a, b) => a.dow - b.dow);
}

export interface TagStat {
  tagId: string;
  name: string;
  count: number;
  avgMood: number;
  delta: number; // avgMood - overall average; "average mood when tagged", not causal
}

export function tagCorrelations(entries: Entry[], tags: Tag[], minCount = 3): TagStat[] {
  if (entries.length === 0) return [];
  const overall = entries.reduce((s, e) => s + e.mood, 0) / entries.length;
  const byTag = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    for (const tagId of e.tagIds) {
      const s = byTag.get(tagId) ?? { sum: 0, count: 0 };
      s.sum += e.mood;
      s.count += 1;
      byTag.set(tagId, s);
    }
  }
  const stats: TagStat[] = [];
  for (const tag of tags) {
    const s = byTag.get(tag.id);
    if (!s || s.count < minCount) continue;
    const avgMood = s.sum / s.count;
    stats.push({ tagId: tag.id, name: tag.name, count: s.count, avgMood, delta: avgMood - overall });
  }
  return stats.sort((a, b) => b.delta - a.delta);
}
