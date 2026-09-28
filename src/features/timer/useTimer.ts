import { useCallback, useEffect, useRef, useState } from 'react';
import { useTimerStore, useSettingsStore } from '../../stores';
import { elapsedTime, type TimerState } from '../../core/timer/machine';
import { isTyping } from '../../core/controls/keyboard';
export function useTimer(onStop: (state: TimerState) => void, disabled = false) {
  const { timer, send } = useTimerStore();
  const { settings } = useSettingsStore();
  const [now, setNow] = useState(performance.now());
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressed = useRef(false);
  const callback = useRef(onStop);
  callback.current = onStop;
  const clearHold = useCallback(() => {
    if (hold.current) clearTimeout(hold.current);
    hold.current = null;
  }, []);
  const down = useCallback(() => {
    if (disabled || pressed.current) return;
    pressed.current = true;
    const before = useTimerStore.getState().timer;
    const n = performance.now();
    send('HOLD_START', n, settings.inspection);
    if (before.phase === 'RUNNING') {
      callback.current(useTimerStore.getState().timer);
      return;
    }
    hold.current = setTimeout(() => send('READY_REACHED', performance.now()), settings.holdMs);
  }, [disabled, send, settings.inspection, settings.holdMs]);
  const up = useCallback(() => {
    if (!pressed.current) return;
    pressed.current = false;
    clearHold();
    send('HOLD_RELEASE', performance.now(), settings.inspection);
  }, [send, clearHold, settings.inspection]);
  useEffect(() => {
    function keydown(e: KeyboardEvent) {
      if (e.code === 'Space' && !e.repeat && !isTyping(e.target, true)) {
        e.preventDefault();
        down();
      }
    }
    function keyup(e: KeyboardEvent) {
      if (e.code === 'Space') {
        e.preventDefault();
        up();
      }
    }
    function cancel() {
      pressed.current = false;
      clearHold();
      if (['HOLDING', 'READY'].includes(useTimerStore.getState().timer.phase))
        send('RESET', performance.now());
    }
    window.addEventListener('keydown', keydown);
    window.addEventListener('keyup', keyup);
    window.addEventListener('blur', cancel);
    return () => {
      window.removeEventListener('keydown', keydown);
      window.removeEventListener('keyup', keyup);
      window.removeEventListener('blur', cancel);
      clearHold();
    };
  }, [down, up, clearHold, send]);
  useEffect(() => {
    send('RESET', performance.now());
    return () => {
      send('RESET', performance.now());
      pressed.current = false;
    };
  }, [send]);
  useEffect(() => {
    if (!['RUNNING', 'INSPECTION', 'HOLDING', 'READY'].includes(timer.phase)) return;
    let frame = 0;
    const update = () => {
      setNow(performance.now());
      frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [timer.phase]);
  return {
    timer,
    elapsed: elapsedTime(timer, now),
    inspection:
      timer.inspectionAt === null ? 15 : Math.ceil((15000 - (now - timer.inspectionAt)) / 1000),
    down,
    up,
    cancel: () => {
      pressed.current = false;
      clearHold();
      send('RESET', performance.now());
    },
  };
}
