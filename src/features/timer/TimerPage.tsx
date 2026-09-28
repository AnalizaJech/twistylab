import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Copy, ChevronRight, Timer, Check } from 'lucide-react';
import { usePuzzleStore, useSessionStore, useSettingsStore } from '../../stores';
import { generateScramble } from '../../core/scramble';
import { formatTime } from '../../core/statistics';
import type { TimerState } from '../../core/timer/machine';
import { PuzzleViewer3D } from '../../components/PuzzleViewer3D';
import { SessionSelector } from '../../components/SessionSelector';
import { StatsSummary } from '../stats/StatsPage';
import { SolveHistory } from '../history/HistoryPage';
import { useSolves } from '../../hooks/useSolves';
import { useTimer } from './useTimer';
export function ScrambleDisplay({
  scramble,
  busy,
  error,
  onGenerate,
  animate,
  setAnimate,
}: {
  scramble: string;
  busy: boolean;
  error: string;
  onGenerate: () => void;
  animate: boolean;
  setAnimate: (v: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <section className="scramble-section">
      <div className="section-heading">
        <span>SCRAMBLE</span>
        <div>
          <button
            className={animate ? 'text-button active' : 'text-button'}
            onClick={() => setAnimate(!animate)}
            disabled={!scramble}
          >
            Animate scramble
          </button>
          <button
            className="icon-button"
            aria-label="Copy scramble"
            disabled={!scramble}
            onClick={async () => {
              await navigator.clipboard.writeText(scramble);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <button
            className="icon-button"
            aria-label="New scramble"
            disabled={busy}
            onClick={onGenerate}
          >
            <RefreshCw size={16} className={busy ? 'spin' : ''} />
          </button>
        </div>
      </div>
      <p className="scramble" aria-live="polite">
        {error ||
          scramble ||
          (busy ? 'Generating your scramble…' : 'Generate a scramble to begin.')}
      </p>
    </section>
  );
}
export default function TimerPage() {
  const { puzzleId, eventId } = usePuzzleStore();
  const { sessionId, save, loaded } = useSessionStore();
  const { settings } = useSettingsStore();
  const solves = useSolves();
  const [scramble, setScramble] = useState('');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [animate, setAnimate] = useState(false);
  const [saveError, setSaveError] = useState('');
  const next = useCallback(async () => {
    setBusy(true);
    setError('');
    setAnimate(false);
    try {
      setScramble(await generateScramble(eventId));
    } catch (e) {
      setScramble('');
      setError(e instanceof Error ? e.message : 'Scramble unavailable.');
    } finally {
      setBusy(false);
    }
  }, [eventId]);
  useEffect(() => {
    let alive = true;
    setBusy(true);
    setScramble('');
    setError('');
    setAnimate(false);
    generateScramble(eventId)
      .then((s) => {
        if (alive) setScramble(s);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      })
      .finally(() => {
        if (alive) setBusy(false);
      });
    return () => {
      alive = false;
    };
  }, [eventId]);
  const onStop = useCallback(
    (t: TimerState) => {
      setSaveError('');
      void save({
        id: crypto.randomUUID(),
        sessionId,
        puzzleId,
        eventId,
        timeMs: t.elapsedMs,
        penalty: t.penalty,
        scramble,
        createdAt: Date.now(),
        source: 'timer',
      })
        .then(next)
        .catch(() => setSaveError('Could not save solve. Check browser storage.'));
    },
    [save, sessionId, puzzleId, eventId, scramble, next],
  );
  const clock = useTimer(onStop, busy || !scramble || !loaded);
  const active = ['RUNNING', 'HOLDING', 'READY', 'INSPECTION'].includes(clock.timer.phase);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR DAILY PRACTICE</span>
          <h1>
            Make every solve count<span>.</span>
          </h1>
        </div>
        <SessionSelector />
      </div>
      <div className="timer-layout">
        <main className="timer-workspace">
          <fieldset disabled={active} className="scramble-fieldset">
            <ScrambleDisplay
              scramble={scramble}
              busy={busy}
              error={error}
              onGenerate={() => void next()}
              animate={animate}
              setAnimate={setAnimate}
            />
          </fieldset>
          <div className="timer-center">
            <PuzzleViewer3D
              puzzleId={puzzleId}
              setup={animate ? '' : scramble}
              algorithm={animate ? scramble : ''}
              animation={animate}
            />
            <TimerSurface clock={clock} precision={settings.precision} busy={busy || !scramble} />
          </div>
          {saveError && <p role="alert">{saveError}</p>}
          <StatsSummary solves={solves} compact />
        </main>
        <aside className="session-panel">
          <div className="section-heading">
            <h2>Session</h2>
            <span>{solves.length} solves</span>
          </div>
          <SolveHistory solves={solves.slice(-8).reverse()} compact total={solves.length} />
          <a className="history-link" href="#/history">
            All solves <ChevronRight size={15} />
          </a>
          <div className="practice-note">
            <Timer size={18} />
            <p>
              Consistency over speed.
              <br />
              <span>Your next personal best starts here.</span>
            </p>
          </div>
        </aside>
      </div>
      <footer className="workspace-footer">
        <span>
          <span className="status-dot" /> Local storage · No account needed
        </span>
        <span>
          SPACE <span className="muted">hold → release → solve</span>
        </span>
      </footer>
    </>
  );
}
export function TimerDisplay({ time, precision }: { time: number; precision: number }) {
  return <span className="timer-digits">{formatTime(time, precision)}</span>;
}
export function InspectionDisplay({ seconds }: { seconds: number }) {
  return (
    <>
      <span className="eyebrow">INSPECTION</span>
      <span className="timer-digits">{seconds > 0 ? seconds : seconds >= -2 ? '+2' : 'DNF'}</span>
    </>
  );
}
export function TimerSurface({
  clock,
  precision,
  busy,
}: {
  clock: ReturnType<typeof useTimer>;
  precision: number;
  busy: boolean;
}) {
  const phase = clock.timer.phase;
  return (
    <div
      className={`timer-surface ${phase.toLowerCase()}`}
      tabIndex={0}
      role="button"
      aria-label="Timer surface. Hold Space or touch to start; press to stop."
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        clock.down();
      }}
      onPointerUp={clock.up}
      onPointerCancel={clock.cancel}
    >
      <span className="timer-state">
        {phase === 'READY'
          ? 'READY'
          : phase === 'HOLDING'
            ? 'HOLD'
            : phase === 'RUNNING'
              ? 'SOLVING'
              : phase === 'STOPPED'
                ? 'SOLVE SAVED'
                : 'READY WHEN YOU ARE'}
      </span>
      {phase === 'INSPECTION' ||
      (['READY', 'HOLDING'].includes(phase) && clock.timer.inspectionAt !== null) ? (
        <InspectionDisplay seconds={clock.inspection} />
      ) : (
        <TimerDisplay time={clock.elapsed} precision={precision} />
      )}
      <p>
        {busy
          ? 'Preparing scramble…'
          : phase === 'READY'
            ? 'Release to start'
            : phase === 'HOLDING'
              ? 'Keep holding…'
              : phase === 'RUNNING'
                ? 'Press anywhere to stop'
                : phase === 'INSPECTION'
                  ? 'Hold, then release to start'
                  : 'Hold SPACE or touch to start'}
      </p>
      <div className="timer-shortcuts">
        <kbd>space</kbd>
        <span>or</span>
        <span>touch & hold</span>
      </div>
    </div>
  );
}
