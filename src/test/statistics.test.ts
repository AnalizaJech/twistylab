import { describe, it, expect } from 'vitest';
import { average, effectiveTime, formatTime } from '../core/statistics';
import type { Penalty } from '../types';
const solve = (timeMs: number, penalty: Penalty = 'none') => ({ timeMs, penalty });
describe('speedcubing statistics', () => {
  it('calculates Ao5 discarding best and worst', () =>
    expect(
      average(
        [10000, 11000, 12000, 13000, 50000].map((n) => solve(n)),
        5,
      ),
    ).toBe(12000));
  it('calculates Ao12', () =>
    expect(
      average(
        Array.from({ length: 12 }, (_, i) => solve(1000 * (i + 1))),
        12,
      ),
    ).toBe(6500));
  it('returns no average until enough solves', () => expect(average([solve(1000)], 5)).toBeNull());
  it('discards one DNF in Ao5', () =>
    expect(average([solve(1000), solve(2000), solve(3000), solve(4000), solve(0, 'DNF')], 5)).toBe(
      3000,
    ));
  it('two DNFs make Ao5 DNF', () =>
    expect(
      average([solve(1000), solve(2000), solve(3000), solve(0, 'DNF'), solve(0, 'DNF')], 5),
    ).toBe(Infinity));
  it('Mo3 does not trim DNF', () =>
    expect(average([solve(1), solve(2), solve(0, 'DNF')], 3, false)).toBe(Infinity));
  it('adds a +2 penalty before averaging', () => {
    expect(effectiveTime(solve(1000, '+2'))).toBe(3000);
    expect(
      average([solve(1000), solve(2000, '+2'), solve(3000), solve(5000), solve(6000)], 5),
    ).toBe(4000);
  });
  it('trims 5% rounded up on large averages', () =>
    expect(
      average(
        Array.from({ length: 100 }, (_, i) => solve(i + 1)),
        100,
      ),
    ).toBe(50.5));
  it('formats minute boundaries and DNF', () => {
    expect(formatTime(60000, 3)).toBe('1:00.000');
    expect(formatTime(Infinity)).toBe('DNF');
    expect(formatTime(null)).toBe('—');
  });
});
