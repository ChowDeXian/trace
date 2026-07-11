import { describe, expect, it } from 'vitest';
import { FEELING_META, isFeeling, isIntensity, valenceScore } from '../src/lib/feelings';
import { FEELINGS } from '../src/types';

describe('isFeeling', () => {
  it('accepts all six feelings', () => {
    for (const f of FEELINGS) expect(isFeeling(f)).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isFeeling('angry')).toBe(false);
    expect(isFeeling(3)).toBe(false);
    expect(isFeeling(null)).toBe(false);
    expect(isFeeling(undefined)).toBe(false);
    expect(isFeeling('Happy')).toBe(false); // case-sensitive
  });
});

describe('isIntensity', () => {
  it('accepts integers 1 through 10', () => {
    expect(isIntensity(1)).toBe(true);
    expect(isIntensity(5)).toBe(true);
    expect(isIntensity(10)).toBe(true);
  });

  it('rejects out-of-range, fractional and non-numeric values', () => {
    expect(isIntensity(0)).toBe(false);
    expect(isIntensity(11)).toBe(false);
    expect(isIntensity(5.5)).toBe(false);
    expect(isIntensity('5')).toBe(false);
    expect(isIntensity(null)).toBe(false);
    expect(isIntensity(NaN)).toBe(false);
  });
});

describe('valenceScore', () => {
  it('maps feelings to the signed -10..+10 wellbeing scale', () => {
    expect(valenceScore('happy', 10)).toBe(10);
    expect(valenceScore('calm', 10)).toBe(7);
    expect(valenceScore('neutral', 9)).toBe(0);
    expect(valenceScore('sad', 10)).toBe(-10);
    expect(valenceScore('anxious', 5)).toBe(-4);
    expect(valenceScore('frustrated', 10)).toBe(-8);
  });

  it('has display metadata for every feeling', () => {
    for (const f of FEELINGS) {
      expect(FEELING_META[f].emoji).toBeTruthy();
      expect(FEELING_META[f].label).toBeTruthy();
      expect(FEELING_META[f].color).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });
});
