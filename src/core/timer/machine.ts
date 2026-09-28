import type { Penalty } from '../../types';
export type TimerPhase = 'IDLE' | 'HOLDING' | 'READY' | 'INSPECTION' | 'RUNNING' | 'STOPPED';
export type TimerEvent =
  | 'HOLD_START'
  | 'READY_REACHED'
  | 'HOLD_RELEASE'
  | 'STOP'
  | 'RESET'
  | 'INSPECTION_START'
  | 'INSPECTION_EXPIRED';
export interface TimerState {
  phase: TimerPhase;
  startAt: number;
  elapsedMs: number;
  inspectionAt: number | null;
  penalty: Penalty;
}
export const initialTimer: TimerState = {
  phase: 'IDLE',
  startAt: 0,
  elapsedMs: 0,
  inspectionAt: null,
  penalty: 'none',
};
export const elapsedTime = (state: TimerState, now: number) =>
  state.phase === 'RUNNING' ? Math.max(0, now - state.startAt) : state.elapsedMs;
export function transition(
  state: TimerState,
  event: TimerEvent,
  now: number,
  inspection = false,
): TimerState {
  if (event === 'RESET') return { ...initialTimer };
  if ((event === 'STOP' || event === 'HOLD_START') && state.phase === 'RUNNING')
    return { ...state, phase: 'STOPPED', elapsedMs: elapsedTime(state, now) };
  if (event === 'INSPECTION_START' && (state.phase === 'IDLE' || state.phase === 'STOPPED'))
    return { ...initialTimer, phase: 'INSPECTION', inspectionAt: now };
  if (event === 'HOLD_START' && ['IDLE', 'STOPPED', 'INSPECTION'].includes(state.phase))
    return { ...state, phase: 'HOLDING', elapsedMs: 0, penalty: 'none' };
  if (event === 'READY_REACHED' && state.phase === 'HOLDING') return { ...state, phase: 'READY' };
  if (event === 'HOLD_RELEASE' && state.phase === 'HOLDING')
    return { ...state, phase: state.inspectionAt === null ? 'IDLE' : 'INSPECTION' };
  if (event === 'HOLD_RELEASE' && state.phase === 'READY') {
    if (inspection && state.inspectionAt === null)
      return { ...state, phase: 'INSPECTION', inspectionAt: now };
    const used = state.inspectionAt === null ? 0 : now - state.inspectionAt;
    return {
      ...state,
      phase: 'RUNNING',
      startAt: now,
      penalty: used > 17000 ? 'DNF' : used > 15000 ? '+2' : 'none',
    };
  }
  if (event === 'INSPECTION_EXPIRED' && state.inspectionAt !== null)
    return { ...state, penalty: now - state.inspectionAt > 17000 ? 'DNF' : '+2' };
  return state;
}
