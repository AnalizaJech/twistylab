import { useI18n } from '../../i18n';
import { useConfirm } from '../../components/Confirmation';
import { useState } from 'react';
import { Copy, Download, Trash2, Play } from 'lucide-react';
import type { Solve, Penalty } from '../../types';
import { effectiveTime, formatTime } from '../../core/statistics';
import { getPuzzle } from '../../core/puzzles/registry';
import { useSessionStore, useSettingsStore } from '../../stores';
import { useSolves } from '../../hooks/useSolves';
import { Modal, EmptyState } from '../../components/Primitives';
import { SessionSelector } from '../../components/SessionSelector';
import { PuzzleViewer3D } from '../../components/PuzzleViewer3D';
import { exportCSV } from '../../core/storage/backup';
export function SolveHistory({
  solves,
  compact = false,
  total = solves.length,
}: {
  solves: Solve[];
  compact?: boolean;
  total?: number;
}) {
  const { t, dateLocale } = useI18n();
  const [selected, setSelected] = useState<Solve | null>(null);
  const all = useSessionStore((s) => s.solves);
  const { precision } = useSettingsStore((s) => s.settings);
  return (
    <>
      {!solves.length ? (
        <EmptyState>
          <span className="empty-symbol">{t('◷')}</span>
          <p>{t('Your first solve awaits.')}</p>
          <small>{t('Start the timer to build your session.')}</small>
        </EmptyState>
      ) : (
        <div className={`solve-history ${compact ? 'compact' : ''}`}>
          {solves.map((s, i) => (
            <button className="solve-row" key={s.id} onClick={() => setSelected(s)}>
              <span className="solve-number">{compact ? total - i : i + 1}</span>
              <strong>
                {formatTime(effectiveTime(s), precision)}
                {s.penalty === '+2' && <small>{t('+2')}</small>}
              </strong>
              <span className="muted">
                {compact
                  ? new Date(s.createdAt).toLocaleTimeString(dateLocale, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : new Date(s.createdAt).toLocaleString(dateLocale)}
              </span>
              {!compact && <span className="solve-scramble">{s.scramble}</span>}
            </button>
          ))}
        </div>
      )}
      {selected && (
        <SolveDetails
          solve={all.find((s) => s.id === selected.id) ?? selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}
export function SolveDetails({ solve, onClose }: { solve: Solve; onClose: () => void }) {
  const { t } = useI18n();
  const confirm = useConfirm();
  const { updateSolve, removeSolve } = useSessionStore();
  const [replay, setReplay] = useState(false);
  const [notes, setNotes] = useState(solve.notes ?? '');
  return (
    <Modal title={t('Solve details')} onClose={onClose}>
      <div className="detail-time">{formatTime(effectiveTime(solve), 3)}</div>
      <p className="muted">
        {getPuzzle(solve.puzzleId).name} · {solve.eventId} ·{' '}
        {new Date(solve.createdAt).toLocaleString()}
      </p>
      <div className="segmented">
        {(['none', '+2', 'DNF'] as Penalty[]).map((p) => (
          <button
            key={p}
            className={solve.penalty === p ? 'active' : ''}
            onClick={() => void updateSolve(solve.id, { penalty: p })}
          >
            {p === 'none' ? t('No penalty') : p}
          </button>
        ))}
      </div>
      <p className="scramble detail-scramble">{solve.scramble}</p>
      <div className="button-row">
        <button onClick={() => void navigator.clipboard.writeText(solve.scramble)}>
          <Copy size={15} />
          {t('Copy scramble')}
        </button>
        <button onClick={() => setReplay(!replay)}>
          <Play size={15} />
          {t('Replay')}
        </button>
      </div>
      {replay && <PuzzleViewer3D puzzleId={solve.puzzleId} algorithm={solve.scramble} animation />}
      <label>
        {t('Notes')}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => void updateSolve(solve.id, { notes })}
          placeholder={t('How did this solve feel?')}
        />
      </label>
      <button
        className="danger"
        onClick={async () => {
          if (await confirm('Delete this solve?')) {
            await removeSolve(solve.id);
            onClose();
          }
        }}
      >
        <Trash2 size={15} />
        {t('Delete solve')}
      </button>
    </Modal>
  );
}
export default function HistoryPage() {
  const { t } = useI18n();
  const solves = useSolves();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('EVERY SOLVE, SAVED')}</span>
          <h1>
            {t('Solve history')}
            <span>.</span>
          </h1>
        </div>
        <SessionSelector />
      </div>
      <div className="section-heading">
        <span>
          {solves.length} {t('solves in this event and session')}
        </span>
        <button disabled={!solves.length} onClick={() => exportCSV(solves)}>
          <Download size={15} />
          {t('Export CSV')}
        </button>
      </div>
      <SolveHistory solves={solves} />
    </>
  );
}
