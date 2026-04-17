import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface WorkoutBreakdownBarProps {
  warmUp:    string;
  rounds:    number;
  roundTime: string;
  rest:      string;
  coolDown:  string;
}

const SEGMENT_COLORS = {
  warmUp:    '#ffd60a',
  roundTime: '#ff453a',
  rest:      '#34c759',
  coolDown:  '#0a84ff',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTime(str: string): number {
  if (!str || !str.includes(':')) return 0;
  const [m, s] = str.split(':').map((n) => parseInt(n) || 0);
  return m * 60 + s;
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ─── LegendItem ───────────────────────────────────────────────────────────────

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={legend.item}>
      <View style={[legend.dot, { backgroundColor: color }]} />
      <Text style={legend.label}>{label}</Text>
      <Text style={legend.value}>{value}</Text>
    </View>
  );
}

const legend = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  value: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    fontVariant: ['tabular-nums'],
  },
});

// ─── WorkoutBreakdownBar ──────────────────────────────────────────────────────

export default function WorkoutBreakdownBar({
  warmUp,
  rounds,
  roundTime,
  rest,
  coolDown,
}: WorkoutBreakdownBarProps) {
  const warmUpSecs   = parseTime(warmUp);
  const roundsSecs   = rounds * parseTime(roundTime);
  const restSecs     = Math.max(0, rounds - 1) * parseTime(rest);
  const coolDownSecs = parseTime(coolDown);
  const totalSecs    = warmUpSecs + roundsSecs + restSecs + coolDownSecs;

  const toPercent = (secs: number) => (totalSecs > 0 ? (secs / totalSecs) * 100 : 0);

  const warmUpW   = useSharedValue(toPercent(warmUpSecs));
  const roundsW   = useSharedValue(toPercent(roundsSecs));
  const restW     = useSharedValue(toPercent(restSecs));
  const coolDownW = useSharedValue(toPercent(coolDownSecs));

  useEffect(() => {
    warmUpW.value   = withTiming(toPercent(warmUpSecs),   { duration: 300 });
    roundsW.value   = withTiming(toPercent(roundsSecs),   { duration: 300 });
    restW.value     = withTiming(toPercent(restSecs),     { duration: 300 });
    coolDownW.value = withTiming(toPercent(coolDownSecs), { duration: 300 });
  }, [warmUpSecs, roundsSecs, restSecs, coolDownSecs]);

  const warmUpStyle   = useAnimatedStyle(() => ({ width: `${warmUpW.value}%`   as `${number}%` }));
  const roundsStyle   = useAnimatedStyle(() => ({ width: `${roundsW.value}%`   as `${number}%` }));
  const restStyle     = useAnimatedStyle(() => ({ width: `${restW.value}%`     as `${number}%` }));
  const coolDownStyle = useAnimatedStyle(() => ({ width: `${coolDownW.value}%` as `${number}%` }));

  return (
    <View style={styles.root}>
      {/* Total label */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatTime(totalSecs)}</Text>
      </View>

      {/* Segmented bar */}
      <View style={styles.bar}>
        <Animated.View style={[styles.segment, { backgroundColor: SEGMENT_COLORS.warmUp },    warmUpStyle]}   />
        <Animated.View style={[styles.segment, { backgroundColor: SEGMENT_COLORS.roundTime }, roundsStyle]}   />
        <Animated.View style={[styles.segment, { backgroundColor: SEGMENT_COLORS.rest },      restStyle]}     />
        <Animated.View style={[styles.segment, { backgroundColor: SEGMENT_COLORS.coolDown },  coolDownStyle]} />
      </View>

      {/* Legend */}
      {totalSecs > 0 && (
        <View style={styles.legendRow}>
          {warmUpSecs   > 0 && <LegendItem color={SEGMENT_COLORS.warmUp}    label="Warm-up"   value={formatTime(warmUpSecs)}   />}
          {roundsSecs   > 0 && <LegendItem color={SEGMENT_COLORS.roundTime} label="Rounds"    value={formatTime(roundsSecs)}   />}
          {restSecs     > 0 && <LegendItem color={SEGMENT_COLORS.rest}      label="Rest"      value={formatTime(restSecs)}     />}
          {coolDownSecs > 0 && <LegendItem color={SEGMENT_COLORS.coolDown}  label="Cool-down" value={formatTime(coolDownSecs)} />}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  totalLabel: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  totalValue: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  bar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
    width: '100%',
  },
  segment: {
    height: '100%',
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
