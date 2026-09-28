import { bestAverage } from '../core/statistics';
import type { Solve } from '../types';
self.onmessage = (event: MessageEvent<{ solves: Solve[] }>) => {
  const { solves } = event.data;
  self.postMessage({
    5: bestAverage(solves, 5),
    12: bestAverage(solves, 12),
    100: bestAverage(solves, 100),
  });
};
