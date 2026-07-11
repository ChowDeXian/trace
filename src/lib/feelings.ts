import { FEELINGS, type Feeling, type Intensity } from '../types';

export interface FeelingMeta {
  emoji: string;
  label: string;
  color: string;
  /** Signed weight for the wellbeing score; score = valence * intensity, in -10..+10. */
  valence: number;
}

export const FEELING_META: Record<Feeling, FeelingMeta> = {
  happy: { emoji: '😄', label: 'Happy', color: '#C2820A', valence: 1 },
  calm: { emoji: '😌', label: 'Calm', color: '#0D9488', valence: 0.7 },
  neutral: { emoji: '😐', label: 'Neutral', color: '#6E7F7B', valence: 0 },
  sad: { emoji: '😢', label: 'Sad', color: '#28619E', valence: -1 },
  anxious: { emoji: '😰', label: 'Anxious', color: '#9B74DC', valence: -0.8 },
  frustrated: { emoji: '😤', label: 'Frustrated', color: '#B8433C', valence: -0.8 },
};

export const INTENSITY_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function isFeeling(v: unknown): v is Feeling {
  return typeof v === 'string' && (FEELINGS as readonly string[]).includes(v);
}

export function isIntensity(v: unknown): v is Intensity {
  return typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= 10;
}

/** Wellbeing score for one entry: positive feelings up, negative down, neutral 0. */
export function valenceScore(feeling: Feeling, intensity: number): number {
  return FEELING_META[feeling].valence * intensity;
}
