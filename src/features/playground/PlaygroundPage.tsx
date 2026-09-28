import { useI18n } from '../../i18n';
import { useEffect, useRef, useState } from 'react';
import { Alg } from 'cubing/alg';
import { Undo2, Redo2, RotateCcw, Shuffle, Check, Play, Square } from 'lucide-react';
import {
  InteractivePuzzleController,
  type PuzzleSnapshot,
} from '../../core/puzzles/InteractivePuzzleController';
import { generateScramble } from '../../core/scramble';
import { getPuzzle } from '../../core/puzzles/registry';
import { isTyping, keyChord } from '../../core/controls/keyboard';
import { PuzzleViewer3D } from '../../components/PuzzleViewer3D';
import { usePuzzleStore, useSessionStore, useSettingsStore } from '../../stores';
import { formatTime } from '../../core/statistics';
import { AlgorithmInput, MoveHistory } from './PlaygroundControls';
const initial: PuzzleSnapshot = {
  history: [],
  setup: '',
  solved: true,
  canRedo: false,
  revision: 0,
};
export default function PlaygroundPage() {
  const { t } = useI18n();
  const { puzzleId, eventId } = usePuzzleStore();
  const { bindings } = useSettingsStore();
  const { sessionId, save } = useSessionStore();
  const wideHeld = useRef(false);
  const [showAlgorithm, setShowAlgorithm] = useState(false);
  const [turn, setTurn] = useState('normal');
  const [showGuide, setShowGuide] = useState(false);
  const [moveGroup, setMoveGroup] = useState('Faces');
  const controller = useRef(new InteractivePuzzleController());
  const [state, setState] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [mode, setMode] = useState('Free play');
  const [running, setRunning] = useState(false);
  const runningRef = useRef(false);
  const startAt = useRef(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<{ time: number; moves: number } | null>(null);
  const [algorithm, setAlgorithm] = useState('');
  useEffect(() => {
    const c = new InteractivePuzzleController();
    controller.current = c;
    let alive = true;
    setBusy(true);
    setError('');
    setState(initial);
    runningRef.current = false;
    setRunning(false);
    setResult(null);
    setElapsed(0);
    c.load(puzzleId)
      .then((s) => {
        if (alive) setState(s);
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
  }, [puzzleId]);
  useEffect(() => {
    if (!running) return;
    let id = 0;
    const tick = () => {
      setElapsed(performance.now() - startAt.current);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
  function finish(snapshot: PuzzleSnapshot) {
    setState(snapshot);
    setError('');
    if (runningRef.current && snapshot.solved) {
      runningRef.current = false;
      setRunning(false);
      const time = performance.now() - startAt.current;
      setElapsed(time);
      setResult({ time, moves: snapshot.history.length });
      void save({
        id: crypto.randomUUID(),
        sessionId,
        puzzleId,
        eventId,
        timeMs: time,
        penalty: 'none',
        scramble: snapshot.setup,
        createdAt: Date.now(),
        source: 'virtual',
        moves: snapshot.history.length,
      }).catch(() => setError('Could not save virtual solve.'));
    }
  }
  function execute(alg: string) {
    if (busy) return;
    try {
      finish(controller.current.execute(alg));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid algorithm for this puzzle.');
    }
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isTyping(e.target) || busy) return;
      if (e.key.toLowerCase() === 'w' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        wideHeld.current = true;
        return;
      }
      const move = bindings[`${wideHeld.current ? 'w+' : ''}${keyChord(e)}`];
      if (move) {
        e.preventDefault();
        execute(move);
      }
    }
    const onUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'w') wideHeld.current = false;
    };
    const onBlur = () => {
      wideHeld.current = false;
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', onBlur);
    };
  }, [bindings, busy, puzzleId, sessionId, eventId]);
  async function scramble() {
    setBusy(true);
    setError('');
    setResult(null);
    setElapsed(0);
    const activeController = controller.current;
    try {
      const alg = await generateScramble(eventId);
      if (controller.current !== activeController) return;
      setState(activeController.scramble(alg));
    } catch (e) {
      if (controller.current === activeController) setError(String(e));
    } finally {
      if (controller.current === activeController) setBusy(false);
    }
  }
  function reset() {
    runningRef.current = false;
    setRunning(false);
    setElapsed(0);
    setResult(null);
    setElapsed(0);
    setState(controller.current.reset());
    setError('');
  }
  const puzzle = getPuzzle(puzzleId);
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t('EXPLORE. LEARN. REPEAT.')}</span>
          <h1>
            {t('Your puzzle playground')}
            <span>.</span>
          </h1>
        </div>
        <div className="segmented">
          {['Free play', 'Virtual solve', 'Algorithm'].map((m) => (
            <button
              key={t(m)}
              disabled={running}
              className={mode === m ? 'active' : ''}
              aria-pressed={mode === m}
              onClick={() => {
                setMode(m);
                setResult(null);
                setElapsed(0);
              }}
            >
              {t(m)}
            </button>
          ))}
        </div>
      </div>
      <div className="playground-layout">
        <section className="playground-stage">
          {state.setup && <p className="scramble playground-scramble">{state.setup}</p>}
          <PuzzleViewer3D
            puzzleId={puzzleId}
            setup={state.setup}
            algorithm={state.history.join(' ')}
            interactive={!busy}
            onNativeMoves={execute}
            large
          />
          <div className="stage-status">
            <span className={state.solved ? 'solved' : ''}>
              {state.solved ? <Check size={16} /> : <span className="status-dot" />}
              {state.solved ? t('Solved') : t('In progress')}
            </span>
            <span>
              {state.history.length} {t(state.history.length === 1 ? 'move' : 'moves')}
            </span>
            {mode === 'Virtual solve' && <strong>{formatTime(elapsed, 3)}</strong>}
          </div>
        </section>
        <aside
          className="playground-controls"
          data-editor={showAlgorithm || mode === 'Algorithm' ? 'open' : 'closed'}
        >
          <div className="section-heading">
            <h2>{t(mode)}</h2>
            <span>{puzzle.shortName}</span>
          </div>
          {mode === 'Virtual solve' && (
            <div className="virtual-controls">
              <p>
                {t(
                  'Generate a scramble, start, then solve. The clock stops when your puzzle is solved.',
                )}
              </p>
              <button
                className="primary"
                disabled={busy || running || !state.setup || state.solved}
                onClick={() => {
                  startAt.current = performance.now();
                  runningRef.current = true;
                  setRunning(true);
                  setResult(null);
                  setElapsed(0);
                }}
              >
                <Play size={16} />
                {t('Start virtual solve')}
              </button>
              {running && (
                <button
                  onClick={() => {
                    runningRef.current = false;
                    setRunning(false);
                  }}
                >
                  <Square size={15} />
                  {t('Cancel attempt')}
                </button>
              )}
              {result && (
                <div className="virtual-result">
                  <Check size={18} />
                  <strong>
                    {t('Solved in')} {formatTime(result.time, 3)}
                  </strong>
                  <span>
                    {result.moves} {t('moves ·')}
                    {(result.moves / (result.time / 1000)).toFixed(2)}
                    {t('TPS · Saved')}
                  </span>
                </div>
              )}
            </div>
          )}
          <button
            className="text-button algorithm-toggle"
            aria-expanded={showAlgorithm || mode === 'Algorithm'}
            onClick={() => setShowAlgorithm(!showAlgorithm)}
          >
            {t(showAlgorithm ? 'Hide algorithm' : 'Edit algorithm')}
          </button>
          <fieldset disabled={busy || running}>
            <AlgorithmInput
              value={algorithm}
              onChange={setAlgorithm}
              onExecute={() => {
                execute(algorithm);
                setAlgorithm('');
              }}
            />
            <div className="button-row">
              <button
                onClick={() => finish(controller.current.undo())}
                disabled={!state.history.length}
              >
                <Undo2 size={15} />
                {t('Undo')}
              </button>
              <button onClick={() => finish(controller.current.redo())} disabled={!state.canRedo}>
                <Redo2 size={15} />
                {t('Redo')}
              </button>
            </div>
          </fieldset>
          {puzzle.moves.some((m) => m.endsWith('w')) && (
            <div className="segmented move-tabs">
              {['Faces', 'Wide', 'Rotations'].map((group) => (
                <button
                  key={t(group)}
                  className={moveGroup === group ? 'active' : ''}
                  aria-pressed={moveGroup === group}
                  onClick={() => setMoveGroup(group)}
                >
                  {t(group)}
                </button>
              ))}
            </div>
          )}
          {!['clock', 'square1'].includes(puzzle.id) && (
            <div className="turn-toolbar">
              <span>{t('Turn')}</span>
              <div className="segmented turn-modifiers">
                {[
                  ['normal', '1', 'Quarter turn'],
                  ['inverse', '′', 'Inverse turn'],
                  ['double', '2', 'Double turn'],
                ].map(([value, symbol, label]) => (
                  <button
                    key={value}
                    aria-label={t(label)}
                    aria-pressed={turn === value}
                    className={turn === value ? 'active' : ''}
                    onClick={() => setTurn(value)}
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="move-pad" aria-label={t('Puzzle moves')}>
            {puzzle.moves
              .filter(
                (m) =>
                  !puzzle.moves.some((n) => n.endsWith('w')) ||
                  (moveGroup === 'Wide'
                    ? m.endsWith('w')
                    : moveGroup === 'Rotations'
                      ? ['x', 'y', 'z', 'M', 'E', 'S'].includes(m)
                      : !m.endsWith('w') && !['x', 'y', 'z', 'M', 'E', 'S'].includes(m)),
              )
              .map((m) => (
                <button
                  key={t(m)}
                  disabled={busy}
                  onClick={() =>
                    execute(
                      ['clock', 'square1'].includes(puzzle.id) || turn === 'normal'
                        ? m
                        : turn === 'inverse'
                          ? new Alg(m).invert().toString()
                          : `${m}2`,
                    )
                  }
                  onContextMenu={(e) => {
                    e.preventDefault();
                    execute(new Alg(m).invert().toString());
                  }}
                >
                  {t(m)}
                </button>
              ))}
          </div>
          {!puzzle.moves.length && (
            <p className="muted">
              {t('Use Clock notation in the algorithm input. Drag to orbit the model.')}
            </p>
          )}
          <button
            className="text-button guide-toggle"
            aria-expanded={showGuide}
            onClick={() => setShowGuide(!showGuide)}
          >
            {t(showGuide ? 'Hide guide' : 'Keyboard guide')}
          </button>
          <p className={`control-hint ${showGuide ? 'expanded' : ''}`}>
            {puzzle.renderer === 'cubing'
              ? t('Face click: turn')
              : t('Use notation or move controls')}{' '}
            · {puzzle.renderer === 'cubing' ? t('Right click: inverse') : t('Drag to orbit')}{' '}
            {t('· Keyboard: R, U, F…')}
            <br />
            {t('Shift + key: inverse · Alt + key: double turn')}
            <br />
            {t('Hold W + face key: wide turn (Shift: inverse · Alt: double)')}
          </p>
          <MoveHistory
            moves={state.history}
            clear={() => {
              try {
                setState(
                  controller.current.scramble(
                    [state.setup, ...state.history].filter(Boolean).join(' '),
                  ),
                );
              } catch (e) {
                setError(String(e));
              }
            }}
          />
          <div className="button-row">
            <button disabled={busy || running} onClick={() => void scramble()}>
              <Shuffle size={15} />
              {t('Scramble')}
            </button>
            <button disabled={busy} onClick={reset}>
              <RotateCcw size={15} />
              {t('Reset')}
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {t(error)}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
