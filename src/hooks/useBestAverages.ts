import { useEffect, useState } from 'react';
import type { Solve } from '../types';
export function useBestAverages(solves: Solve[], enabled: boolean) {
  const [values, setValues] = useState<Record<number, number | null>>({
    5: null,
    12: null,
    100: null,
  });
  useEffect(() => {
    if (!enabled) return;
    const worker = new Worker(new URL('../workers/statistics.worker.ts', import.meta.url), {
      type: 'module',
    });
    setValues({ 5: null, 12: null, 100: null });
    worker.onmessage = (e: MessageEvent<Record<number, number | null>>) => setValues(e.data);
    worker.postMessage({ solves });
    return () => worker.terminate();
  }, [solves, enabled]);
  return values;
}
