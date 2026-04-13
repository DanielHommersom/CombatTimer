import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TabParamList } from '../navigation/BottomTabNavigator';
import { DEFAULT_CONFIG, TimerConfig } from '../logic/timerEngine';
import { useTimer } from '../store/TimerContext';

type NavProp = BottomTabNavigationProp<TabParamList, 'Workout'>;

export default function WorkoutScreen() {
  const { config, setConfig } = useTimer();
  const navigation = useNavigation<NavProp>();

  const [rounds, setRounds]   = useState(String(config.rounds));
  const [workMin, setWorkMin] = useState(String(Math.floor(config.workDuration / 60)));
  const [workSec, setWorkSec] = useState(String(config.workDuration % 60));
  const [restMin, setRestMin] = useState(String(Math.floor(config.restDuration / 60)));
  const [restSec, setRestSec] = useState(String(config.restDuration % 60));
  const [warnSec, setWarnSec] = useState(String(config.warningSeconds));

  function handleSave() {
    const parsed: Partial<TimerConfig> = {
      rounds:         clamp(parseInt(rounds) || DEFAULT_CONFIG.rounds, 1, 99),
      workDuration:   (parseInt(workMin) || 0) * 60 + (parseInt(workSec) || 0) || DEFAULT_CONFIG.workDuration,
      restDuration:   (parseInt(restMin) || 0) * 60 + (parseInt(restSec) || 0),
      warningSeconds: clamp(parseInt(warnSec) || DEFAULT_CONFIG.warningSeconds, 0, 60),
    };
    setConfig(parsed);
    navigation.navigate('Timer');
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>CUSTOMIZE</Text>

      <Field label="ROUNDS">
        <NumberInput value={rounds} onChange={setRounds} min={1} max={99} />
      </Field>

      <Field label="WORK TIME">
        <View style={styles.timeRow}>
          <NumberInput value={workMin} onChange={setWorkMin} min={0} max={59} suffix="min" />
          <NumberInput value={workSec} onChange={setWorkSec} min={0} max={59} suffix="sec" />
        </View>
      </Field>

      <Field label="REST TIME">
        <View style={styles.timeRow}>
          <NumberInput value={restMin} onChange={setRestMin} min={0} max={59} suffix="min" />
          <NumberInput value={restSec} onChange={setRestSec} min={0} max={59} suffix="sec" />
        </View>
      </Field>

      <Field label="WARNING (seconds before end)">
        <NumberInput value={warnSec} onChange={setWarnSec} min={0} max={60} suffix="sec" />
      </Field>

      <Pressable style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>SAVE & START</Text>
      </Pressable>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

function NumberInput({
  value, onChange, min, max, suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  min: number;
  max: number;
  suffix?: string;
}) {
  return (
    <View style={styles.numInputRow}>
      <Pressable
        style={styles.stepBtn}
        onPress={() => onChange(String(clamp((parseInt(value) || 0) - 1, min, max)))}
      >
        <Text style={styles.stepBtnText}>−</Text>
      </Pressable>

      <TextInput
        style={styles.numInput}
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={3}
        selectTextOnFocus
      />

      <Pressable
        style={styles.stepBtn}
        onPress={() => onChange(String(clamp((parseInt(value) || 0) + 1, min, max)))}
      >
        <Text style={styles.stepBtnText}>+</Text>
      </Pressable>

      {suffix && <Text style={styles.suffix}>{suffix}</Text>}
    </View>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#111111',
    padding: 24,
    paddingTop: 60,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 5,
    marginBottom: 32,
  },
  field: {
    marginBottom: 28,
  },
  fieldLabel: {
    color: '#666666',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 3,
    marginBottom: 10,
  },
  timeRow: {
    flexDirection: 'row',
    gap: 16,
  },
  numInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 6,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    color: '#FFFFFF',
    fontSize: 22,
    lineHeight: 26,
    fontWeight: '600',
  },
  numInput: {
    width: 64,
    height: 40,
    backgroundColor: '#1A1A1A',
    borderRadius: 6,
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#333333',
  },
  suffix: {
    color: '#666666',
    fontSize: 13,
    marginLeft: 4,
  },
  saveBtn: {
    marginTop: 16,
    backgroundColor: '#FF4444',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
