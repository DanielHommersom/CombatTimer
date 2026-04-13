import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { TimerPhase } from '../logic/timerEngine';

interface Props {
  phase: TimerPhase;
  isRunning: boolean;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
}

export default function ControlButtons({ phase, isRunning, onStart, onPause, onReset }: Props) {
  const canStart = !isRunning && phase !== 'finished';
  const canPause = isRunning;
  const canReset = phase !== 'idle';

  return (
    <View style={styles.row}>
      {canReset && (
        <Pressable style={[styles.btn, styles.resetBtn]} onPress={onReset}>
          <Text style={styles.btnText}>RESET</Text>
        </Pressable>
      )}

      {canPause ? (
        <Pressable style={[styles.btn, styles.pauseBtn]} onPress={onPause}>
          <Text style={styles.btnText}>PAUSE</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[styles.btn, styles.startBtn, !canStart && styles.disabled]}
          onPress={onStart}
          disabled={!canStart}
        >
          <Text style={styles.btnText}>{phase === 'idle' ? 'START' : 'RESUME'}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  startBtn:  { backgroundColor: '#FF4444' },
  pauseBtn:  { backgroundColor: '#FFD700' },
  resetBtn:  { backgroundColor: '#444444' },
  disabled:  { opacity: 0.4 },
  btnText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
