import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import PresetButton, { Preset } from '../components/PresetButton';
import { TimerConfig } from '../logic/timerEngine';
import { Screen } from '../store/useTimerStore';

interface Props {
  config: TimerConfig;
  onApplyPreset: (preset: Partial<TimerConfig>) => void;
  onNavigate: (screen: Screen) => void;
}

const PRESETS: Preset[] = [
  { label: '3×3 Boxing',  config: { workDuration: 180, restDuration: 60, rounds: 3 } },
  { label: '5×3 MMA',     config: { workDuration: 300, restDuration: 60, rounds: 5 } },
  { label: '12×3 Muay',   config: { workDuration: 180, restDuration: 60, rounds: 12 } },
  { label: 'Tabata',      config: { workDuration: 20,  restDuration: 10, rounds: 8 } },
  { label: '10×1 Bursts', config: { workDuration: 60,  restDuration: 30, rounds: 10 } },
];

function matchesPreset(config: TimerConfig, preset: Partial<TimerConfig>): boolean {
  return (Object.keys(preset) as (keyof TimerConfig)[]).every(
    (k) => config[k] === preset[k]
  );
}

export default function HomeScreen({ config, onApplyPreset, onNavigate }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>COMBAT TIMER</Text>

      <Text style={styles.sectionLabel}>QUICK PRESETS</Text>
      <View style={styles.presetRow}>
        {PRESETS.map((preset) => (
          <PresetButton
            key={preset.label}
            preset={preset}
            isActive={matchesPreset(config, preset.config)}
            onPress={(p) => onApplyPreset(p.config)}
          />
        ))}
      </View>

      <View style={styles.summary}>
        <SummaryRow label="Rounds"    value={String(config.rounds)} />
        <SummaryRow label="Work"      value={fmtSec(config.workDuration)} />
        <SummaryRow label="Rest"      value={fmtSec(config.restDuration)} />
        <SummaryRow label="Warning"   value={`${config.warningSeconds}s`} />
      </View>

      <View style={styles.navRow}>
        <NavButton label="CUSTOMIZE" onPress={() => onNavigate('workout')} />
        <NavButton label="START"     onPress={() => onNavigate('timer')}   primary />
      </View>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}

import { Pressable } from 'react-native';

function NavButton({
  label,
  onPress,
  primary,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      style={[styles.navBtn, primary && styles.navBtnPrimary]}
      onPress={onPress}
    >
      <Text style={styles.navBtnText}>{label}</Text>
    </Pressable>
  );
}

function fmtSec(s: number): string {
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem === 0 ? `${m}m` : `${m}m ${rem}s`;
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#111111',
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 6,
    marginTop: 48,
    marginBottom: 40,
  },
  sectionLabel: {
    color: '#666666',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 3,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  presetRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  summary: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 10,
    padding: 16,
    gap: 12,
    marginBottom: 40,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    color: '#888888',
    fontSize: 15,
  },
  summaryValue: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    gap: 16,
  },
  navBtn: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#444444',
    backgroundColor: 'transparent',
  },
  navBtnPrimary: {
    backgroundColor: '#FF4444',
    borderColor: '#FF4444',
  },
  navBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
