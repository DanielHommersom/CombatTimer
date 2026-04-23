import { useCallback, useRef, useState } from 'react';
import { audioManager, playPhaseTransition, playRoundEnd } from '../logic/audioManager';
import { Phase, PhaseStep, calcRemainingFromSteps } from '../logic/timerEngine';
import { Workout } from '../types/workout';

const WARNING_SECS = 10;

// ─── Public interface ─────────────────────────────────────────────────────────

export interface TimerStore {
  // Session
  activeWorkout:    Workout | null;
  steps:            PhaseStep[];
  // Timer state
  currentStepIndex: number;
  secsLeft:         number;
  elapsed:          number;
  isRunning:        boolean;
  isDone:           boolean;
  // Derived (used by the banner in TimerScreen)
  currentPhase:     Phase | null;
  currentRound:     number;
  totalRounds:      number;
  // Actions
  setActiveSession:   (workout: Workout, steps: PhaseStep[]) => void;
  startSession:       () => void;
  pauseSession:       () => void;
  resetSession:       () => void;
  goToStep:           (index: number) => void;
  clearActiveSession: () => void;
}

// ─── Hook (instantiated once inside TimerProvider at the app root) ────────────

export function useTimerStore(): TimerStore {
  const [activeWorkout, setActiveWorkout]       = useState<Workout | null>(null);
  const [steps, setSteps]                       = useState<PhaseStep[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secsLeft, setSecsLeft]                 = useState(0);
  const [elapsed, setElapsed]                   = useState(0);
  const [isRunning, setIsRunning]               = useState(false);
  const [isDone, setIsDone]                     = useState(false);

  // Refs keep the interval callback free of stale closures
  const stepsRef     = useRef<PhaseStep[]>([]);
  const stepIdxRef   = useRef(0);
  const secsRef      = useRef(0);
  const elapsedRef   = useRef(0);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevPhaseRef = useRef<Phase | null>(null);

  const stopInterval = () => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // ── setActiveSession ────────────────────────────────────────────────────────
  // Called by ActiveTimerScreen on mount (skipped when resuming same workout).
  const setActiveSession = useCallback((workout: Workout, newSteps: PhaseStep[]) => {
    stopInterval();
    stepsRef.current   = newSteps;
    stepIdxRef.current = 0;
    secsRef.current    = newSteps[0]?.durationSecs ?? 0;
    elapsedRef.current = 0;
    prevPhaseRef.current = null;

    setActiveWorkout(workout);
    setSteps(newSteps);
    setCurrentStepIndex(0);
    setSecsLeft(newSteps[0]?.durationSecs ?? 0);
    setElapsed(0);
    setIsRunning(false);
    setIsDone(false);
  }, []);

  // ── startSession ────────────────────────────────────────────────────────────
  // Starts (or resumes) the interval. Lives in TimerProvider so it persists
  // across tab switches and screen unmounts.
  const startSession = useCallback(() => {
    if (intervalRef.current !== null || stepsRef.current.length === 0) return;

    const step = stepsRef.current[stepIdxRef.current];
    if (stepIdxRef.current === 0 && elapsedRef.current === 0) audioManager.playStart();
    prevPhaseRef.current = step?.phase ?? null;

    setIsRunning(true);

    intervalRef.current = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      const next = secsRef.current - 1;
      if (next > 0) {
        secsRef.current = next;
        setSecsLeft(next);
        if (next === WARNING_SECS) audioManager.playWarning();
        return;
      }

      // Phase ended — advance
      const nextIdx = stepIdxRef.current + 1;
      const endingStep = stepsRef.current[stepIdxRef.current];
      if (endingStep?.phase === 'round') playRoundEnd();

      if (nextIdx >= stepsRef.current.length) {
        stopInterval();
        secsRef.current = 0;
        setSecsLeft(0);
        setIsRunning(false);
        setIsDone(true);
        audioManager.playFinish();
        playPhaseTransition();
      } else {
        const s = stepsRef.current[nextIdx];
        stepIdxRef.current = nextIdx;
        secsRef.current    = s.durationSecs;
        setCurrentStepIndex(nextIdx);
        setSecsLeft(s.durationSecs);

        if (s.phase !== prevPhaseRef.current) {
          prevPhaseRef.current = s.phase;
          playPhaseTransition();
        }
      }
    }, 1000);
  }, []);

  // ── pauseSession ────────────────────────────────────────────────────────────
  const pauseSession = useCallback(() => {
    stopInterval();
    setIsRunning(false);
  }, []);

  // ── resetSession ────────────────────────────────────────────────────────────
  const resetSession = useCallback(() => {
    stopInterval();
    if (stepsRef.current.length === 0) return;
    stepIdxRef.current = 0;
    secsRef.current    = stepsRef.current[0].durationSecs;
    elapsedRef.current = 0;
    prevPhaseRef.current = null;
    setCurrentStepIndex(0);
    setSecsLeft(stepsRef.current[0].durationSecs);
    setElapsed(0);
    setIsRunning(false);
    setIsDone(false);
  }, []);

  // ── goToStep ────────────────────────────────────────────────────────────────
  const goToStep = useCallback((index: number) => {
    if (index < 0 || index >= stepsRef.current.length) return;
    const s = stepsRef.current[index];
    stepIdxRef.current = index;
    secsRef.current    = s.durationSecs;
    setCurrentStepIndex(index);
    setSecsLeft(s.durationSecs);
    setIsDone(false);
  }, []);

  // ── clearActiveSession ──────────────────────────────────────────────────────
  const clearActiveSession = useCallback(() => {
    stopInterval();
    stepsRef.current   = [];
    stepIdxRef.current = 0;
    secsRef.current    = 0;
    elapsedRef.current = 0;
    prevPhaseRef.current = null;
    setActiveWorkout(null);
    setSteps([]);
    setCurrentStepIndex(0);
    setSecsLeft(0);
    setElapsed(0);
    setIsRunning(false);
    setIsDone(false);
  }, []);

  // Derive banner values
  const currentStep  = steps[currentStepIndex];
  const currentPhase = isDone ? null : (currentStep?.phase ?? null);
  const currentRound = currentStep?.round ?? 0;
  const totalRounds  = activeWorkout?.rounds ?? 0;

  return {
    activeWorkout, steps,
    currentStepIndex, secsLeft, elapsed, isRunning, isDone,
    currentPhase, currentRound, totalRounds,
    setActiveSession, startSession, pauseSession,
    resetSession, goToStep, clearActiveSession,
  };
}
