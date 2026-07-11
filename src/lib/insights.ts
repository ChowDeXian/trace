import { FEELINGS, type Entry, type Feeling, type Tag } from '../types';
import { valenceScore } from './feelings';
import { addDays } from './dates';

export interface DayPoint {
  dateKey: string;
  avgValence: number; // -10..+10
  avgIntensity: number; // 1..10
  count: number;
  dominant: Feeling; // most frequent; ties broken by summed intensity, then FEELINGS order
}

/** Per-day stats, sorted ascending by dateKey. */
export function dailyStats(entries: Entry[]): DayPoint[] {
  const days = new Map<string, Entry[]>();
  for (const e of entries) {
    const list = days.get(e.dateKey) ?? [];
    list.push(e);
    days.set(e.dateKey, list);
  }
  return [...days.entries()]
    .map(([dateKey, list]) => ({
      dateKey,
      avgValence: list.reduce((s, e) => s + valenceScore(e.feeling, e.intensity), 0) / list.length,
      avgIntensity: list.reduce((s, e) => s + e.intensity, 0) / list.length,
      count: list.length,
      dominant: dominantFeeling(list),
    }))
    .sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1));
}

export function dominantFeeling(entries: Entry[]): Feeling {
  const counts = new Map<Feeling, { count: number; intensity: number }>();
  for (const e of entries) {
    const s = counts.get(e.feeling) ?? { count: 0, intensity: 0 };
    s.count += 1;
    s.intensity += e.intensity;
    counts.set(e.feeling, s);
  }
  let best: Feeling = FEELINGS[0];
  let bestScore = { count: -1, intensity: -1 };
  for (const f of FEELINGS) {
    const s = counts.get(f);
    if (!s) continue;
    if (s.count > bestScore.count || (s.count === bestScore.count && s.intensity > bestScore.intensity)) {
      best = f;
      bestScore = s;
    }
  }
  return best;
}

/** Trailing moving average over the previous `window` values (inclusive). */
export function movingAverage(values: number[], window: number): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1);
    return slice.reduce((s, v) => s + v, 0) / slice.length;
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
  const sorted = [...daily].sort((a, b) => b.avgValence - a.avgValence || (a.dateKey < b.dateKey ? -1 : 1));
  return { best: sorted.slice(0, n), worst: sorted.slice(-n).reverse() };
}

export interface DowStat {
  dow: number; // 0=Sun..6=Sat
  avgValence: number;
  count: number;
}

export function dayOfWeekStats(daily: DayPoint[]): DowStat[] {
  const acc = new Map<number, { sum: number; count: number }>();
  for (const p of daily) {
    const [y, m, d] = p.dateKey.split('-').map(Number);
    const dow = new Date(y, m - 1, d).getDay();
    const s = acc.get(dow) ?? { sum: 0, count: 0 };
    s.sum += p.avgValence;
    s.count += 1;
    acc.set(dow, s);
  }
  return [...acc.entries()]
    .map(([dow, { sum, count }]) => ({ dow, avgValence: sum / count, count }))
    .sort((a, b) => a.dow - b.dow);
}

export interface FeelingStat {
  feeling: Feeling;
  count: number;
  share: number; // 0..1 of all entries
  avgIntensity: number;
  weeklyCounts: number[]; // trailing 7-day buckets ending today, oldest first
}

/** How often each feeling shows up, with a weekly sparkline series. */
export function feelingBreakdown(entries: Entry[], todayKey: string, weeks = 8): FeelingStat[] {
  const total = entries.length;
  return FEELINGS.map((feeling) => {
    const own = entries.filter((e) => e.feeling === feeling);
    const weeklyCounts = new Array<number>(weeks).fill(0);
    for (const e of own) {
      // bucket 0 = oldest week; the newest bucket ends today
      const age = daysBetween(e.dateKey, todayKey);
      if (age < 0 || age >= weeks * 7) continue;
      weeklyCounts[weeks - 1 - Math.floor(age / 7)] += 1;
    }
    return {
      feeling,
      count: own.length,
      share: total === 0 ? 0 : own.length / total,
      avgIntensity: own.length === 0 ? 0 : own.reduce((s, e) => s + e.intensity, 0) / own.length,
      weeklyCounts,
    };
  });
}

function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  // local-midnight difference; DST drift is < 2h so rounding is safe
  return Math.round((new Date(ty, tm - 1, td).getTime() - new Date(fy, fm - 1, fd).getTime()) / 86400000);
}

export const TOD_BUCKETS = ['morning', 'afternoon', 'evening', 'night'] as const;
export type TodBucket = (typeof TOD_BUCKETS)[number];

export interface TodStat {
  bucket: TodBucket;
  count: number;
  avgValence: number;
  dominant: Feeling | null;
}

export function todBucket(hour: number): TodBucket {
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 16) return 'afternoon';
  if (hour >= 17 && hour <= 21) return 'evening';
  return 'night'; // 22..23 and 0..4
}

/** Entry patterns by time of day; always returns all 4 buckets in order. */
export function timeOfDayStats(entries: Entry[]): TodStat[] {
  const byBucket = new Map<TodBucket, Entry[]>();
  for (const e of entries) {
    const b = todBucket(new Date(e.createdAt).getHours());
    const list = byBucket.get(b) ?? [];
    list.push(e);
    byBucket.set(b, list);
  }
  return TOD_BUCKETS.map((bucket) => {
    const list = byBucket.get(bucket) ?? [];
    return {
      bucket,
      count: list.length,
      avgValence:
        list.length === 0
          ? 0
          : list.reduce((s, e) => s + valenceScore(e.feeling, e.intensity), 0) / list.length,
      dominant: list.length === 0 ? null : dominantFeeling(list),
    };
  });
}

export interface TagStat {
  tagId: string;
  name: string;
  count: number;
  avgValence: number;
  delta: number; // avgValence - overall average; "wellbeing when tagged", not causal
}

export function tagCorrelations(entries: Entry[], tags: Tag[], minCount = 3): TagStat[] {
  if (entries.length === 0) return [];
  const overall =
    entries.reduce((s, e) => s + valenceScore(e.feeling, e.intensity), 0) / entries.length;
  const byTag = new Map<string, { sum: number; count: number }>();
  for (const e of entries) {
    for (const tagId of e.tagIds) {
      const s = byTag.get(tagId) ?? { sum: 0, count: 0 };
      s.sum += valenceScore(e.feeling, e.intensity);
      s.count += 1;
      byTag.set(tagId, s);
    }
  }
  const stats: TagStat[] = [];
  for (const tag of tags) {
    const s = byTag.get(tag.id);
    if (!s || s.count < minCount) continue;
    const avgValence = s.sum / s.count;
    stats.push({ tagId: tag.id, name: tag.name, count: s.count, avgValence, delta: avgValence - overall });
  }
  return stats.sort((a, b) => b.delta - a.delta);
}

export interface TagFeelingStat {
  tagId: string;
  name: string;
  total: number;
  counts: Record<Feeling, number>;
}

/** Which feelings co-occur with each tag; sorted by total desc. */
export function tagFeelingCounts(entries: Entry[], tags: Tag[], minCount = 3): TagFeelingStat[] {
  const byTag = new Map<string, Record<Feeling, number>>();
  for (const e of entries) {
    for (const tagId of e.tagIds) {
      let counts = byTag.get(tagId);
      if (!counts) {
        counts = Object.fromEntries(FEELINGS.map((f) => [f, 0])) as Record<Feeling, number>;
        byTag.set(tagId, counts);
      }
      counts[e.feeling] += 1;
    }
  }
  const stats: TagFeelingStat[] = [];
  for (const tag of tags) {
    const counts = byTag.get(tag.id);
    if (!counts) continue;
    const total = FEELINGS.reduce((s, f) => s + counts[f], 0);
    if (total < minCount) continue;
    stats.push({ tagId: tag.id, name: tag.name, total, counts });
  }
  return stats.sort((a, b) => b.total - a.total);
}
