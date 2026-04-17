import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export interface TimePillProps {
  value: string;
  color: string;
  onPress: () => void;
  size?: 'sm' | 'md';
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function TimePill({ value, color, onPress, size = 'md' }: TimePillProps) {
  const pressed = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value ? 0.94 : 1, { duration: 100 }) }],
  }));

  const isSm = size === 'sm';

  return (
    <Pressable
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      onPress={onPress}
    >
      <Animated.View
        style={[
          styles.pill,
          isSm ? styles.pillSm : styles.pillMd,
          { backgroundColor: hexToRgba(color, 0.85) },
          animStyle,
        ]}
      >
        <Text style={[styles.text, isSm ? styles.textSm : styles.textMd]}>{value}</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 20,
    alignItems: 'center',
  },
  pillMd: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    minWidth: 72,
  },
  pillSm: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    minWidth: 44,
  },
  text: {
    color: '#fff',
    textAlign: 'center',
  },
  textMd: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  textSm: {
    fontSize: 11,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
});
