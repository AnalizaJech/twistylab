import type { Solve } from '../../types';
export const effectiveTime = (s: Pick<Solve, 'timeMs' | 'penalty'>) =>
  s.penalty === 'DNF' ? Infinity : s.timeMs + (s.penalty === '+2' ? 2000 : 0);
export function average(
  solves: Pick<Solve, 'timeMs' | 'penalty'>[],
  n: number,
  trim = true,
): number | null {
  if (solves.length < n) return null;
  const times = solves
    .slice(-n)
    .map(effectiveTime)
    .sort((a, b) => a - b);
  const cut = trim ? Math.ceil(n * 0.05) : 0;
  const kept = times.slice(cut, n - cut);
  return kept.reduce((a, b) => a + b, 0) / kept.length;
}
export function bestAverage(solves: Solve[], n: number): number | null {
  if (solves.length < n) return null;
  let best = Infinity;
  for (let i = n; i <= solves.length; i++)
    best = Math.min(best, average(solves.slice(i - n, i), n) ?? Infinity);
  return best;
}
export const bestSingle = (solves: Solve[]) =>
  solves.length ? Math.min(...solves.map(effectiveTime)) : null;
export function formatTime(ms: number | null, precision = 2) {
  if (ms === null) return '—';
  if (!Number.isFinite(ms)) return 'DNF';
  const total = Math.floor(ms / 10 ** (3 - precision)) / 10 ** precision;
  const seconds = total % 60;
  return total >= 60
    ? `${Math.floor(total / 60)}:${seconds.toFixed(precision).padStart(3 + precision, '0')}`
    : total.toFixed(precision);
}
