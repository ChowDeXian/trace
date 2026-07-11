import type { Entry, PersistedState, Settings, Tab, Tag } from '../types';

export interface AppState {
  entries: Entry[]; // sorted by createdAt desc
  tags: Tag[];
  settings: Settings;
  tab: Tab;
  editingEntryId: string | null;
}

export type Action =
  | { type: 'ADD_ENTRY'; entry: Entry }
  | { type: 'UPDATE_ENTRY'; entry: Entry }
  | { type: 'DELETE_ENTRY'; id: string }
  | { type: 'ADD_TAG'; tag: Tag }
  | { type: 'RENAME_TAG'; id: string; name: string }
  | { type: 'DELETE_TAG'; id: string }
  | { type: 'SET_TAB'; tab: Tab }
  | { type: 'SET_EDITING'; id: string | null }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> }
  | { type: 'IMPORT_STATE'; state: PersistedState }
  | { type: 'CLEAR_ALL'; state: PersistedState };

const byCreatedDesc = (a: Entry, b: Entry) => b.createdAt - a.createdAt;

export function initialAppState(persisted: PersistedState): AppState {
  return {
    entries: [...persisted.entries].sort(byCreatedDesc),
    tags: persisted.tags,
    settings: persisted.settings,
    tab: 'today',
    editingEntryId: null,
  };
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_ENTRY':
      return { ...state, entries: [action.entry, ...state.entries].sort(byCreatedDesc) };
    case 'UPDATE_ENTRY':
      return {
        ...state,
        editingEntryId: null,
        entries: state.entries.map((e) => (e.id === action.entry.id ? action.entry : e)),
      };
    case 'DELETE_ENTRY':
      return {
        ...state,
        editingEntryId: state.editingEntryId === action.id ? null : state.editingEntryId,
        entries: state.entries.filter((e) => e.id !== action.id),
      };
    case 'ADD_TAG':
      return { ...state, tags: [...state.tags, action.tag] };
    case 'RENAME_TAG':
      return {
        ...state,
        tags: state.tags.map((t) => (t.id === action.id ? { ...t, name: action.name } : t)),
      };
    case 'DELETE_TAG':
      return {
        ...state,
        tags: state.tags.filter((t) => t.id !== action.id),
        entries: state.entries.map((e) =>
          e.tagIds.includes(action.id)
            ? { ...e, tagIds: e.tagIds.filter((id) => id !== action.id) }
            : e
        ),
      };
    case 'SET_TAB':
      return { ...state, tab: action.tab, editingEntryId: null };
    case 'SET_EDITING':
      return { ...state, editingEntryId: action.id };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'IMPORT_STATE':
    case 'CLEAR_ALL':
      return { ...initialAppState(action.state), tab: state.tab };
    default:
      return state;
  }
}
