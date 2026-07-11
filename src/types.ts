export const FEELINGS = ['happy', 'calm', 'neutral', 'sad', 'anxious', 'frustrated'] as const;
export type Feeling = (typeof FEELINGS)[number];

export type Intensity = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface Entry {
  id: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  dateKey: string; // 'YYYY-MM-DD' in local time, frozen at save time
  feeling: Feeling;
  intensity: Intensity; // 1 = barely, 10 = overwhelming
  note: string;
  tagIds: string[];
}

export interface Tag {
  id: string;
  name: string; // unique, case-insensitive
  builtin: boolean;
}

export interface Settings {
  weekStartsOn: 0 | 1; // 0=Sun, 1=Mon
  lastBackupAt: number | null; // epoch ms of last export
}

export interface PersistedState {
  schemaVersion: 2;
  entries: Entry[];
  tags: Tag[];
  settings: Settings;
}

export interface BackupFile extends PersistedState {
  app: 'feelnote';
  exportedAt: string; // ISO
}

export type Tab = 'today' | 'history' | 'insights' | 'settings';
