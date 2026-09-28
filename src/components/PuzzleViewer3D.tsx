import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { TwistyPlayer } from 'cubing/twisty';
import { Alg } from 'cubing/alg';
import { Maximize, RotateCcw, Play, Pause, SkipBack, SkipForward, Minus, Plus } from 'lucide-react';
import { getPuzzle } from '../core/puzzles/registry';
import { useSettingsStore } from '../stores';
export interface ViewerProps {
  puzzleId: string;
  setup?: string;
  algorithm?: string;
  interactive?: boolean;
  onNativeMoves?: (alg: string) => void;
  large?: boolean;
  animation?: boolean;
}
const SpecialPuzzleViewer = lazy(() => import('./SpecialPuzzleViewer'));
export function PuzzleViewer3D(props: ViewerProps) {
  return getPuzzle(props.puzzleId).renderer === 'special' ? (
    <Suspense fallback={<div className="empty">Loading 3D engine...</div>}>
      <SpecialPuzzleViewer {...props} />
    </Suspense>
  ) : (
    <CubingViewer {...props} />
  );
}
function CubingViewer({
  puzzleId,
  setup = '',
  algorithm = '',
  interactive = false,
  onNativeMoves,
  large = false,
  animation = false,
}: ViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const player = useRef<TwistyPlayer | null>(null);
  const callback = useRef(onNativeMoves);
  callback.current = onNativeMoves;
  const expected = useRef(algorithm);
  expected.current = algorithm;
  const previous = useRef('');
  const [error, setError] = useState('');
  const { settings } = useSettingsStore();
  const [camera, setCamera] = useState('Isometric');
  const distance = useRef(6);
  const [mounted, setMounted] = useState(0);
  useEffect(() => {
    let alive = true;
    setError('');
    const p = new TwistyPlayer({
      puzzle: getPuzzle(puzzleId).cubingPuzzleId as TwistyPlayer['puzzle'],
      alg: '',
      visualization: interactive && getPuzzle(puzzleId).category === 'NxNxN' ? 'PG3D' : 'auto',
      background: 'none',
      controlPanel: 'none',
      hintFacelets: 'none',
      experimentalMovePressInput: interactive ? 'basic' : 'none',
      cameraLatitude: 30,
      cameraLongitude: 35,
      experimentalSetupAnchor: 'start',
    });
    player.current = p;
    previous.current = '';
    host.current?.appendChild(p);
    const listener = (value: { alg: Alg }) => {
      const next = value.alg.toString();
      if (alive && interactive && next !== expected.current && next.startsWith(expected.current)) {
        const extra = next.slice(expected.current.length).trim();
        if (extra) {
          previous.current = next;
          callback.current?.(extra);
        }
      }
    };
    p.experimentalModel.alg.addFreshListener(listener);
    setMounted((n) => n + 1);
    return () => {
      alive = false;
      p.pause();
      p.experimentalModel.alg.removeFreshListener(listener);
      p.remove();
      player.current = null;
    };
  }, [puzzleId, interactive]);
  useEffect(() => {
    const p = player.current;
    if (!p) return;
    p.experimentalSetupAlg = setup;
    previous.current = '';
    p.alg = algorithm;
    p.timestamp = animation ? 'start' : 'end';
    previous.current = algorithm;
  }, [setup, mounted]);
  useEffect(() => {
    const p = player.current;
    if (!p || algorithm === previous.current) return;
    const prev = previous.current;
    previous.current = algorithm;
    if (
      algorithm.startsWith(prev) &&
      prev !== algorithm &&
      !animation &&
      settings.speed !== 'instant' &&
      !matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      const extra = algorithm.slice(prev.length).trim();
      try {
        for (const move of new Alg(extra).expand().childAlgNodes()) p.experimentalAddAlgLeaf(move);
      } catch {
        p.alg = algorithm;
        p.timestamp = 'end';
      }
    } else {
      p.alg = algorithm;
      p.timestamp = animation ? 'start' : 'end';
    }
  }, [algorithm, animation, settings.speed]);
  useEffect(() => {
    if (player.current)
      player.current.tempoScale = { slow: 0.5, normal: 1, fast: 2.5, instant: 100 }[settings.speed];
  }, [settings.speed, mounted]);
  function preset(name: string) {
    setCamera(name);
    const p = player.current;
    if (!p) return;
    const coords: Record<string, [number, number]> = {
      Front: [0, 0],
      Top: [90, 0],
      Right: [0, 90],
      Isometric: [30, 35],
    };
    [p.cameraLatitude, p.cameraLongitude] = coords[name];
    p.cameraDistance = 6;
    distance.current = 6;
  }
  return (
    <div className={`viewer ${large ? 'large' : ''}`}>
      <div className="viewer-label">
        <span className="status-dot" /> LIVE 3D{' '}
        <span>{interactive ? 'Orbit · click a face to turn' : 'Drag to orbit'}</span>
      </div>
      <div
        ref={host}
        className="player-host"
        role="img"
        aria-label={`${getPuzzle(puzzleId).name} interactive 3D puzzle`}
        onError={() => setError('3D rendering failed. Check WebGL support.')}
      />
      {error && <p role="alert">{error}</p>}
      <PuzzleToolbar
        camera={camera}
        preset={preset}
        zoom={(amount) => {
          distance.current = Math.max(3, Math.min(12, distance.current + amount));
          if (player.current) player.current.cameraDistance = distance.current;
        }}
        fullscreen={() => void host.current?.requestFullscreen()}
      />
      {animation && <ScramblePlayer player={() => player.current} />}
    </div>
  );
}
export function PuzzleToolbar({
  camera,
  preset,
  zoom,
  fullscreen,
}: {
  camera: string;
  preset: (name: string) => void;
  zoom: (amount: number) => void;
  fullscreen: () => void;
}) {
  return (
    <div className="viewer-toolbar">
      <select aria-label="Camera preset" value={camera} onChange={(e) => preset(e.target.value)}>
        {['Isometric', 'Front', 'Top', 'Right'].map((n) => (
          <option key={n}>{n}</option>
        ))}
      </select>
      <div>
        <button className="icon-button" aria-label="Zoom in" onClick={() => zoom(-0.75)}>
          <Plus size={15} />
        </button>
        <button className="icon-button" aria-label="Zoom out" onClick={() => zoom(0.75)}>
          <Minus size={15} />
        </button>
        <button
          className="icon-button"
          aria-label="Reset camera"
          onClick={() => preset('Isometric')}
        >
          <RotateCcw size={15} />
        </button>
        <button className="icon-button" aria-label="Fullscreen puzzle" onClick={fullscreen}>
          <Maximize size={15} />
        </button>
      </div>
    </div>
  );
}
export function ScramblePlayer({ player }: { player: () => TwistyPlayer | null }) {
  return (
    <div className="playback">
      <button
        aria-label="Previous move"
        onClick={() =>
          player()?.controller.animationController.play({
            direction: -1,
            untilBoundary: 'move' as Parameters<
              TwistyPlayer['controller']['animationController']['play']
            >[0] extends infer O
              ? O extends { untilBoundary?: infer B }
                ? B
                : never
              : never,
          })
        }
      >
        <SkipBack size={16} />
      </button>
      <button aria-label="Play scramble" onClick={() => player()?.play()}>
        <Play size={16} />
      </button>
      <button aria-label="Pause scramble" onClick={() => player()?.pause()}>
        <Pause size={16} />
      </button>
      <button
        aria-label="Next move"
        onClick={() =>
          player()?.controller.animationController.play({
            direction: 1,
            untilBoundary: 'move' as Parameters<
              TwistyPlayer['controller']['animationController']['play']
            >[0] extends infer O
              ? O extends { untilBoundary?: infer B }
                ? B
                : never
              : never,
          })
        }
      >
        <SkipForward size={16} />
      </button>
      <button aria-label="Reset playback" onClick={() => player()?.jumpToStart()}>
        <RotateCcw size={16} />
      </button>
      <select
        aria-label="Playback speed"
        onChange={(e) => {
          const p = player();
          if (p) p.tempoScale = Number(e.target.value);
        }}
        defaultValue="1"
      >
        <option value="0.5">0.5×</option>
        <option value="1">1×</option>
        <option value="2">2×</option>
        <option value="100">Instant</option>
      </select>
    </div>
  );
}
