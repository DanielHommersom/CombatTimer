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
import { audioManager } from '../logic/audioManager';
import {
  Phase,
  PhaseStep,
  buildPhaseSteps,
  calcRemainingFromSteps,
} from '../logic/timerEngine';
import { RootStackParamList } from '../navigation/BottomTabNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Display helpers ──────────────────────────────────────────────────────────

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
  disabled: boolean;
  onPress: () => void;
}

function ArrowButton({ direction, disabled, onPress }: ArrowButtonProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    opacity: withTiming(disabled ? 0.2 : pressed.value ? 0.9 : 0.5, { duration: 100 }),
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

// ─── TimerScreen ──────────────────────────────────────────────────────────────

export default function TimerScreen({ route, navigation }: Props) {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { workout } = route.params;

  // ── Steps (immutable for the session) ────────────────────────────────────
  const [steps] = useState<PhaseStep[]>(() => buildPhaseSteps(workout));

  // ── Timer state ───────────────────────────────────────────────────────────
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [secsLeft, setSecsLeft]                 = useState(steps[0].durationSecs);
  const [isRunning, setIsRunning]               = useState(false);
  const [elapsed, setElapsed]                   = useState(0);
  const [isDone, setIsDone]                     = useState(false);

  // Refs for interval (avoid stale closures)
  const currentStepIndexRef = useRef(0);
  const secsRef             = useRef(steps[0].durationSecs);
  const elapsedRef          = useRef(0);

  currentStepIndexRef.current = currentStepIndex;
  secsRef.current             = secsLeft;

  // ── Derived ───────────────────────────────────────────────────────────────
  const currentPhase: Phase = isDone ? 'done' : steps[currentStepIndex].phase;
  const color     = PHASE_COLOR[currentPhase];
  const gradient  = GRADIENT[currentPhase];
  const isAtStart = !isRunning && elapsed === 0 && !isDone;
  const showBack  = isAtStart || isDone;
  const showReset = !isAtStart;
  const remaining = isDone ? 0 : calcRemainingFromSteps(steps, currentStepIndex, secsLeft);
  const phaseLabel   = isDone ? 'Done' : steps[currentStepIndex].label;
  const prevDisabled = isDone || currentStepIndex === 0;
  const nextDisabled = isDone || currentStepIndex >= steps.length - 1;

  // ── Progress bar animation ────────────────────────────────────────────────
  const progressSV  = useSharedValue(1);
  const prevStepIdx = useRef(0);

  useEffect(() => {
    if (isDone) {
      progressSV.value = withTiming(0, { duration: 500 });
      prevStepIdx.current = -1;
      return;
    }
    const dur      = steps[currentStepIndex].durationSecs;
    const newValue = dur > 0 ? secsLeft / dur : 0;
    const changed  = prevStepIdx.current !== currentStepIndex;
    prevStepIdx.current = currentStepIndex;

    if (changed) {
      progressSV.value = newValue;
    } else {
      progressSV.value = withTiming(newValue, { duration: isRunning ? 950 : 0 });
    }
  }, [secsLeft, currentStepIndex, isDone]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressSV.value * 100}%` as `${number}%`,
  }));

  // ── Interval ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      const next = secsRef.current - 1;
      if (next > 0) {
        secsRef.current = next;
        setSecsLeft(next);
        if (next === WARNING_SECS) audioManager.playWarning();
        return;
      }

      advancePhase();
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  // ── Phase transitions ─────────────────────────────────────────────────────
  function advancePhase() {
    const nextIndex = currentStepIndexRef.current + 1;
    if (nextIndex >= steps.length) {
      secsRef.current = 0;
      setSecsLeft(0);
      setIsDone(true);
      setIsRunning(false);
      audioManager.playFinish();
    } else {
      const nextStep = steps[nextIndex];
      currentStepIndexRef.current = nextIndex;
      secsRef.current = nextStep.durationSecs;
      setCurrentStepIndex(nextIndex);
      setSecsLeft(nextStep.durationSecs);

      if (nextStep.phase === 'round') audioManager.playStart();
      else if (nextStep.phase === 'rest') audioManager.playRest();
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const goToStep = (index: number) => {
    if (index < 0 || index >= steps.length) return;
    const step = steps[index];
    currentStepIndexRef.current = index;
    secsRef.current = step.durationSecs;
    setCurrentStepIndex(index);
    setSecsLeft(step.durationSecs);
    setIsDone(false);
  };

  const goNext = () => goToStep(currentStepIndex + 1);

  const goPrev = () => {
    if (isRunning && steps[currentStepIndex].phase === 'round') {
      Alert.alert(
        'Go back?',
        'This will restart the previous phase.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Go back', onPress: () => goToStep(currentStepIndex - 1) },
        ],
      );
    } else {
      goToStep(currentStepIndex - 1);
    }
  };

  // ── Controls ──────────────────────────────────────────────────────────────
  function handleStart() {
    if (elapsed === 0 && !isRunning && steps[currentStepIndex].phase === 'round') {
      audioManager.playStart();
    }
    setIsRunning(true);
  }

  function handlePause() { setIsRunning(false); }

  function handleReset() {
    setIsRunning(false);
    setCurrentStepIndex(0);
    setSecsLeft(steps[0].durationSecs);
    setElapsed(0);
    setIsDone(false);
    currentStepIndexRef.current = 0;
    secsRef.current = steps[0].durationSecs;
    elapsedRef.current = 0;
  }

  function handleBack() {
    if (!isAtStart && !isDone) {
      Alert.alert('Stop workout?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }

  return (
    <LinearGradient
      colors={gradient}
      style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 32 }]}
    >
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        {showBack ? (
          <Pressable onPress={handleBack} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      {/* ── Main timer ───────────────────────────────────────────────────── */}
      <View style={styles.displayArea}>
        <Text style={[styles.timerText, { color }]}>{fmtMSS(secsLeft)}</Text>
      </View>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: color }]} />
      </View>

      {/* ── Phase row: arrows + label ─────────────────────────────────────── */}
      <View style={styles.phaseRow}>
        <ArrowButton direction="left" disabled={prevDisabled} onPress={goPrev} />
        <Text style={styles.phaseName}>{phaseLabel}</Text>
        <ArrowButton direction="right" disabled={nextDisabled} onPress={goNext} />
      </View>

      {/* ── Workout name ─────────────────────────────────────────────────── */}
      <Text style={styles.workoutSubtitle} numberOfLines={1}>{workout.name}</Text>

      {/* ── Stats row ────────────────────────────────────────────────────── */}
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

  // Top bar
  topBar: {
    height: 44,
    justifyContent: 'center',
  },
  backText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },

  // Main timer
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

  // Progress bar
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

  // Phase row
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

  // Workout subtitle
  workoutSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginBottom: 28,
  },

  // Stats row
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

  // Controls
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
