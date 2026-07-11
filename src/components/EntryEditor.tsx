import { useRef, useState } from 'react';
import type { Entry, Feeling, Intensity } from '../types';
import { FeelingPicker } from './FeelingPicker';
import { TagPicker } from './TagPicker';
import { newId } from '../lib/id';
import { todayKey } from '../lib/dates';
import { useApp } from '../state/AppContext';

interface Props {
  /** When set, edits the existing entry instead of creating a new one. */
  entry?: Entry;
  onDone?: () => void;
}

export function EntryEditor({ entry, onDone }: Props) {
  const { dispatch } = useApp();
  const [feeling, setFeeling] = useState<Feeling | null>(entry?.feeling ?? null);
  const [intensity, setIntensity] = useState<Intensity>(entry?.intensity ?? 5);
  const [note, setNote] = useState(entry?.note ?? '');
  const [tagIds, setTagIds] = useState<string[]>(entry?.tagIds ?? []);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  const autoGrow = () => {
    const el = noteRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  };

  const save = () => {
    if (feeling === null) return;
    const now = Date.now();
    if (entry) {
      dispatch({
        type: 'UPDATE_ENTRY',
        entry: { ...entry, feeling, intensity, note: note.trim(), tagIds, updatedAt: now },
      });
    } else {
      dispatch({
        type: 'ADD_ENTRY',
        entry: {
          id: newId(),
          createdAt: now,
          updatedAt: now,
          dateKey: todayKey(),
          feeling,
          intensity,
          note: note.trim(),
          tagIds,
        },
      });
      setFeeling(null);
      setIntensity(5);
      setNote('');
      setTagIds([]);
      if (noteRef.current) noteRef.current.style.height = 'auto';
    }
    onDone?.();
  };

  return (
    <div className="card">
      <div className="chart-title">{entry ? 'Edit entry' : 'How are you feeling?'}</div>
      <FeelingPicker
        feeling={feeling}
        intensity={intensity}
        onFeelingChange={setFeeling}
        onIntensityChange={setIntensity}
      />
      <textarea
        ref={noteRef}
        value={note}
        onChange={(e) => {
          setNote(e.target.value);
          autoGrow();
        }}
        placeholder="What happened? Why do you feel this way?"
        rows={3}
        style={{ margin: '10px 0', resize: 'none' }}
      />
      <div style={{ marginBottom: 12 }}>
        <TagPicker selected={tagIds} onChange={setTagIds} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {entry && (
          <button className="btn btn-secondary" onClick={onDone}>
            Cancel
          </button>
        )}
        <button className="btn btn-primary" disabled={feeling === null} onClick={save}>
          {entry ? 'Save changes' : 'Save entry'}
        </button>
      </div>
    </div>
  );
}
