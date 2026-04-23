import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Phase } from '../logic/timerEngine';
import { RootStackParamList } from '../navigation/BottomTabNavigator';
import { useTimer } from '../store/TimerContext';

type Nav = NativeStackNavigationProp<RootStackParamList>;

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

export default function ActiveTimerBanner() {
  const navigation = useNavigation<Nav>();
  const { isRunning, activeWorkout, currentPhase, currentRound, totalRounds, secsLeft } = useTimer();

  if (!isRunning || !activeWorkout) return null;

  return (
    <Pressable
      style={styles.banner}
      onPress={() => navigation.navigate('ActiveTimer', { workout: activeWorkout })}
    >
      <Text style={styles.bullet}>●</Text>
      <Text style={styles.label}>
        {phaseLabel(currentPhase, currentRound, totalRounds)}
        {'  —  '}
        <Text style={styles.time}>{fmtMSS(secsLeft)}</Text>
      </Text>
      <Text style={styles.arrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  bullet: {
    fontSize: 10,
    color: '#34c759',
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#fff',
  },
  time: {
    color: '#34c759',
  },
  arrow: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.4)',
  },
});
