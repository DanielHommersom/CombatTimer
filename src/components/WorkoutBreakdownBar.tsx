import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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

type SegmentType = keyof typeof SEGMENT_COLORS;

interface Segment {
  type:  SegmentType;
  secs:  number;
}

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

function buildSegments(
  warmUp: string,
  rounds: number,
  roundTime: string,
  rest: string,
  coolDown: string,
): Segment[] {
  const warmUpSecs   = parseTime(warmUp);
  const roundSecs    = parseTime(roundTime);
  const restSecs     = parseTime(rest);
  const coolDownSecs = parseTime(coolDown);
  const r            = Math.max(1, rounds);

  const segs: Segment[] = [];
  if (warmUpSecs > 0) segs.push({ type: 'warmUp', secs: warmUpSecs });
  for (let i = 0; i < r; i++) {
    if (roundSecs > 0) segs.push({ type: 'roundTime', secs: roundSecs });
    if (restSecs > 0 && i < r - 1) segs.push({ type: 'rest', secs: restSecs });
  }
  if (coolDownSecs > 0) segs.push({ type: 'coolDown', secs: coolDownSecs });
  return segs;
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
  const segments  = buildSegments(warmUp, rounds, roundTime, rest, coolDown);
  const totalSecs = segments.reduce((sum, s) => sum + s.secs, 0);

  const warmUpSecs   = parseTime(warmUp);
  const roundsSecs   = Math.max(1, rounds) * parseTime(roundTime);
  const restSecs     = Math.max(0, Math.max(1, rounds) - 1) * parseTime(rest);
  const coolDownSecs = parseTime(coolDown);

  return (
    <View style={styles.root}>
      {/* Total label */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{formatTime(totalSecs)}</Text>
      </View>

      {/* Segmented bar — segments in actual workout order */}
      <View style={styles.bar}>
        {totalSecs > 0 ? (
          segments.map((seg, i) => (
            <View
              key={i}
              style={[
                styles.segment,
                { flex: seg.secs, backgroundColor: SEGMENT_COLORS[seg.type] },
              ]}
            />
          ))
        ) : (
          <View style={styles.emptyBar} />
        )}
      </View>

      {/* Legend (totals per phase) */}
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
  emptyBar: {
    flex: 1,
  },
  legendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
});
