import { useState } from 'react';
import type { Entry } from '../types';
import { FEELING_META } from '../lib/feelings';
import { formatTime } from '../lib/dates';
import { useApp } from '../state/AppContext';
import { ConfirmModal } from './ConfirmModal';
import { EntryEditor } from './EntryEditor';

interface Props {
  entry: Entry;
  showActions?: boolean;
}

export function EntryCard({ entry, showActions = true }: Props) {
  const { state, dispatch } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const meta = FEELING_META[entry.feeling];
  const tagNames = entry.tagIds
    .map((id) => state.tags.find((t) => t.id === id)?.name)
    .filter((n): n is string => !!n);

  if (state.editingEntryId === entry.id) {
    return <EntryEditor entry={entry} onDone={() => dispatch({ type: 'SET_EDITING', id: null })} />;
  }

  return (
    <div className="card entry-card">
      <div className="entry-emoji" aria-hidden>
        {meta.emoji}
      </div>
      <div className="entry-body">
        <div className="entry-meta">
          <span className="entry-mood-label" style={{ color: meta.color }}>
            {meta.label} · {entry.intensity}/10
          </span>
          <span>{formatTime(entry.createdAt)}</span>
        </div>
        {entry.note && <div className="entry-note">{entry.note}</div>}
        {tagNames.length > 0 && (
          <div className="entry-tags">
            {tagNames.map((n) => (
              <span key={n} className="entry-tag">
                {n}
              </span>
            ))}
          </div>
        )}
        {showActions && (
          <div className="entry-actions" style={{ marginTop: 8 }}>
            <button
              className="btn-small"
              onClick={() => dispatch({ type: 'SET_EDITING', id: entry.id })}
            >
              Edit
            </button>
            <button className="btn-small" onClick={() => setConfirmDelete(true)}>
              Delete
            </button>
          </div>
        )}
      </div>
      {confirmDelete && (
        <ConfirmModal
          title="Delete entry?"
          message="This entry will be removed permanently."
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            setConfirmDelete(false);
            dispatch({ type: 'DELETE_ENTRY', id: entry.id });
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
