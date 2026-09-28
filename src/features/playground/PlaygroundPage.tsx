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
  const { puzzleId, eventId } = usePuzzleStore();
  const { bindings } = useSettingsStore();
  const { sessionId, save } = useSessionStore();
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
      const move = bindings[keyChord(e)];
      if (move) {
        e.preventDefault();
        execute(move);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [bindings, busy, puzzleId, sessionId, eventId]);
  async function scramble() {
    setBusy(true);
    setError('');
    setResult(null);
    setElapsed(0);
    try {
      const alg = await generateScramble(eventId);
      setState(controller.current.scramble(alg));
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
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
          <span className="eyebrow">EXPLORE. LEARN. REPEAT.</span>
          <h1>
            Your puzzle playground<span>.</span>
          </h1>
        </div>
        <div className="segmented">
          {['Free play', 'Virtual solve', 'Algorithm'].map((m) => (
            <button
              key={m}
              disabled={running}
              className={mode === m ? 'active' : ''}
              onClick={() => {
                setMode(m);
                setResult(null);
                setElapsed(0);
              }}
            >
              {m}
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
              {state.solved ? 'Solved' : 'In progress'}
            </span>
            <span>{state.history.length} moves</span>
            {mode === 'Virtual solve' && <strong>{formatTime(elapsed, 3)}</strong>}
          </div>
        </section>
        <aside className="playground-controls">
          <div className="section-heading">
            <h2>{mode}</h2>
            <span>{puzzle.shortName}</span>
          </div>
          {mode === 'Virtual solve' && (
            <div className="virtual-controls">
              <p>
                Generate a scramble, start, then solve. The clock stops when your puzzle is solved.
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
                Start virtual solve
              </button>
              {running && (
                <button
                  onClick={() => {
                    runningRef.current = false;
                    setRunning(false);
                  }}
                >
                  <Square size={15} />
                  Cancel attempt
                </button>
              )}
              {result && (
                <div className="virtual-result">
                  <Check size={18} />
                  <strong>Solved in {formatTime(result.time, 3)}</strong>
                  <span>
                    {result.moves} moves · {(result.moves / (result.time / 1000)).toFixed(2)} TPS ·
                    Saved
                  </span>
                </div>
              )}
            </div>
          )}
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
                Undo
              </button>
              <button onClick={() => finish(controller.current.redo())} disabled={!state.canRedo}>
                <Redo2 size={15} />
                Redo
              </button>
            </div>
          </fieldset>
          <div className="move-pad" aria-label="Puzzle moves">
            {puzzle.moves.map((m) => (
              <button
                key={m}
                disabled={busy}
                onClick={() => execute(m)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  execute(new Alg(m).invert().toString());
                }}
              >
                {m}
              </button>
            ))}
          </div>
          {!puzzle.moves.length && (
            <p className="muted">
              Use Clock notation in the algorithm input. Drag to orbit the model.
            </p>
          )}
          <p className="control-hint">
            {puzzle.renderer === 'cubing' ? 'Face click: turn' : 'Use notation or move controls'} ·{' '}
            {puzzle.renderer === 'cubing' ? 'Right click: inverse' : 'Drag to orbit'} · Keyboard: R,
            U, F…
            <br />
            Shift + key: inverse · Alt + key: double turn
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
              Scramble
            </button>
            <button disabled={busy} onClick={reset}>
              <RotateCcw size={15} />
              Reset
            </button>
          </div>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
