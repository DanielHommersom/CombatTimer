import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { TimerConfig } from '../logic/timerEngine';

export interface Preset {
  label: string;
  config: Partial<TimerConfig>;
}

interface Props {
  preset: Preset;
  isActive: boolean;
  onPress: (preset: Preset) => void;
}

export default function PresetButton({ preset, isActive, onPress }: Props) {
  return (
    <Pressable
      style={[styles.btn, isActive && styles.active]}
      onPress={() => onPress(preset)}
    >
      <Text style={[styles.label, isActive && styles.activeLabel]}>{preset.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#555555',
    backgroundColor: 'transparent',
  },
  active: {
    borderColor: '#FF4444',
    backgroundColor: '#FF444422',
  },
  label: {
    color: '#AAAAAA',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
  activeLabel: {
    color: '#FF4444',
  },
});
