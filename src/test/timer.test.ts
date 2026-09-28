import { describe, it, expect } from 'vitest';
import { initialTimer, transition, elapsedTime } from '../core/timer/machine';
describe('deterministic timer', () => {
  it('requires hold and readiness before starting', () => {
    let s = transition(initialTimer, 'HOLD_START', 100);
    expect(s.phase).toBe('HOLDING');
    s = transition(s, 'HOLD_RELEASE', 200);
    expect(s.phase).toBe('IDLE');
    s = transition(s, 'HOLD_START', 300);
    s = transition(s, 'READY_REACHED', 650);
    s = transition(s, 'HOLD_RELEASE', 700);
    expect(s.phase).toBe('RUNNING');
    expect(elapsedTime(s, 1800)).toBe(1100);
    s = transition(s, 'STOP', 2400);
    expect(s.elapsedMs).toBe(1700);
    expect(elapsedTime(s, 9999)).toBe(1700);
  });
  it('ignores duplicate events', () => {
    const holding = transition(initialTimer, 'HOLD_START', 1);
    expect(transition(holding, 'HOLD_START', 2)).toEqual(holding);
    const stopped = transition({ ...initialTimer, phase: 'RUNNING', startAt: 100 }, 'STOP', 900);
    expect(transition(stopped, 'STOP', 1500)).toEqual(stopped);
  });
  it.each([
    [14999, 'none'],
    [15000, 'none'],
    [15001, '+2'],
    [17000, '+2'],
    [17001, 'DNF'],
  ])('inspection %d ms yields %s', (time, penalty) => {
    let s = transition(initialTimer, 'INSPECTION_START', 1000);
    s = transition(s, 'HOLD_START', 1100);
    s = transition(s, 'READY_REACHED', 1200);
    s = transition(s, 'HOLD_RELEASE', 1000 + Number(time), true);
    expect(s.penalty).toBe(penalty);
    expect(s.phase).toBe('RUNNING');
  });
  it('first hold begins inspection, second starts solve', () => {
    let s = transition(initialTimer, 'HOLD_START', 0, true);
    s = transition(s, 'READY_REACHED', 350, true);
    s = transition(s, 'HOLD_RELEASE', 400, true);
    expect(s.phase).toBe('INSPECTION');
    expect(s.inspectionAt).toBe(400);
    s = transition(s, 'HOLD_START', 1000, true);
    s = transition(s, 'READY_REACHED', 1350, true);
    s = transition(s, 'HOLD_RELEASE', 1400, true);
    expect(s.phase).toBe('RUNNING');
  });
  it('resets all timing and penalty fields', () => {
    expect(
      transition(
        { ...initialTimer, phase: 'STOPPED', elapsedMs: 3000, penalty: 'DNF' },
        'RESET',
        4000,
      ),
    ).toEqual(initialTimer);
  });
});
