import type { PersistedState, Settings, Tag } from '../types';
import { newId } from '../lib/id';

export const STORAGE_KEY = 'trace.v1';
export const SCHEMA_VERSION = 1;

export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

const DEFAULT_TAG_NAMES = [
  'work',
  'sleep',
  'gym',
  'family',
  'friends',
  'food',
  'health',
  'money',
  'weather',
];

export function seedTags(): Tag[] {
  return DEFAULT_TAG_NAMES.map((name) => ({ id: newId(), name, builtin: true }));
}

export function defaultSettings(): Settings {
  return { weekStartsOn: 1, lastBackupAt: null };
}

export function defaultState(): PersistedState {
  return {
    schemaVersion: SCHEMA_VERSION,
    entries: [],
    tags: seedTags(),
    settings: defaultSettings(),
  };
}

export function loadState(store: StorageLike = localStorage): PersistedState {
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (
      parsed == null ||
      typeof parsed !== 'object' ||
      parsed.schemaVersion !== SCHEMA_VERSION ||
      !Array.isArray(parsed.entries) ||
      !Array.isArray(parsed.tags)
    ) {
      return defaultState();
    }
    return {
      schemaVersion: SCHEMA_VERSION,
      entries: parsed.entries,
      tags: parsed.tags,
      settings: { ...defaultSettings(), ...parsed.settings },
    };
  } catch {
    return defaultState();
  }
}

/** Returns false when the write failed (e.g. quota exceeded). */
export function saveState(state: PersistedState, store: StorageLike = localStorage): boolean {
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
