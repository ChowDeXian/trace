export type MoodValue = 1 | 2 | 3 | 4 | 5;

export interface Entry {
  id: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
  dateKey: string; // 'YYYY-MM-DD' in local time, frozen at save time
  mood: MoodValue;
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
  schemaVersion: 1;
  entries: Entry[];
  tags: Tag[];
  settings: Settings;
}

export interface BackupFile extends PersistedState {
  app: 'trace';
  exportedAt: string; // ISO
}

export type Tab = 'today' | 'history' | 'insights' | 'settings';
