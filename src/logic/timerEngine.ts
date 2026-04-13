// ─── Legacy types (used by Tab Timer / useTimerStore) ────────────────────────

export type TimerPhase = 'idle' | 'work' | 'rest' | 'finished';

export interface TimerConfig {
  workDuration: number;
  restDuration: number;
  rounds: number;
  warningSeconds: number;
}

export interface TimerState {
  phase: TimerPhase;
  currentRound: number;
  secondsRemaining: number;
  config: TimerConfig;
}

export const DEFAULT_CONFIG: TimerConfig = {
  workDuration: 180,
  restDuration: 60,
  rounds: 3,
  warningSeconds: 10,
};

export function buildInitialState(config: TimerConfig): TimerState {
  return { phase: 'idle', currentRound: 1, secondsRemaining: config.workDuration, config };
}

export function tick(state: TimerState): TimerState {
  if (state.phase === 'idle' || state.phase === 'finished') return state;

  const next = state.secondsRemaining - 1;
  if (next > 0) return { ...state, secondsRemaining: next };

  if (state.phase === 'work') {
    if (state.config.restDuration > 0)
      return { ...state, phase: 'rest', secondsRemaining: state.config.restDuration };
    return advanceRound(state);
  }
  if (state.phase === 'rest') return advanceRound(state);
  return state;
}

function advanceRound(state: TimerState): TimerState {
  const nextRound = state.currentRound + 1;
  if (nextRound > state.config.rounds)
    return { ...state, phase: 'finished', secondsRemaining: 0 };
  return { ...state, phase: 'work', currentRound: nextRound, secondsRemaining: state.config.workDuration };
}

export function isWarning(state: TimerState): boolean {
  return (
    (state.phase === 'work' || state.phase === 'rest') &&
    state.secondsRemaining <= state.config.warningSeconds &&
    state.secondsRemaining > 0
  );
}

// ─── Workout Timer types (used by ActiveTimer / TimerScreen) ─────────────────

export type WorkoutPhase = 'ready' | 'warmup' | 'work' | 'rest' | 'cooldown' | 'done';

// ─── Shared helpers ───────────────────────────────────────────────────────────

/** "3:00" → 180. Returns 0 for empty or un-parseable input. */
export function parseTime(str: string): number {
  if (!str) return 0;
  if (str.includes(':')) {
    const [m, s] = str.split(':').map((n) => parseInt(n) || 0);
    return m * 60 + s;
  }
  return parseInt(str) || 0;
}

/** 185 → "03:05" */
export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
