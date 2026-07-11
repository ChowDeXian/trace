import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from 'react';
import { LEGACY_STORAGE_KEY, SCHEMA_VERSION, loadState, saveState } from '../storage/storage';
import { initialAppState, reducer, type Action, type AppState } from './reducer';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => initialAppState(loadState()));
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // best-effort durable storage on iOS home-screen installs
    navigator.storage?.persist?.().catch(() => {});
    // fresh start: drop pre-rename Trace data (incompatible 1-5 mood model)
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const { entries, tags, settings } = state;
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      saveState({ schemaVersion: SCHEMA_VERSION, entries, tags, settings });
    }, 300);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [entries, tags, settings]);

  // iOS may kill a backgrounded PWA before the debounce fires — flush immediately
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') {
        saveState({ schemaVersion: SCHEMA_VERSION, entries, tags, settings });
      }
    };
    document.addEventListener('visibilitychange', flush);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', flush);
      window.removeEventListener('pagehide', flush);
    };
  }, [entries, tags, settings]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
