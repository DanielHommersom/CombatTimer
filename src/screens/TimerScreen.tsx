import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import ControlButtons from '../components/ControlButtons';
import TimerDisplay from '../components/TimerDisplay';
import { useTimer } from '../store/TimerContext';

const GRADIENT_COLORS: Record<string, [string, string]> = {
  idle:     ['#111111', '#1A1A1A'],
  work:     ['#1A0000', '#330000'],
  rest:     ['#00101A', '#001F33'],
  finished: ['#001A0D', '#003319'],
};

export default function TimerScreen() {
  useKeepAwake();

  const { timerState, isRunning, start, pause, reset } = useTimer();
  const gradient = GRADIENT_COLORS[timerState.phase] ?? GRADIENT_COLORS.idle;

  return (
    <LinearGradient colors={gradient} style={styles.container}>
      <View style={styles.displayArea}>
        <TimerDisplay timerState={timerState} />
      </View>

      <View style={styles.controlArea}>
        <ControlButtons
          phase={timerState.phase}
          isRunning={isRunning}
          onStart={start}
          onPause={pause}
          onReset={reset}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  displayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlArea: {
    alignItems: 'center',
  },
});
