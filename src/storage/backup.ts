import type { BackupFile, Entry, PersistedState, Tag } from '../types';
import { isMoodValue } from '../lib/mood';
import { SCHEMA_VERSION, defaultSettings } from './storage';

export function serializeBackup(state: PersistedState, exportedAt: Date = new Date()): string {
  const backup: BackupFile = {
    app: 'trace',
    exportedAt: exportedAt.toISOString(),
    schemaVersion: state.schemaVersion,
    entries: state.entries,
    tags: state.tags,
    settings: state.settings,
  };
  return JSON.stringify(backup, null, 2);
}

export type ParseResult = { ok: true; state: PersistedState } | { ok: false; error: string };

const DATE_KEY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Not a valid JSON file.' };
  }
  if (raw == null || typeof raw !== 'object') {
    return { ok: false, error: 'Not a Trace backup file.' };
  }
  const b = raw as Partial<BackupFile>;
  if (b.app !== 'trace') {
    return { ok: false, error: 'Not a Trace backup file.' };
  }
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > SCHEMA_VERSION) {
    return { ok: false, error: 'Backup was made by a newer version of Trace.' };
  }
  if (!Array.isArray(b.entries) || !Array.isArray(b.tags)) {
    return { ok: false, error: 'Backup file is malformed.' };
  }

  const tags: Tag[] = [];
  for (const t of b.tags as unknown[]) {
    const tag = t as Partial<Tag>;
    if (typeof tag?.id !== 'string' || typeof tag?.name !== 'string' || tag.name === '') continue;
    tags.push({ id: tag.id, name: tag.name, builtin: tag.builtin === true });
  }
  const tagIds = new Set(tags.map((t) => t.id));

  const entries: Entry[] = [];
  for (const e of b.entries as unknown[]) {
    const en = e as Partial<Entry>;
    if (typeof en?.id !== 'string') continue;
    if (typeof en.createdAt !== 'number' || typeof en.dateKey !== 'string') continue;
    if (!DATE_KEY_RE.test(en.dateKey)) continue;
    const mood = isMoodValue(en.mood) ? en.mood : null;
    if (mood === null) continue;
    entries.push({
      id: en.id,
      createdAt: en.createdAt,
      updatedAt: typeof en.updatedAt === 'number' ? en.updatedAt : en.createdAt,
      dateKey: en.dateKey,
      mood,
      note: typeof en.note === 'string' ? en.note : '',
      tagIds: Array.isArray(en.tagIds) ? en.tagIds.filter((id) => tagIds.has(id as string)) : [],
    });
  }

  return {
    ok: true,
    state: {
      schemaVersion: SCHEMA_VERSION,
      entries,
      tags,
      settings: { ...defaultSettings(), ...(typeof b.settings === 'object' ? b.settings : {}) },
    },
  };
}
