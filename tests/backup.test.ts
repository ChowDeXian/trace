import { describe, expect, it } from 'vitest';
import { parseBackup, serializeBackup } from '../src/storage/backup';
import { defaultState } from '../src/storage/storage';
import type { PersistedState } from '../src/types';

function sampleState(): PersistedState {
  const state = defaultState();
  state.entries.push(
    {
      id: 'e1',
      createdAt: 1000,
      updatedAt: 2000,
      dateKey: '2026-07-10',
      feeling: 'sad',
      intensity: 8,
      note: 'rough day',
      tagIds: [state.tags[0].id],
    },
    {
      id: 'e2',
      createdAt: 3000,
      updatedAt: 3000,
      dateKey: '2026-07-11',
      feeling: 'happy',
      intensity: 6,
      note: '',
      tagIds: [],
    }
  );
  return state;
}

describe('export → import roundtrip', () => {
  it('is identity for a valid state', () => {
    const state = sampleState();
    const result = parseBackup(serializeBackup(state, new Date('2026-07-11T10:00:00Z')));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state).toEqual(state);
  });

  it('writes the feelnote app discriminator', () => {
    const backup = JSON.parse(serializeBackup(sampleState()));
    expect(backup.app).toBe('feelnote');
    expect(backup.schemaVersion).toBe(2);
  });
});

describe('parseBackup validation', () => {
  it('rejects non-JSON', () => {
    expect(parseBackup('hello').ok).toBe(false);
  });

  it('rejects files from other apps', () => {
    const result = parseBackup(JSON.stringify({ app: 'forge', entries: [], tags: [] }));
    expect(result.ok).toBe(false);
  });

  it('rejects old Trace backups (incompatible mood model)', () => {
    const result = parseBackup(
      JSON.stringify({ app: 'trace', schemaVersion: 1, entries: [], tags: [] })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/Not a FeelNote backup/);
  });

  it('rejects newer schema versions', () => {
    const result = parseBackup(
      JSON.stringify({ app: 'feelnote', schemaVersion: 999, entries: [], tags: [] })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/newer version/);
  });

  it('drops entries with unknown feelings and malformed rows', () => {
    const backup = JSON.parse(serializeBackup(sampleState()));
    backup.entries[0].feeling = 'angry';
    backup.entries.push({ id: 'bad' }); // missing everything
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.entries.map((e) => e.id)).toEqual(['e2']);
    }
  });

  it('drops entries with out-of-range or fractional intensities', () => {
    for (const intensity of [0, 11, 5.5, '5', null]) {
      const backup = JSON.parse(serializeBackup(sampleState()));
      backup.entries[0].intensity = intensity;
      const result = parseBackup(JSON.stringify(backup));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.state.entries.map((e) => e.id)).toEqual(['e2']);
    }
  });

  it('drops unknown tagIds from entries', () => {
    const backup = JSON.parse(serializeBackup(sampleState()));
    backup.entries[0].tagIds = ['nonexistent-tag'];
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.entries[0].tagIds).toEqual([]);
  });

  it('rejects malformed dateKeys', () => {
    const backup = JSON.parse(serializeBackup(sampleState()));
    backup.entries[0].dateKey = '11/07/2026';
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.entries.map((e) => e.id)).toEqual(['e2']);
  });

  it('defaults updatedAt to createdAt when missing', () => {
    const backup = JSON.parse(serializeBackup(sampleState()));
    delete backup.entries[0].updatedAt;
    const result = parseBackup(JSON.stringify(backup));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.state.entries[0].updatedAt).toBe(1000);
  });
});
