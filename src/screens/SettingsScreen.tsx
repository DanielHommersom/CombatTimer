import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BELL_SOUNDS } from '../data/bellSounds';
import { useSettings } from '../hooks/useSettings';
import ActiveTimerBanner from '../components/ActiveTimerBanner';
import { previewBellSound } from '../logic/audioManager';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    soundsEnabled, setSoundsEnabled,
    volume, setVolume,
    vibrationEnabled, setVibrationEnabled,
    bellSound, setBellSound,
  } = useSettings();

  const handleSoundsToggle = (value: boolean) => {
    setSoundsEnabled(value);
  };

  return (
    <View style={[styles.outer, { paddingTop: insets.top }]}>
      <ActiveTimerBanner />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
      <Text style={styles.screenTitle}>SETTINGS</Text>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SOUND</Text>

        {/* Timer sounds toggle */}
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

        {/* Volume slider */}
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

        {/* Bell sound selector */}
        <View style={styles.bellSection}>
          <Text style={styles.bellLabel}>Bell sound</Text>
          <View style={styles.bellCards}>
            {BELL_SOUNDS.map((bell, idx) => {
              const selected = bellSound === bell.id;
              return (
                <View key={bell.id} style={idx < BELL_SOUNDS.length - 1 ? styles.bellCardWrap : styles.bellCardWrapLast}>
                  <Pressable
                    style={[styles.bellCard, selected && styles.bellCardSelected]}
                    onPress={() => setBellSound(bell.id)}
                  >
                    <Text style={styles.bellCardLabel}>{bell.label}</Text>
                    <Text style={styles.bellCardDesc}>{bell.description}</Text>
                  </Pressable>
                  <Pressable
                    style={styles.previewBtn}
                    onPress={() => previewBellSound(bell.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="volume-medium-outline" size={14} color="rgba(255,255,255,0.4)" />
                  </Pressable>
                </View>
              );
            })}
          </View>
        </View>

        {/* Vibration toggle */}
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
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: '#111111',
  },
  root: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  rowTop: {
    marginTop: 2,
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
    marginBottom: 2,
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
  sliderValue: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: '500',
    width: 38,
    textAlign: 'right',
  },
  // ── Bell sound ────────────────────────────────────────────────────────────────
  bellSection: {
    marginBottom: 2,
    marginTop: 2,
  },
  bellLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 4,
  },
  bellCards: {
    flexDirection: 'row',
    gap: 6,
  },
  bellCardWrap: {
    flex: 1,
    gap: 4,
  },
  bellCardWrapLast: {
    flex: 1,
    gap: 4,
  },
  bellCard: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bellCardSelected: {
    backgroundColor: 'rgba(255,67,58,0.15)',
    borderColor: 'rgba(255,67,58,0.5)',
  },
  bellCardLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  bellCardDesc: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
  previewBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
});
