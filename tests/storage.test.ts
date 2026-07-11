import { describe, expect, it } from 'vitest';
import { STORAGE_KEY, defaultState, loadState, saveState, type StorageLike } from '../src/storage/storage';

function memStore(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => {
      data[k] = v;
    },
  };
}

describe('loadState', () => {
  it('returns seeded defaults on an empty store', () => {
    const state = loadState(memStore());
    expect(state.schemaVersion).toBe(1);
    expect(state.entries).toEqual([]);
    expect(state.tags.length).toBeGreaterThan(0);
    expect(state.tags.every((t) => t.builtin)).toBe(true);
    expect(state.settings.weekStartsOn).toBe(1);
  });

  it('returns defaults on corrupt JSON without throwing', () => {
    const store = memStore({ [STORAGE_KEY]: '{not json' });
    expect(loadState(store).entries).toEqual([]);
  });

  it('returns defaults on wrong shape', () => {
    const store = memStore({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 99 }) });
    expect(loadState(store).entries).toEqual([]);
  });

  it('fills missing settings fields with defaults', () => {
    const state = defaultState();
    const raw = JSON.parse(JSON.stringify(state));
    delete raw.settings.lastBackupAt;
    const store = memStore({ [STORAGE_KEY]: JSON.stringify(raw) });
    expect(loadState(store).settings.lastBackupAt).toBeNull();
  });
});

describe('saveState / loadState roundtrip', () => {
  it('persists and restores identically', () => {
    const store = memStore();
    const state = defaultState();
    state.entries.push({
      id: 'e1',
      createdAt: 123,
      updatedAt: 123,
      dateKey: '2026-07-11',
      mood: 4,
      note: 'good session 💪',
      tagIds: [state.tags[0].id],
    });
    expect(saveState(state, store)).toBe(true);
    expect(loadState(store)).toEqual(state);
  });

  it('reports quota failures instead of throwing', () => {
    const store: StorageLike = {
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
    };
    expect(saveState(defaultState(), store)).toBe(false);
  });
});
