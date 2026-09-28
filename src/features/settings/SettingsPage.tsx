import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Alg } from 'cubing/alg';
import { useSettingsStore, useSessionStore, usePuzzleStore } from '../../stores';
import { defaultBindings } from '../../core/controls/keyboard';
import {
  download,
  exportBackup,
  exportCSV,
  importBackup,
  validateBackup,
} from '../../core/storage/backup';
import { deleteData } from '../../core/storage/repositories';
export default function SettingsPage() {
  const { settings, update, hydrate } = useSettingsStore();
  const { sessionId, solves } = useSessionStore();
  const { puzzleId } = usePuzzleStore();
  const file = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  async function remove(scope: 'session' | 'puzzle' | 'all') {
    if (
      !confirm(
        `Permanently delete ${scope === 'all' ? 'all TwistyLab data' : scope === 'session' ? 'the current session and its solves' : 'all solves for this puzzle'}? Export a backup first.`,
      )
    )
      return;
    setWorking(true);
    try {
      await deleteData(scope, scope === 'session' ? sessionId : puzzleId);
      await useSessionStore.getState().hydrate();
      await hydrate();
      setMessage('Data deleted.');
    } catch (e) {
      setMessage(String(e));
    } finally {
      setWorking(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">MAKE IT YOURS</span>
          <h1>
            Settings<span>.</span>
          </h1>
        </div>
      </div>
      <div className="settings-layout">
        <section>
          <h2>Workspace</h2>
          <label className="setting-row">
            <span>
              Appearance<small>Choose the look of your workspace.</small>
            </span>
            <select
              value={settings.theme}
              onChange={(e) => void update({ theme: e.target.value as typeof settings.theme })}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="system">System</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              Inspection<small>15 seconds · +2 after 15s · DNF after 17s</small>
            </span>
            <input
              type="checkbox"
              checked={settings.inspection}
              onChange={(e) => void update({ inspection: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>Timer precision</span>
            <select
              value={settings.precision}
              onChange={(e) => void update({ precision: Number(e.target.value) as 2 | 3 })}
            >
              <option value="2">0.00</option>
              <option value="3">0.000</option>
            </select>
          </label>
          <label className="setting-row">
            <span>
              Hold to ready<small>Hold duration in milliseconds</small>
            </span>
            <input
              type="number"
              min="100"
              max="3000"
              step="50"
              value={settings.holdMs}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v >= 100 && v <= 3000) void update({ holdMs: v });
              }}
            />
          </label>
          <label className="setting-row">
            <span>Move animation</span>
            <select
              value={settings.speed}
              onChange={(e) => void update({ speed: e.target.value as typeof settings.speed })}
            >
              {['slow', 'normal', 'fast', 'instant'].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <KeyboardMapper />
        </section>
        <section className="data-settings">
          <h2>Your data</h2>
          <p>
            Everything stays in this browser. Save a backup to carry your sessions to another
            device.
          </p>
          <div className="button-stack">
            <button
              onClick={async () =>
                download('twistylab-backup.json', JSON.stringify(await exportBackup(), null, 2))
              }
            >
              <Download size={16} />
              Export JSON backup
            </button>
            <button onClick={() => exportCSV(solves)}>
              <Download size={16} />
              Export all solves as CSV
            </button>
            <button disabled={working} onClick={() => file.current?.click()}>
              <Upload size={16} />
              Import JSON backup
            </button>
            <input
              type="file"
              hidden
              ref={file}
              accept=".json,application/json"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setWorking(true);
                try {
                  if (f.size > 25_000_000) throw Error('Backup is too large (25 MB limit).');
                  const data: unknown = JSON.parse(await f.text());
                  const b = validateBackup(data);
                  if (
                    confirm(
                      `Import ${b.solves.length} solves and ${b.sessions.length} sessions? Records with matching IDs and saved settings will be replaced; other records will be kept.`,
                    )
                  ) {
                    await importBackup(b);
                    await useSessionStore.getState().hydrate();
                    await hydrate();
                    setMessage('Backup imported successfully.');
                  }
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : 'Import failed.');
                } finally {
                  setWorking(false);
                  e.target.value = '';
                }
              }}
            />
          </div>
          <div className="danger-zone">
            <h3>Delete data</h3>
            <button disabled={working} onClick={() => void remove('session')}>
              <Trash2 size={15} />
              Delete current session
            </button>
            <button disabled={working} onClick={() => void remove('puzzle')}>
              <Trash2 size={15} />
              Delete puzzle history
            </button>
            <button disabled={working} className="danger" onClick={() => void remove('all')}>
              <Trash2 size={15} />
              Delete all data
            </button>
          </div>
          <p role="status">{message}</p>
          <p className="muted">
            Offline ready after the first production load. Scrambler and puzzle modules are included
            in the local cache.
          </p>
        </section>
      </div>
    </>
  );
}
export function KeyboardMapper() {
  const { bindings, setBindings } = useSettingsStore();
  const [key, setKey] = useState('');
  const [move, setMove] = useState('');
  const [error, setError] = useState('');
  return (
    <section className="keyboard-mapper">
      <h2>Controls</h2>
      <p className="muted">Customize Playground keys. Use chords such as r, Shift+r or Alt+r.</p>
      <form
        className="mapping-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const parsed = new Alg(move);
            if (!parsed.toString().trim()) throw Error('Enter a move.');
            const parts = key.trim().split('+');
            const normalized = [
              ...parts
                .slice(0, -1)
                .map(
                  (p) =>
                    ({ shift: 'Shift', alt: 'Alt', ctrl: 'Ctrl', meta: 'Meta' })[p.toLowerCase()] ??
                    p,
                ),
              parts.at(-1)?.toLowerCase(),
            ].join('+');
            if (!normalized || normalized === ' ') throw Error('Enter a key.');
            await setBindings({ ...bindings, [normalized]: parsed.toString() });
            setKey('');
            setMove('');
            setError('');
          } catch (e) {
            setError(String(e));
          }
        }}
      >
        <label>
          Key
          <input
            placeholder="Shift+r"
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <label>
          Move
          <input placeholder="R'" required value={move} onChange={(e) => setMove(e.target.value)} />
        </label>
        <button type="submit">Assign</button>
      </form>
      <p className="error" role="alert">
        {error}
      </p>
      <div className="keybinding-list">
        {Object.entries(bindings).map(([k, m]) => (
          <div key={k}>
            <kbd>{k}</kbd>
            <span>{m}</span>
            <button
              className="text-button"
              aria-label={`Remove binding ${k}`}
              onClick={() => {
                const next = { ...bindings };
                delete next[k];
                void setBindings(next);
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button onClick={() => void setBindings(defaultBindings)}>Restore default controls</button>
    </section>
  );
}
export const SettingsDrawer = SettingsPage;
