import React, { createContext, useContext } from 'react';
import { useTimerStore, TimerStore } from './useTimerStore';

const TimerContext = createContext<TimerStore | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const store = useTimerStore();
  return <TimerContext.Provider value={store}>{children}</TimerContext.Provider>;
}

export function useTimer(): TimerStore {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within <TimerProvider>');
  return ctx;
}
