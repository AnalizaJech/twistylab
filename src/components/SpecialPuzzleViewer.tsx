import { useI18n } from '../i18n';
import { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import { Alg, Move } from 'cubing/alg';
import { ThreeJsPuzzleRenderer } from '../engines/threejs/ThreeJsPuzzleRenderer';
import { useSettingsStore } from '../stores';
import { PuzzleToolbar, type ViewerProps } from './PuzzleViewer3D';
export default function SpecialPuzzleViewer({
  puzzleId,
  setup = '',
  algorithm = '',
  large,
  animation,
}: ViewerProps) {
  const { t } = useI18n();
  const host = useRef<HTMLDivElement>(null);
  const renderer = useRef<ThreeJsPuzzleRenderer | null>(null);
  const [camera, setCamera] = useState('Isometric');
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const { settings } = useSettingsStore();
  const moves = useRef<string[]>([]);
  useEffect(() => {
    moves.current = Array.from(new Alg(algorithm).expand().childAlgNodes())
      .filter((n) => n instanceof Move)
      .map((n) => n.toString());
    setStep(0);
    setPlaying(false);
  }, [algorithm]);
  useEffect(() => {
    let alive = true;
    setReady(false);
    setError('');
    const r = new ThreeJsPuzzleRenderer(host.current!, puzzleId);
    renderer.current = r;
    r.load()
      .then(() => {
        if (alive) setReady(true);
      })
      .catch((e) => {
        if (alive) setError(String(e));
      });
    return () => {
      alive = false;
      r.dispose();
      renderer.current = null;
    };
  }, [puzzleId]);
  useEffect(() => {
    if (!ready) return;
    const r = renderer.current!;
    r.speed = { slow: 0.5, normal: 1, fast: 2.5, instant: 100 }[settings.speed];
    try {
      r.setState(
        setup,
        animation ? moves.current.slice(0, step).join(' ') : algorithm,
        settings.speed !== 'instant' && !matchMedia('(prefers-reduced-motion: reduce)').matches,
      );
    } catch (e) {
      setError(String(e));
    }
  }, [setup, algorithm, step, animation, ready, settings.speed]);
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(
      () => {
        if (step < moves.current.length) setStep((s) => s + 1);
        else setPlaying(false);
      },
      350 / { slow: 0.5, normal: 1, fast: 2.5, instant: 100 }[settings.speed],
    );
    return () => clearTimeout(t);
  }, [playing, step, settings.speed]);
  return (
    <div className={`viewer ${large ? 'large' : ''}`}>
      <div className="viewer-label">
        <span className="status-dot" />
        {t('LIVE 3D')}
        <span>{t('Drag to orbit · use move controls')}</span>
      </div>
      <div ref={host} className="player-host" role="img" aria-label={`${puzzleId} 3D puzzle`} />
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <PuzzleToolbar
        camera={camera}
        preset={(name) => {
          setCamera(name);
          renderer.current?.preset(name);
        }}
        zoom={(n) => renderer.current?.zoom(n)}
        fullscreen={() => void host.current?.requestFullscreen()}
      />
      {animation && (
        <div className="playback">
          <button
            aria-label={t('Previous move')}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            <SkipBack size={16} />
          </button>
          <button
            aria-label={t('Play scramble')}
            onClick={() => {
              if (step === moves.current.length) setStep(0);
              setPlaying(true);
            }}
          >
            <Play size={16} />
          </button>
          <button aria-label={t('Pause scramble')} onClick={() => setPlaying(false)}>
            <Pause size={16} />
          </button>
          <button
            aria-label={t('Next move')}
            onClick={() => setStep((s) => Math.min(moves.current.length, s + 1))}
          >
            <SkipForward size={16} />
          </button>
          <button
            aria-label={t('Reset playback')}
            onClick={() => {
              setStep(0);
              setPlaying(false);
            }}
          >
            <RotateCcw size={16} />
          </button>
          <span>
            {step}
            {t('/')}
            {moves.current.length}
          </span>
        </div>
      )}
    </div>
  );
}
