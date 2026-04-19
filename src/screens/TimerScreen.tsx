import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TimePickerModal from '../components/TimePickerModal';
import { PRESET_CATEGORIES, Preset } from '../data/presets';
import { Phase } from '../logic/timerEngine';
import { RootStackParamList } from '../navigation/BottomTabNavigator';
import { useTimer } from '../store/TimerContext';
import { Workout } from '../types/workout';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ─── Constants ────────────────────────────────────────────────────────────────

const ROUND_ITEM_W = 44;
const ROUNDS       = Array.from({ length: 20 }, (_, i) => i + 1);

const QT_DEFAULTS = { rounds: 6, roundTime: '3:00', rest: '1:00' };

const QUICK_PRESET_IDS = [
  'boxing-beginner',
  'boxing-amateur',
  'boxing-pro',
  'heavy-bag',
  'tabata-combat',
  'endurance',
];

const QUICK_PRESETS: Preset[] = PRESET_CATEGORIES
  .flatMap((c) => c.presets)
  .filter((p) => QUICK_PRESET_IDS.includes(p.id))
  .sort((a, b) => QUICK_PRESET_IDS.indexOf(a.id) - QUICK_PRESET_IDS.indexOf(b.id));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtMSS(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function phaseLabel(phase: Phase | null, round: number, total: number): string {
  if (phase === 'round')    return `Round ${round} of ${total}`;
  if (phase === 'rest')     return 'Rest';
  if (phase === 'warmup')   return 'Warm-up';
  if (phase === 'cooldown') return 'Cool-down';
  return '';
}

export const startWorkout = async (
  workout: Workout,
  navigation: Nav,
): Promise<void> => {
  await AsyncStorage.setItem('last_workout', JSON.stringify(workout));
  navigation.navigate('ActiveTimer', { workout });
};

const presetToWorkout = (p: Preset): Workout => ({
  id:        `preset-${p.id}-${Date.now()}`,
  name:      p.name,
  warmUp:    p.warmUp,
  rounds:    p.rounds,
  roundTime: p.roundTime,
  rest:      p.rest,
  coolDown:  p.coolDown,
  color:     p.color,
  createdAt: Date.now(),
});

// ─── RoundsPicker ─────────────────────────────────────────────────────────────

interface RoundsPickerProps {
  value: number;
  onChange: (v: number) => void;
}

function RoundsPicker({ value, onChange }: RoundsPickerProps) {
  const listRef  = useRef<FlatList>(null);
  const [width, setWidth] = useState(0);
  const padding  = width > 0 ? Math.max(0, (width - ROUND_ITEM_W) / 2) : 0;
  const didInit  = useRef(false);

  useEffect(() => {
    if (width > 0 && !didInit.current) {
      didInit.current = true;
      listRef.current?.scrollToIndex({ index: value - 1, animated: false });
    }
  }, [width]);

  const handleScrollEnd = useCallback((e: any) => {
    const idx  = Math.round(e.nativeEvent.contentOffset.x / ROUND_ITEM_W);
    const next = Math.max(1, Math.min(20, idx + 1));
    onChange(next);
  }, [onChange]);

  const renderItem = useCallback(({ item }: { item: number }) => (
    <View style={rpStyles.item}>
      <Text style={item === value ? rpStyles.selected : rpStyles.unselected}>
        {item}
      </Text>
    </View>
  ), [value]);

  return (
    <FlatList
      ref={listRef}
      data={ROUNDS}
      horizontal
      keyExtractor={String}
      showsHorizontalScrollIndicator={false}
      snapToInterval={ROUND_ITEM_W}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({
        length: ROUND_ITEM_W,
        offset: ROUND_ITEM_W * index,
        index,
      })}
      contentContainerStyle={{ paddingHorizontal: padding }}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      onMomentumScrollEnd={handleScrollEnd}
      renderItem={renderItem}
    />
  );
}

const rpStyles = StyleSheet.create({
  item: {
    width: ROUND_ITEM_W,
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  selected: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  unselected: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.25)',
    fontVariant: ['tabular-nums'],
  },
});

// ─── TimerScreen ──────────────────────────────────────────────────────────────

type PickerField = 'roundTime' | 'rest' | null;

export default function TimerScreen() {
  const navigation = useNavigation<Nav>();
  const insets     = useSafeAreaInsets();

  const {
    isRunning,
    activeWorkout,
    currentPhase,
    currentRound,
    totalRounds,
    secsLeft: storeSecsLeft,
  } = useTimer();

  // ── Last session ────────────────────────────────────────────────────────────
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null);

  // ── Quick timer ─────────────────────────────────────────────────────────────
  const [qtRounds,     setQtRounds]    = useState(QT_DEFAULTS.rounds);
  const [qtRoundTime,  setQtRoundTime] = useState(QT_DEFAULTS.roundTime);
  const [qtRest,       setQtRest]      = useState(QT_DEFAULTS.rest);
  const [activePicker, setActivePicker] = useState<PickerField>(null);

  // ── Load from AsyncStorage ──────────────────────────────────────────────────
  useEffect(() => {
    AsyncStorage.multiGet(['last_workout', 'quick_timer']).then(([[, lw], [, qt]]) => {
      if (lw) {
        try { setLastWorkout(JSON.parse(lw)); } catch {}
      }
      if (qt) {
        try {
          const saved = JSON.parse(qt);
          if (saved.rounds)    setQtRounds(saved.rounds);
          if (saved.roundTime) setQtRoundTime(saved.roundTime);
          if (saved.rest)      setQtRest(saved.rest);
        } catch {}
      }
    });
  }, []);

  // ── Persist quick timer ──────────────────────────────────────────────────────
  const saveQuickTimer = useCallback(
    (rounds: number, roundTime: string, rest: string) => {
      AsyncStorage.setItem('quick_timer', JSON.stringify({ rounds, roundTime, rest }));
    },
    [],
  );

  const handleRoundsChange = (v: number) => {
    setQtRounds(v);
    saveQuickTimer(v, qtRoundTime, qtRest);
  };

  const handleRoundTimeConfirm = (v: string) => {
    setQtRoundTime(v);
    setActivePicker(null);
    saveQuickTimer(qtRounds, v, qtRest);
  };

  const handleRestConfirm = (v: string) => {
    setQtRest(v);
    setActivePicker(null);
    saveQuickTimer(qtRounds, qtRoundTime, v);
  };

  // ── Unified launch ────────────────────────────────────────────────────────
  const launch = useCallback((workout: Workout) => {
    startWorkout(workout, navigation);
  }, [navigation]);

  const handleQuickStart = () => {
    launch({
      id:        `quick-${Date.now()}`,
      name:      'Quick Timer',
      warmUp:    '0:00',
      rounds:    qtRounds,
      roundTime: qtRoundTime,
      rest:      qtRest,
      coolDown:  '0:00',
      color:     '#ffffff',
      createdAt: Date.now(),
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Active session banner ───────────────────────────────────────────── */}
      {isRunning && activeWorkout && (
        <Pressable
          style={styles.banner}
          onPress={() => navigation.navigate('ActiveTimer', { workout: activeWorkout })}
        >
          <Text style={styles.bannerBullet}>●</Text>
          <Text style={styles.bannerLabel}>
            {phaseLabel(currentPhase, currentRound, totalRounds)}
            {'  —  '}
            <Text style={styles.bannerTime}>{fmtMSS(storeSecsLeft)}</Text>
          </Text>
          <Text style={styles.bannerArrow}>›</Text>
        </Pressable>
      )}

      {/* ── Scrollable content ──────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
      >
        {/* ── Last session ─────────────────────────────────────────────────── */}
        {lastWorkout && (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Last session</Text>
            <Text style={styles.cardName}>{lastWorkout.name}</Text>
            <Text style={styles.cardMeta}>
              {lastWorkout.rounds} rounds · {lastWorkout.roundTime} · {lastWorkout.rest} rest
            </Text>
            <Pressable
              style={styles.startBtn}
              onPress={() => launch(lastWorkout)}
            >
              <Text style={styles.startBtnText}>▶  Start again</Text>
            </Pressable>
          </View>
        )}

        {/* ── Quick timer ──────────────────────────────────────────────────── */}
        <View style={[styles.card, styles.cardGap]}>
          <Text style={styles.cardLabel}>Quick timer</Text>

          <View style={styles.fieldsRow}>
            <View style={styles.field}>
              <RoundsPicker value={qtRounds} onChange={handleRoundsChange} />
              <Text style={styles.fieldLabel}>Rounds</Text>
            </View>

            <Pressable style={styles.field} onPress={() => setActivePicker('roundTime')}>
              <Text style={styles.fieldValue}>{qtRoundTime}</Text>
              <Text style={styles.fieldLabel}>Round</Text>
            </Pressable>

            <Pressable style={styles.field} onPress={() => setActivePicker('rest')}>
              <Text style={styles.fieldValue}>{qtRest}</Text>
              <Text style={styles.fieldLabel}>Rest</Text>
            </Pressable>
          </View>

          <Pressable style={styles.startBtnLarge} onPress={handleQuickStart}>
            <Text style={styles.startBtnLargeText}>▶  Start</Text>
          </Pressable>
        </View>

        {/* ── Quick start presets ──────────────────────────────────────────── */}
        <View style={styles.presetsSection}>
          <Text style={styles.presetsLabel}>Quick start</Text>
          <FlatList
            data={QUICK_PRESETS}
            horizontal
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsContent}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.presetCard, { borderTopColor: item.color }]}
                onPress={() => launch(presetToWorkout(item))}
              >
                <Text style={styles.presetName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.presetMeta}>{item.rounds} × {item.roundTime}</Text>
              </Pressable>
            )}
          />
        </View>
      </ScrollView>

      {/* ── Time pickers ─────────────────────────────────────────────────────── */}
      <TimePickerModal
        visible={activePicker === 'roundTime'}
        value={qtRoundTime}
        color="#34c759"
        label="Round time"
        onConfirm={handleRoundTimeConfirm}
        onClose={() => setActivePicker(null)}
      />
      <TimePickerModal
        visible={activePicker === 'rest'}
        value={qtRest}
        color="#ff453a"
        label="Rest"
        onConfirm={handleRestConfirm}
        onClose={() => setActivePicker(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },

  // ── Active session banner ────────────────────────────────────────────────────
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
    backgroundColor: 'rgba(52,199,89,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(52,199,89,0.3)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  bannerBullet: {
    fontSize: 10,
    color: '#34c759',
  },
  bannerLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  bannerTime: {
    color: '#34c759',
  },
  bannerArrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
  },

  // ── Card ────────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  cardGap: {
    marginTop: 12,
  },
  cardLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.07 * 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 14,
  },

  // ── Last session ────────────────────────────────────────────────────────────
  cardName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  startBtn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  startBtnText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Quick timer fields ───────────────────────────────────────────────────────
  fieldsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  field: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fieldValue: {
    fontSize: 22,
    fontWeight: '500',
    color: '#fff',
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    lineHeight: 40,
  },
  fieldLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Quick timer start ────────────────────────────────────────────────────────
  startBtnLarge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  startBtnLargeText: {
    color: '#111',
    fontSize: 15,
    fontWeight: '500',
  },

  // ── Presets ──────────────────────────────────────────────────────────────────
  presetsSection: {
    marginTop: 20,
    marginHorizontal: -20,
  },
  presetsLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.07 * 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 12,
    marginHorizontal: 20,
  },
  presetsContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  presetCard: {
    width: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopWidth: 3,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 14,
  },
  presetName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  presetMeta: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.35)',
    marginTop: 4,
  },
});
