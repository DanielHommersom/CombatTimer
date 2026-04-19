import { useCallback, useState } from 'react';
import { Phase } from '../logic/timerEngine';
import { Workout } from '../types/workout';

// ─── Public interface ─────────────────────────────────────────────────────────

export interface SessionUpdate {
  phase:     Phase | null;
  round:     number;
  secsLeft:  number;
  isRunning: boolean;
}

export interface TimerStore {
  activeWorkout:     Workout | null;
  currentPhase:      Phase | null;
  currentRound:      number;
  totalRounds:       number;
  secsLeft:          number;
  isRunning:         boolean;
  // Called by ActiveTimerScreen on mount
  setActiveSession:  (workout: Workout) => void;
  // Called by ActiveTimerScreen on every tick + state change
  updateSession:     (update: SessionUpdate) => void;
  // Called by ActiveTimerScreen on unmount / back / done
  clearActiveSession: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useTimerStore(): TimerStore {
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [currentPhase, setCurrentPhase]   = useState<Phase | null>(null);
  const [currentRound, setCurrentRound]   = useState(0);
  const [secsLeft, setSecsLeft]           = useState(0);
  const [isRunning, setIsRunning]         = useState(false);

  const setActiveSession = useCallback((workout: Workout) => {
    setActiveWorkout(workout);
    setCurrentPhase(null);
    setCurrentRound(0);
    setSecsLeft(0);
    setIsRunning(false);
  }, []);

  const updateSession = useCallback((u: SessionUpdate) => {
    setCurrentPhase(u.phase);
    setCurrentRound(u.round);
    setSecsLeft(u.secsLeft);
    setIsRunning(u.isRunning);
  }, []);

  const clearActiveSession = useCallback(() => {
    setActiveWorkout(null);
    setCurrentPhase(null);
    setCurrentRound(0);
    setSecsLeft(0);
    setIsRunning(false);
  }, []);

  return {
    activeWorkout,
    currentPhase,
    currentRound,
    totalRounds: activeWorkout?.rounds ?? 0,
    secsLeft,
    isRunning,
    setActiveSession,
    updateSession,
    clearActiveSession,
  };
}
