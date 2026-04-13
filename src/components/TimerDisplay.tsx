import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TimerState, formatTime, isWarning } from '../logic/timerEngine';

interface Props {
  timerState: TimerState;
}

const PHASE_COLORS: Record<string, string> = {
  idle:     '#FFFFFF',
  work:     '#FF4444',
  rest:     '#44AAFF',
  finished: '#44FF88',
};

export default function TimerDisplay({ timerState }: Props) {
  const { phase, currentRound, secondsRemaining, config } = timerState;
  const warning = isWarning(timerState);
  const color = warning ? '#FFD700' : PHASE_COLORS[phase] ?? '#FFFFFF';

  const phaseLabel =
    phase === 'work'     ? `ROUND ${currentRound} / ${config.rounds}` :
    phase === 'rest'     ? 'REST' :
    phase === 'finished' ? 'DONE' :
    'READY';

  return (
    <View style={styles.container}>
      <Text style={[styles.phaseLabel, { color }]}>{phaseLabel}</Text>
      <Text style={[styles.time, { color }]}>{formatTime(secondsRemaining)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  phaseLabel: {
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 4,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 96,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: 2,
  },
});
