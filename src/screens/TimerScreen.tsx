import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { audioManager } from '../logic/audioManager';
import { WorkoutPhase, formatTime, parseTime } from '../logic/timerEngine';
import { RootStackParamList } from '../navigation/BottomTabNavigator';

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, 'ActiveTimer'>;

// ─── Gradient map ─────────────────────────────────────────────────────────────

const GRADIENTS: Record<WorkoutPhase, [string, string]> = {
  ready:    ['#111111', '#1a1a1a'],
  warmup:   ['#1a0d00', '#331a00'],
  work:     ['#1a0000', '#330000'],
  rest:     ['#00101a', '#001f33'],
  cooldown: ['#0a001a', '#150033'],
  done:     ['#001a0d', '#003319'],
};

// ─── Phase label ──────────────────────────────────────────────────────────────

function phaseLabel(phase: WorkoutPhase, round: number, total: number): string {
  switch (phase) {
    case 'ready':    return 'READY';
    case 'warmup':   return 'WARM UP';
    case 'work':     return `ROUND ${round} / ${total}`;
    case 'rest':     return 'REST';
    case 'cooldown': return 'COOL DOWN';
    case 'done':     return 'DONE';
  }
}

// ─── Warning threshold ────────────────────────────────────────────────────────

const WARNING_SECS = 10;

// ─── TimerScreen ──────────────────────────────────────────────────────────────

export default function TimerScreen({ route, navigation }: Props) {
  useKeepAwake();

  const insets = useSafeAreaInsets();
  const { workout } = route.params;

  // ── Constants derived from workout (never change) ─────────────────────────
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

  // Refs keep interval callback in sync without stale closures
  const phaseRef    = useRef(initialPhase);
  const secsRef     = useRef(initialSecs);
  const roundRef    = useRef(1);
  const runningRef  = useRef(false);

  phaseRef.current   = phase;
  secsRef.current    = secsLeft;
  roundRef.current   = currentRound;
  runningRef.current = isRunning;

  // ── Interval ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) return;

    const id = setInterval(() => {
      const next = secsRef.current - 1;
      if (next > 0) {
        secsRef.current = next;
        setSecsLeft(next);

        // Warning cue
        if (next === WARNING_SECS) audioManager.playWarning();
        return;
      }

      // next === 0 → transition
      advancePhase();
    }, 1000);

    return () => clearInterval(id);
  }, [isRunning]);

  // ── Phase transitions ────────────────────────────────────────────────────
  function set(
    newPhase: WorkoutPhase,
    newSecs: number,
    newRound = roundRef.current,
  ) {
    phaseRef.current  = newPhase;
    secsRef.current   = newSecs;
    roundRef.current  = newRound;
    setPhase(newPhase);
    setSecsLeft(newSecs);
    setCurrentRound(newRound);
  }

  function advancePhase() {
    const p = phaseRef.current;
    const r = roundRef.current;

    switch (p) {
      case 'warmup':
        set('work', roundSecs, 1);
        audioManager.playStart();
        break;

      case 'work': {
        const isLast = r >= totalRounds;
        if (!isLast) {
          if (restSecs > 0) {
            set('rest', restSecs);
            audioManager.playRest();
          } else {
            set('work', roundSecs, r + 1);
            audioManager.playStart();
          }
        } else {
          // Last round finished
          if (coolDownSecs > 0) {
            set('cooldown', coolDownSecs);
          } else {
            finish();
          }
        }
        break;
      }

      case 'rest':
        set('work', roundSecs, r + 1);
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
    } else if (phase === 'warmup') {
      audioManager.playStart();
    }
    setIsRunning(true);
  }

  function handlePause() {
    setIsRunning(false);
  }

  function handleReset() {
    setIsRunning(false);
    phaseRef.current  = initialPhase;
    secsRef.current   = initialSecs;
    roundRef.current  = 1;
    setPhase(initialPhase);
    setSecsLeft(initialSecs);
    setCurrentRound(1);
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

  // ── Derived display values ────────────────────────────────────────────────
  const gradient = GRADIENTS[phase];
  const isActive = phase !== 'ready' && phase !== 'done';
  const isWarn   = isActive && secsLeft <= WARNING_SECS && secsLeft > 0;
  const timeColor = isWarn ? '#ffd60a' : '#ffffff';
  const label     = phaseLabel(phase, currentRound, totalRounds);
  const showBack  = phase === 'ready' || phase === 'done';
  const showReset = isActive || phase === 'done';

  return (
    <LinearGradient colors={gradient} style={[styles.container, { paddingTop: insets.top }]}>

      {/* Back button — only in ready / done */}
      <View style={styles.topBar}>
        {showBack ? (
          <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>
        ) : (
          /* Invisible placeholder keeps layout stable */
          <View style={styles.backBtn} />
        )}
      </View>

      {/* Workout name */}
      <Text style={styles.workoutName} numberOfLines={1}>{workout.name}</Text>

      {/* Main display */}
      <View style={styles.displayArea}>
        <Text style={styles.phaseLabel}>{label}</Text>
        <Text style={[styles.time, { color: timeColor }]}>{formatTime(secsLeft)}</Text>
      </View>

      {/* Controls */}
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
            <Text style={styles.primaryBtnText}>
              {phase === 'ready' || (initialPhase === 'warmup' && phase === 'warmup' && secsLeft === initialSecs)
                ? 'START'
                : 'RESUME'}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  topBar: {
    height: 44,
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  backText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  workoutName: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  displayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  phaseLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 4,
  },
  time: {
    fontSize: 96,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  primaryBtn: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 8,
    minWidth: 140,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#111',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
  secondaryBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  secondaryBtnText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 2,
  },
});
