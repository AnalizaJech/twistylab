import { useI18n } from '../i18n';
import { Select } from './Select';
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
  const { t } = useI18n();
  return getPuzzle(props.puzzleId).renderer === 'special' ? (
    <Suspense fallback={<div className="empty">{t('Loading 3D engine…')}</div>}>
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
  const { t } = useI18n();
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
        <span className="status-dot" />
        {t('LIVE 3D')}{' '}
        <span>{interactive ? t('Orbit · click a face to turn') : t('Drag to orbit')}</span>
      </div>
      <div
        ref={host}
        className="player-host"
        role="img"
        aria-label={`${getPuzzle(puzzleId).name} interactive 3D puzzle`}
        onError={() => setError('3D rendering failed. Check WebGL support.')}
      />
      {error && <p role="alert">{t(error)}</p>}
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
  const { t } = useI18n();
  return (
    <div className="viewer-toolbar">
      <Select
        label={t('Camera preset')}
        value={camera}
        onValueChange={preset}
        options={['Isometric', 'Front', 'Top', 'Right'].map((n) => ({ value: n, label: n }))}
      />
      <div>
        <button className="icon-button" aria-label={t('Zoom in')} onClick={() => zoom(-0.75)}>
          <Plus size={15} />
        </button>
        <button className="icon-button" aria-label={t('Zoom out')} onClick={() => zoom(0.75)}>
          <Minus size={15} />
        </button>
        <button
          className="icon-button"
          aria-label={t('Reset camera')}
          onClick={() => preset('Isometric')}
        >
          <RotateCcw size={15} />
        </button>
        <button className="icon-button" aria-label={t('Fullscreen puzzle')} onClick={fullscreen}>
          <Maximize size={15} />
        </button>
      </div>
    </div>
  );
}
export function ScramblePlayer({ player }: { player: () => TwistyPlayer | null }) {
  const { t } = useI18n();
  const [tempo, setTempo] = useState('1');
  return (
    <div className="playback">
      <button
        aria-label={t('Previous move')}
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
      <button aria-label={t('Play scramble')} onClick={() => player()?.play()}>
        <Play size={16} />
      </button>
      <button aria-label={t('Pause scramble')} onClick={() => player()?.pause()}>
        <Pause size={16} />
      </button>
      <button
        aria-label={t('Next move')}
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
      <button aria-label={t('Reset playback')} onClick={() => player()?.jumpToStart()}>
        <RotateCcw size={16} />
      </button>
      <Select
        label={t('Playback speed')}
        value={tempo}
        onValueChange={(v) => {
          setTempo(v);
          const p = player();
          if (p) p.tempoScale = Number(v);
        }}
        options={[
          { value: '0.5', label: '0.5×' },
          { value: '1', label: '1×' },
          { value: '2', label: '2×' },
          { value: '100', label: 'Instant' },
        ]}
      />
    </div>
  );
}
