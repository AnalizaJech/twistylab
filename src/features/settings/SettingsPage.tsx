import { NumberStepper } from '../../components/NumberStepper';
import { useI18n } from '../../i18n';
import { Select } from '../../components/Select';
import { useConfirm } from '../../components/Confirmation';
import { useRef, useState } from 'react';
import { Download, Upload, Trash2 } from 'lucide-react';
import { Alg } from 'cubing/alg';
import { useSettingsStore, useSessionStore, usePuzzleStore } from '../../stores';
import { defaultBindings, normalizeChord } from '../../core/controls/keyboard';
import {
  download,
  exportBackup,
  exportCSV,
  importBackup,
  validateBackup,
} from '../../core/storage/backup';
import { deleteData } from '../../core/storage/repositories';
export default function SettingsPage() {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { settings, update, hydrate } = useSettingsStore();
  const { sessionId, solves } = useSessionStore();
  const { puzzleId } = usePuzzleStore();
  const file = useRef<HTMLInputElement>(null);
  const [section, setSection] = useState('General');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);
  async function remove(scope: 'session' | 'puzzle' | 'all') {
    if (
      !(await confirm(
        `Permanently delete ${scope === 'all' ? 'all TwistyLab data' : scope === 'session' ? 'the current session and its solves' : 'all solves for this puzzle'}? Export a backup first.`,
      ))
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
          <span className="eyebrow">{t('MAKE IT YOURS')}</span>
          <h1>
            {t('Settings')}
            <span>.</span>
          </h1>
        </div>
      </div>
      <div className="segmented settings-tabs">
        {['General', 'Controls', 'Data'].map((tab) => (
          <button
            key={tab}
            className={section === tab ? 'active' : ''}
            aria-pressed={section === tab}
            onClick={() => setSection(tab)}
          >
            {t(tab)}
          </button>
        ))}
      </div>
      <div className="settings-layout" data-section={section}>
        <section hidden={section !== 'General'}>
          <h2>{t('Workspace')}</h2>
          <label className="setting-row">
            <span>
              {t('Language')}
              <small>{t('Choose your interface language.')}</small>
            </span>
            <Select
              label={t('Language')}
              value={settings.locale}
              onValueChange={(v) => void update({ locale: v as 'es' | 'en' })}
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'English' },
              ]}
            />
          </label>
          <label className="setting-row">
            <span>
              {t('Appearance')}
              <small>{t('Choose the look of your workspace.')}</small>
            </span>
            <Select
              label={t('Appearance')}
              value={settings.theme}
              onValueChange={(v) => void update({ theme: v as typeof settings.theme })}
              options={['dark', 'light', 'system'].map((v) => ({
                value: v,
                label: v[0].toUpperCase() + v.slice(1),
              }))}
            />
          </label>
          <label className="setting-row">
            <span>
              {t('Inspection')}
              <small>{t('15 seconds · +2 after 15s · DNF after 17s')}</small>
            </span>
            <button
              type="button"
              className="switch"
              role="switch"
              aria-label={t('Inspection')}
              aria-checked={settings.inspection}
              onClick={() => void update({ inspection: !settings.inspection })}
            >
              <span />
            </button>
          </label>
          <label className="setting-row">
            <span>{t('Timer precision')}</span>
            <Select
              label={t('Timer precision')}
              value={String(settings.precision)}
              onValueChange={(v) => void update({ precision: Number(v) as 2 | 3 })}
              options={[
                { value: '2', label: '0.00' },
                { value: '3', label: '0.000' },
              ]}
            />
          </label>
          <label className="setting-row">
            <span>
              {t('Hold to ready')}
              <small>{t('Hold duration in milliseconds')}</small>
            </span>
            <NumberStepper
              label="Hold duration"
              value={settings.holdMs}
              min={100}
              max={3000}
              step={50}
              onChange={(v) => void update({ holdMs: v })}
            />
          </label>
          <label className="setting-row">
            <span>{t('Move animation')}</span>
            <Select
              label={t('Move animation')}
              value={settings.speed}
              onValueChange={(v) => void update({ speed: v as typeof settings.speed })}
              options={['slow', 'normal', 'fast', 'instant'].map((v) => ({
                value: v,
                label: v[0].toUpperCase() + v.slice(1),
              }))}
            />
          </label>
        </section>
        {section === 'Controls' && <KeyboardMapper />}
        <section hidden={section !== 'Data'} className="data-settings">
          <h2>{t('Your data')}</h2>
          <p>
            {t(
              'Everything stays in this browser. Save a backup to carry your sessions to another device.',
            )}
          </p>
          <div className="button-stack">
            <button
              onClick={async () =>
                download('twistylab-backup.json', JSON.stringify(await exportBackup(), null, 2))
              }
            >
              <Download size={16} />
              {t('Export JSON backup')}
            </button>
            <button onClick={() => exportCSV(solves)}>
              <Download size={16} />
              {t('Export all solves as CSV')}
            </button>
            <button disabled={working} onClick={() => file.current?.click()}>
              <Upload size={16} />
              {t('Import JSON backup')}
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
                    await confirm(
                      t(
                        'Import {solves} solves and {sessions} sessions? Records with matching IDs and saved settings will be replaced; other records will be kept.',
                        { solves: b.solves.length, sessions: b.sessions.length },
                      ),
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
            <h3>{t('Delete data')}</h3>
            <button disabled={working} onClick={() => void remove('session')}>
              <Trash2 size={15} />
              {t('Delete current session')}
            </button>
            <button disabled={working} onClick={() => void remove('puzzle')}>
              <Trash2 size={15} />
              {t('Delete puzzle history')}
            </button>
            <button disabled={working} className="danger" onClick={() => void remove('all')}>
              <Trash2 size={15} />
              {t('Delete all data')}
            </button>
          </div>
          <p role="status">{t(message)}</p>
          <p className="muted">
            {t(
              'Offline ready after the first production load. Scrambler and puzzle modules are included in the local cache.',
            )}
          </p>
        </section>
      </div>
    </>
  );
}
export function KeyboardMapper() {
  const { t } = useI18n();
  const { bindings, setBindings } = useSettingsStore();
  const [key, setKey] = useState('');
  const [move, setMove] = useState('');
  const [error, setError] = useState('');
  return (
    <section className="keyboard-mapper">
      <h2>{t('Controls')}</h2>
      <p className="muted">
        {t(
          'Customize Playground keys. Use r, Shift+r or Alt+r. Hold W with a face key for wide moves. Assign w+r, w+Shift+r or w+Alt+r.',
        )}
      </p>
      <form
        className="mapping-form"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const parsed = new Alg(move);
            if (!parsed.toString().trim()) throw Error('Enter a move.');
            const normalized = normalizeChord(key);
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
          {t('Key')}
          <input
            placeholder={t('Shift+r')}
            required
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </label>
        <label>
          {t('Move')}
          <input
            placeholder={t("R'")}
            required
            value={move}
            onChange={(e) => setMove(e.target.value)}
          />
        </label>
        <button type="submit">{t('Assign')}</button>
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
              aria-label={`${t('Remove binding')} ${k}`}
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
      <button onClick={() => void setBindings(defaultBindings)}>
        {t('Restore default controls')}
      </button>
    </section>
  );
}
export const SettingsDrawer = SettingsPage;
