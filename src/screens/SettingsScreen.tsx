import { useRef, useState } from 'react';
import { useApp } from '../state/AppContext';
import { ConfirmModal } from '../components/ConfirmModal';
import { parseBackup, serializeBackup } from '../storage/backup';
import { defaultState } from '../storage/storage';
import { todayKey } from '../lib/dates';
import type { PersistedState } from '../types';

export function SettingsScreen() {
  const { state, dispatch } = useApp();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<PersistedState | null>(null);
  const [confirmWipe, setConfirmWipe] = useState<0 | 1 | 2>(0);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');

  const exportBackup = () => {
    const json = serializeBackup({
      schemaVersion: 1,
      entries: state.entries,
      tags: state.tags,
      settings: state.settings,
    });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-backup-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    dispatch({ type: 'SET_SETTINGS', settings: { lastBackupAt: Date.now() } });
  };

  const onImportFile = async (file: File) => {
    setError(null);
    const result = parseBackup(await file.text());
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setPendingImport(result.state);
  };

  const commitRename = (id: string) => {
    const name = renameDraft.trim().toLowerCase();
    setRenamingId(null);
    if (!name) return;
    if (state.tags.some((t) => t.id !== id && t.name.toLowerCase() === name)) return;
    dispatch({ type: 'RENAME_TAG', id, name });
  };

  const daysSinceBackup =
    state.settings.lastBackupAt == null
      ? null
      : Math.floor((Date.now() - state.settings.lastBackupAt) / 86400000);

  return (
    <div>
      <div className="screen-title">Settings</div>
      <div className="screen-sub">Backup, tags and preferences</div>

      {error && <div className="banner-error">{error}</div>}

      <div className="settings-section">Backup</div>
      <div className="card">
        {(daysSinceBackup === null || daysSinceBackup > 7) && state.entries.length > 0 && (
          <div className="screen-sub" style={{ marginBottom: 10 }}>
            {daysSinceBackup === null
              ? 'Your journal only lives on this device — export a backup now and then.'
              : `Last backup was ${daysSinceBackup} days ago.`}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={exportBackup}>
            Export JSON
          </button>
          <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
            Import JSON
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) void onImportFile(f);
          }}
        />
      </div>

      <div className="settings-section">Tags</div>
      <div className="card">
        {state.tags.map((tag) => (
          <div key={tag.id} className="tag-row">
            {renamingId === tag.id ? (
              <input
                autoFocus
                value={renameDraft}
                onChange={(e) => setRenameDraft(e.target.value)}
                onBlur={() => commitRename(tag.id)}
                onKeyDown={(e) => e.key === 'Enter' && commitRename(tag.id)}
              />
            ) : (
              <>
                <span className="tag-name">{tag.name}</span>
                <button
                  className="btn-small"
                  onClick={() => {
                    setRenamingId(tag.id);
                    setRenameDraft(tag.name);
                  }}
                >
                  Rename
                </button>
                <button
                  className="btn-small"
                  onClick={() => dispatch({ type: 'DELETE_TAG', id: tag.id })}
                >
                  Delete
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="settings-section">Preferences</div>
      <div className="card">
        <div className="settings-row">
          <span>Week starts on</span>
          <div className="segmented" style={{ margin: 0, width: 150 }}>
            <button
              className={state.settings.weekStartsOn === 1 ? 'active' : ''}
              onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { weekStartsOn: 1 } })}
            >
              Mon
            </button>
            <button
              className={state.settings.weekStartsOn === 0 ? 'active' : ''}
              onClick={() => dispatch({ type: 'SET_SETTINGS', settings: { weekStartsOn: 0 } })}
            >
              Sun
            </button>
          </div>
        </div>
      </div>

      <div className="settings-section">Danger zone</div>
      <div className="card">
        <button className="btn btn-danger" onClick={() => setConfirmWipe(1)}>
          Delete all data
        </button>
      </div>

      <div className="screen-sub" style={{ textAlign: 'center', marginTop: 20 }}>
        Trace v0.1.0 · your data never leaves this device
      </div>

      {pendingImport && (
        <ConfirmModal
          title="Import backup?"
          message={`Replace ${state.entries.length} current entries with ${pendingImport.entries.length} from the backup? This cannot be undone.`}
          confirmLabel="Import"
          onConfirm={() => {
            dispatch({ type: 'IMPORT_STATE', state: pendingImport });
            setPendingImport(null);
          }}
          onCancel={() => setPendingImport(null)}
        />
      )}

      {confirmWipe === 1 && (
        <ConfirmModal
          title="Delete all data?"
          message={`This removes all ${state.entries.length} entries and custom tags from this device.`}
          confirmLabel="Continue"
          danger
          onConfirm={() => setConfirmWipe(2)}
          onCancel={() => setConfirmWipe(0)}
        />
      )}
      {confirmWipe === 2 && (
        <ConfirmModal
          title="Are you absolutely sure?"
          message="There is no undo. Consider exporting a backup first."
          confirmLabel="Delete everything"
          danger
          onConfirm={() => {
            dispatch({ type: 'CLEAR_ALL', state: defaultState() });
            setConfirmWipe(0);
          }}
          onCancel={() => setConfirmWipe(0)}
        />
      )}
    </div>
  );
}
