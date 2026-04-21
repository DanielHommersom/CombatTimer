import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Phase,
  PhaseStep,
  buildPhaseSteps,
  calcRemainingFromSteps,
} from '../logic/timerEngine';
import { RootStackParamList } from '../navigation/BottomTabNavigator';
import { useTimer } from '../store/TimerContext';

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTimer'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const WARNING_SECS = 10;

const PHASE_COLOR: Record<Phase, string> = {
  warmup:   '#ffd60a',
  round:    '#34c759',
  rest:     '#ff453a',
  cooldown: '#0a84ff',
  done:     'rgba(255,255,255,0.4)',
};

const GRADIENT: Record<Phase, [string, string]> = {
  warmup:   ['#111111', '#1a1400'],
  round:    ['#111111', '#0d1a0d'],
  rest:     ['#111111', '#0d0014'],
  cooldown: ['#111111', '#00101a'],
  done:     ['#111111', '#111111'],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function fmtHMSS(secs: number): string {
  if (secs < 3600) return fmtMSS(secs);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── ArrowButton ──────────────────────────────────────────────────────────────

interface ArrowButtonProps {
  direction: 'left' | 'right';
  disabled:  boolean;
  onPress:   () => void;
}

function ArrowButton({ direction, disabled, onPress }: ArrowButtonProps) {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    opacity:   withTiming(disabled ? 0.2 : pressed.value ? 0.9 : 0.5, { duration: 100 }),
    transform: [{ scale: withTiming(pressed.value ? 0.92 : 1, { duration: 100 }) }],
  }));
  return (
    <Pressable
      onPressIn={() => { if (!disabled) pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={onPress}
      disabled={disabled}
      style={styles.arrowBtn}
    >
      <Animated.Text style={[styles.arrowText, animStyle]}>
        {direction === 'left' ? '‹' : '›'}
      </Animated.Text>
    </Pressable>
  );
}

// ─── ActiveTimerScreen ────────────────────────────────────────────────────────

export default function ActiveTimerScreen({ route, navigation }: Props) {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { workout } = route.params;

  // Local steps are computed from route params — always available on first render
  const [steps] = useState<PhaseStep[]>(() => buildPhaseSteps(workout));

  const {
    activeWorkout,
    currentStepIndex,
    secsLeft,
    elapsed,
    isRunning,
    isDone,
    setActiveSession,
    startSession,
    pauseSession,
    resetSession,
    goToStep,
    clearActiveSession,
  } = useTimer();

  // ── Session init ──────────────────────────────────────────────────────────
  // Skip setActiveSession when resuming the same workout after minimize.
  // The interval is still running in the store — no need to reset.
  useEffect(() => {
    if (!activeWorkout || activeWorkout.id !== workout.id) {
      setActiveSession(workout, steps);
    }
  }, []);

  // ── Derived ───────────────────────────────────────────────────────────────
  const safeIndex    = Math.min(currentStepIndex, steps.length - 1);
  const currentPhase: Phase = isDone ? 'done' : (steps[safeIndex]?.phase ?? 'round');
  const color        = PHASE_COLOR[currentPhase];
  const gradient     = GRADIENT[currentPhase];
  const isAtStart    = !isRunning && elapsed === 0 && !isDone;
  const showReset    = !isAtStart;
  const remaining    = isDone ? 0 : calcRemainingFromSteps(steps, safeIndex, secsLeft);
  const phaseLabel   = isDone ? 'Done' : (steps[safeIndex]?.label ?? '');
  const prevDisabled = isDone || safeIndex === 0;
  const nextDisabled = isDone || safeIndex >= steps.length - 1;

  // ── Progress bar ──────────────────────────────────────────────────────────
  const progressSV   = useSharedValue(1);
  const prevStepRef  = useRef(-1);

  useEffect(() => {
    if (isDone) {
      progressSV.value    = withTiming(0, { duration: 500 });
      prevStepRef.current = -1;
      return;
    }
    const dur      = steps[safeIndex]?.durationSecs ?? 1;
    const newValue = dur > 0 ? secsLeft / dur : 0;
    const changed  = prevStepRef.current !== safeIndex;
    prevStepRef.current = safeIndex;

    if (changed) {
      progressSV.value = newValue;
    } else {
      progressSV.value = withTiming(newValue, { duration: isRunning ? 950 : 0 });
    }
  }, [secsLeft, safeIndex, isDone]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressSV.value * 100}%` as `${number}%`,
  }));

  // ── Navigation ────────────────────────────────────────────────────────────
  const goNext = () => goToStep(safeIndex + 1);
  const goPrev = () => {
    if (isRunning && steps[safeIndex]?.phase === 'round') {
      Alert.alert('Go back?', 'This will restart the previous phase.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Go back', onPress: () => goToStep(safeIndex - 1) },
      ]);
    } else {
      goToStep(safeIndex - 1);
    }
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  const handleStart = () => startSession();
  const handlePause = () => pauseSession();
  const handleReset = () => resetSession();

  // Mid-workout: go back and let the timer continue (banner picks it up).
  // At start or done: clear session first since there's nothing to resume.
  const handleBack = () => {
    if (isAtStart || isDone) clearActiveSession();
    navigation.goBack();
  };

  return (
    <LinearGradient
      colors={gradient}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 }]}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <Pressable onPress={handleBack} hitSlop={12}>
          <Text style={styles.stopText}>← Back</Text>
        </Pressable>
      </View>

      {/* ── Main timer ───────────────────────────────────────────────────── */}
      <View style={styles.displayArea}>
        <Text style={[styles.timerText, { color }]}>{fmtMSS(secsLeft)}</Text>
      </View>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: color }]} />
      </View>

      {/* ── Phase row ────────────────────────────────────────────────────── */}
      <View style={styles.phaseRow}>
        <ArrowButton direction="left"  disabled={prevDisabled} onPress={goPrev} />
        <Text style={styles.phaseName}>{phaseLabel}</Text>
        <ArrowButton direction="right" disabled={nextDisabled} onPress={goNext} />
      </View>

      <Text style={styles.workoutSubtitle} numberOfLines={1}>{workout.name}</Text>

      {/* ── Stats ────────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        <View style={styles.statCol}>
          <Text style={styles.statLabel}>ELAPSED</Text>
          <Text style={styles.statValue}>{fmtMSS(elapsed)}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={[styles.statCol, styles.statColRight]}>
          <Text style={styles.statLabel}>REMAINING</Text>
          <Text style={styles.statValue}>{fmtHMSS(remaining)}</Text>
        </View>
      </View>

      {/* ── Controls ─────────────────────────────────────────────────────── */}
      <View style={styles.controls}>
        {showReset && (
          <Pressable style={styles.secondaryBtn} onPress={handleReset}>
            <Text style={styles.secondaryBtnText}>RESET</Text>
          </Pressable>
        )}
        {isRunning ? (
          <Pressable style={styles.primaryBtn} onPress={handlePause}>
            <Text style={styles.primaryBtnText}>PAUSE</Text>
          </Pressable>
        ) : !isDone ? (
          <Pressable style={styles.primaryBtn} onPress={handleStart}>
            <Text style={styles.primaryBtnText}>{isAtStart ? 'START' : 'RESUME'}</Text>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topBar: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stopText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  displayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 80,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    letterSpacing: -3,
    includeFontPadding: false,
  },
  progressBg: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 4,
  },
  arrowBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 20,
  },
  phaseName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 100,
  },
  workoutSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 28,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  statCol: {
    flex: 1,
    gap: 4,
  },
  statColRight: {
    alignItems: 'flex-end',
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginHorizontal: 20,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  statValue: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#111',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  secondaryBtn: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
});
