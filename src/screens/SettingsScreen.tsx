import Slider from '@react-native-community/slider';
import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../hooks/useSettings';
import { audioManager } from '../logic/audioManager';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { soundsEnabled, setSoundsEnabled, volume, setVolume, vibrationEnabled, setVibrationEnabled } = useSettings();

  const handleSoundsToggle = (value: boolean) => {
    setSoundsEnabled(value);
    audioManager.setEnabled(value);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Text style={styles.screenTitle}>SETTINGS</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SOUND</Text>

        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Timer sounds</Text>
            <Text style={styles.rowSub}>Beeps for rounds, rest & warnings</Text>
          </View>
          <Switch
            value={soundsEnabled}
            onValueChange={handleSoundsToggle}
            trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#34c759' }}
            thumbColor="#ffffff"
          />
        </View>

        {soundsEnabled && (
          <View style={styles.sliderRow}>
            <Text style={styles.sliderLabel}>Volume</Text>
            <Slider
              style={styles.slider}
              value={volume}
              minimumValue={0}
              maximumValue={1}
              step={0.05}
              onValueChange={setVolume}
              minimumTrackTintColor="#ffffff"
              maximumTrackTintColor="rgba(255,255,255,0.15)"
              thumbTintColor="#ffffff"
            />
            <Text style={styles.sliderValue}>{Math.round(volume * 100)}%</Text>
          </View>
        )}

        <View style={[styles.row, styles.rowTop]}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Vibration</Text>
            <Text style={styles.rowSub}>Haptic feedback on phase changes</Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#34c759' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#111111',
    paddingHorizontal: 20,
  },
  screenTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 5,
    marginTop: 16,
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 2,
  },
  rowContent: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
  rowSub: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sliderLabel: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    width: 60,
  },
  slider: {
    flex: 1,
    height: 36,
  },
  rowTop: {
    marginTop: 2,
  },
  sliderValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    width: 38,
    textAlign: 'right',
  },
});
