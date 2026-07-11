import type { MoodValue } from '../types';

export interface MoodMeta {
  emoji: string;
  label: string;
  color: string;
}

export const MOOD_VALUES: MoodValue[] = [1, 2, 3, 4, 5];

export const MOODS: Record<MoodValue, MoodMeta> = {
  1: { emoji: '😞', label: 'Awful', color: '#E5484D' },
  2: { emoji: '😕', label: 'Bad', color: '#F76B15' },
  3: { emoji: '😐', label: 'Okay', color: '#F5D90A' },
  4: { emoji: '🙂', label: 'Good', color: '#8DD13F' },
  5: { emoji: '😄', label: 'Great', color: '#30C48D' },
};

export function isMoodValue(v: unknown): v is MoodValue {
  return v === 1 || v === 2 || v === 3 || v === 4 || v === 5;
}

/** Nearest mood for a fractional average, for coloring day cells / chart dots. */
export function roundMood(avg: number): MoodValue {
  const r = Math.round(avg);
  return (r < 1 ? 1 : r > 5 ? 5 : r) as MoodValue;
}
