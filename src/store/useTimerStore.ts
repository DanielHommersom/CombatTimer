import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DEFAULT_CONFIG,
  TimerConfig,
  TimerState,
  buildInitialState,
  isWarning,
  tick,
} from '../logic/timerEngine';
import { audioManager } from '../logic/audioManager';

export interface TimerStore {
  config: TimerConfig;
  setConfig: (config: Partial<TimerConfig>) => void;
  timerState: TimerState;
  isRunning: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  applyPreset: (preset: Partial<TimerConfig>) => void;
}

export function useTimerStore(): TimerStore {
  const [config, setConfigState] = useState<TimerConfig>(DEFAULT_CONFIG);
  const [timerState, setTimerState] = useState<TimerState>(buildInitialState(DEFAULT_CONFIG));
  const [isRunning, setIsRunning] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef(timerState.phase);
  const prevWarningRef = useRef(false);

  const clearTick = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimerState((prev) => {
        const next = tick(prev);

        if (next.phase !== prevPhaseRef.current) {
          prevPhaseRef.current = next.phase;
          if (next.phase === 'work')     audioManager.playStart();
          if (next.phase === 'rest')     audioManager.playRest();
          if (next.phase === 'finished') audioManager.playFinish();
        }

        const warning = isWarning(next);
        if (warning && !prevWarningRef.current) audioManager.playWarning();
        prevWarningRef.current = warning;

        if (next.phase === 'finished') {
          clearTick();
          setIsRunning(false);
        }

        return next;
      });
    }, 1000);

    return clearTick;
  }, [isRunning]);

  const start = useCallback(() => {
    if (timerState.phase === 'idle') {
      setTimerState((prev) => ({ ...prev, phase: 'work' }));
      prevPhaseRef.current = 'work';
      audioManager.playStart();
    }
    setIsRunning(true);
  }, [timerState.phase]);

  const pause = useCallback(() => setIsRunning(false), []);

  const reset = useCallback(() => {
    setIsRunning(false);
    prevPhaseRef.current = 'idle';
    prevWarningRef.current = false;
    setTimerState(buildInitialState(config));
  }, [config]);

  const setConfig = useCallback((partial: Partial<TimerConfig>) => {
    setConfigState((prev) => {
      const next = { ...prev, ...partial };
      setTimerState(buildInitialState(next));
      return next;
    });
  }, []);

  const applyPreset = useCallback((preset: Partial<TimerConfig>) => {
    setConfig(preset);
  }, [setConfig]);

  return { config, setConfig, timerState, isRunning, start, pause, reset, applyPreset };
}
