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
  CalcRemainingState,
  WorkoutPhase,
  calcRemaining,
  parseTime,
} from '../logic/timerEngine';
import { RootStackParamList } from '../navigation/BottomTabNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTimer'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const WARNING_SECS = 10;

const PHASE_COLOR: Record<WorkoutPhase, string> = {
  ready:    '#ffffff',
  warmup:   '#ffd60a',
  work:     '#34c759',
  rest:     '#ff453a',
  cooldown: '#0a84ff',
  done:     'rgba(255,255,255,0.4)',
};

const GRADIENT: Record<WorkoutPhase, [string, string]> = {
  ready:    ['#111111', '#161616'],
  warmup:   ['#111111', '#1a1400'],
  work:     ['#111111', '#0d1a0d'],
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

function phaseName(phase: WorkoutPhase, round: number): string {
  switch (phase) {
    case 'ready':    return 'Ready';
    case 'warmup':   return 'Warm-up';
    case 'work':     return `Round ${round}`;
    case 'rest':     return 'Rest';
    case 'cooldown': return 'Cooling down';
    case 'done':     return 'Done';
  }
}

// ─── TimerScreen ──────────────────────────────────────────────────────────────

export default function TimerScreen({ route, navigation }: Props) {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { workout } = route.params;

  // ── Workout constants ─────────────────────────────────────────────────────
  const totalRounds  = workout.rounds;
  const warmUpSecs   = parseTime(workout.warmUp);
  const roundSecs    = parseTime(workout.roundTime);
  const restSecs     = parseTime(workout.rest);
  const coolDownSecs = parseTime(workout.coolDown);

  const initialPhase: WorkoutPhase = warmUpSecs > 0 ? 'warmup' : 'ready';
  const initialSecs                = warmUpSecs > 0 ? warmUpSecs : roundSecs;

  // ── Timer state ───────────────────────────────────────────────────────────
  const [phase, setPhase]               = useState<WorkoutPhase>(initialPhase);
  const [currentRound, setCurrentRound] = useState(1);
  const [secsLeft, setSecsLeft]         = useState(initialSecs);
  const [isRunning, setIsRunning]       = useState(false);
  const [elapsed, setElapsed]           = useState(0);

  // Refs for interval (avoid stale closures)
  const phaseRef    = useRef(initialPhase);
  const secsRef     = useRef(initialSecs);
  const roundRef    = useRef(1);
  const elapsedRef  = useRef(0);

  phaseRef.current  = phase;
  secsRef.current   = secsLeft;
  roundRef.current  = currentRound;

  // ── Progress bar animation ────────────────────────────────────────────────
  const progressSV   = useSharedValue(1);
  const prevPhase    = useRef(initialPhase);

  function getPhaseDuration(p: WorkoutPhase): number {
    switch (p) {
      case 'warmup':   return warmUpSecs;
      case 'work':
      case 'ready':    return roundSecs;
      case 'rest':     return restSecs;
      case 'cooldown': return coolDownSecs;
      default:         return 0;
    }
  }

  useEffect(() => {
    const dur      = getPhaseDuration(phase);
    const newValue = dur > 0 ? secsLeft / dur : 0;
    const changed  = prevPhase.current !== phase;
    prevPhase.current = phase;

    if (changed) {
      // Instant reset to full on phase change
      progressSV.value = newValue;
    } else {
      progressSV.value = withTiming(newValue, { duration: isRunning ? 950 : 0 });
    }
  }, [secsLeft, phase]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressSV.value * 100}%` as `${number}%`,
  }));

  // ── Interval ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      // Elapsed
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);

      // Countdown
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

  // ── Phase transitions ────────────────────────────────────────────────────
  function setState(
    newPhase: WorkoutPhase,
    newSecs: number,
    newRound = roundRef.current,
  ) {
    phaseRef.current = newPhase;
    secsRef.current  = newSecs;
    roundRef.current = newRound;
    setPhase(newPhase);
    setSecsLeft(newSecs);
    setCurrentRound(newRound);
  }

  function advancePhase() {
    const p = phaseRef.current;
    const r = roundRef.current;

    switch (p) {
      case 'warmup':
        setState('work', roundSecs, 1);
        audioManager.playStart();
        break;

      case 'work': {
        const isLast = r >= totalRounds;
        if (!isLast) {
          if (restSecs > 0) {
            setState('rest', restSecs);
            audioManager.playRest();
          } else {
            setState('work', roundSecs, r + 1);
            audioManager.playStart();
          }
        } else {
          if (coolDownSecs > 0) {
            setState('cooldown', coolDownSecs);
          } else {
            finish();
          }
        }
        break;
      }

      case 'rest':
        setState('work', roundSecs, r + 1);
        audioManager.playStart();
        break;

      case 'cooldown':
        finish();
        break;
    }
  }

  function finish() {
    phaseRef.current = 'done';
    secsRef.current  = 0;
    setPhase('done');
    setSecsLeft(0);
    setIsRunning(false);
    audioManager.playFinish();
  }

  // ── Controls ──────────────────────────────────────────────────────────────
  function handleStart() {
    if (phase === 'ready') {
      phaseRef.current = 'work';
      setPhase('work');
      audioManager.playStart();
    }
    setIsRunning(true);
  }

  function handlePause() { setIsRunning(false); }

  function handleReset() {
    setIsRunning(false);
    phaseRef.current  = initialPhase;
    secsRef.current   = initialSecs;
    roundRef.current  = 1;
    elapsedRef.current = 0;
    setPhase(initialPhase);
    setSecsLeft(initialSecs);
    setCurrentRound(1);
    setElapsed(0);
  }

  function handleBack() {
    const isActive = phase !== 'ready' && phase !== 'done';
    if (isActive) {
      Alert.alert('Stop workout?', undefined, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Stop', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }

  // ── Derived values ────────────────────────────────────────────────────────
  const color    = PHASE_COLOR[phase];
  const gradient = GRADIENT[phase];
  const isActive = phase !== 'ready' && phase !== 'done';
  const showBack  = phase === 'ready' || phase === 'done';
  const showReset = isActive || phase === 'done';

  const remainingState: CalcRemainingState = {
    phase,
    secsLeft,
    totalRounds,
    currentRound,
    roundSecs,
    restSecs,
    coolDownSecs,
  };
  const remaining = calcRemaining(remainingState);

  const isFirstStart =
    phase === 'ready' ||
    (phase === initialPhase && secsLeft === initialSecs && !isRunning);

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

      {/* ── Phase header ─────────────────────────────────────────────────── */}
      <View style={styles.phaseHeader}>
        <Text style={styles.phaseName}>{phaseName(phase, currentRound)}</Text>
        <Text style={styles.workoutSubtitle} numberOfLines={1}>{workout.name}</Text>
      </View>

      {/* ── Main timer ───────────────────────────────────────────────────── */}
      <View style={styles.displayArea}>
        <Text style={[styles.timerText, { color }]}>{fmtMSS(secsLeft)}</Text>
      </View>

      {/* ── Progress bar ─────────────────────────────────────────────────── */}
      <View style={styles.progressBg}>
        <Animated.View style={[styles.progressFill, progressStyle, { backgroundColor: color }]} />
      </View>

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
        ) : phase !== 'done' ? (
          <Pressable style={styles.primaryBtn} onPress={handleStart}>
            <Text style={styles.primaryBtnText}>{isFirstStart ? 'START' : 'RESUME'}</Text>
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

  // Phase header
  phaseHeader: {
    marginBottom: 4,
  },
  phaseName: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '500',
  },
  workoutSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    fontWeight: '400',
    marginTop: 2,
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
    marginBottom: 28,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
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
