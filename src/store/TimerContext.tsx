import React, { createContext, useContext, useEffect } from 'react';
import { audioManager } from '../logic/audioManager';
import { useTimerStore, TimerStore } from './useTimerStore';

const TimerContext = createContext<TimerStore | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const store = useTimerStore();

  useEffect(() => {
    audioManager.init();
  }, []);

  return <TimerContext.Provider value={store}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerStore {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within <TimerProvider>');
  return ctx;
}
