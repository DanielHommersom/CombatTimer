import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BELL_SOUNDS } from '../data/bellSounds';
import { useSettings } from '../hooks/useSettings';
import ActiveTimerBanner from '../components/ActiveTimerBanner';
import AppBanner from '../components/AppBanner';
import { previewBellSound } from '../logic/audioManager';
import { APP_STORE_SHARE_URL, APP_STORE_WRITE_REVIEW_URL } from '../config/adConfig';
import {
  analytics,
  isExpoGo,
  presentCustomerCenter,
  presentProPaywallIfNeeded,
  restorePurchases,
  useCombatTimerPro,
} from '../ads';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const proActive = useCombatTimerPro();
  const [proProcessing, setProProcessing] = useState(false);
  const [managingSubscription, setManagingSubscription] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    if (isExpoGo) return;
    analytics().logScreenView({ screen_name: 'SettingsScreen', screen_class: 'SettingsScreen' });
  }, []);
  const {
    soundsEnabled, setSoundsEnabled,
    volume, setVolume,
    vibrationEnabled, setVibrationEnabled,
    bellSound, setBellSound,
    analyticsEnabled, setAnalyticsEnabled,
  } = useSettings();

  const handleSoundsToggle = (value: boolean) => {
    setSoundsEnabled(value);
  };

  const handleAnalyticsToggle = async (value: boolean) => {
    setAnalyticsEnabled(value);
    if (!isExpoGo) {
      await analytics().setAnalyticsCollectionEnabled(value);
    }
  };

  // ── Combat Timer Pro (subscription) ─────────────────────────────────────
  const handleGoPro = async () => {
    if (proProcessing) return;
    setProProcessing(true);
    try {
      const outcome = await presentProPaywallIfNeeded();
      if (outcome === 'purchased') {
        Alert.alert('Welcome to Pro', 'Combat Timer Pro is now active. Thanks for your support!');
      } else if (outcome === 'restored') {
        Alert.alert('Subscription restored', 'Your Combat Timer Pro subscription has been restored.');
      } else if (outcome === 'error') {
        Alert.alert(
          'Something went wrong',
          'Could not open the upgrade screen. Check your connection and try again.',
        );
      }
      // 'cancelled' (user closed the paywall) and 'not_presented' (already
      // Pro, or Expo Go) are silent — no alert needed either way.
    } finally {
      setProProcessing(false);
    }
  };

  const handleManageSubscription = async () => {
    if (managingSubscription) return;
    setManagingSubscription(true);
    try {
      await presentCustomerCenter();
    } catch {
      Alert.alert(
        'Something went wrong',
        'Could not open subscription management. Check your connection and try again.',
      );
    } finally {
      setManagingSubscription(false);
    }
  };

  // ── Restore Purchases ───────────────────────────────────────────────────
  const handleRestorePurchases = async () => {
    if (restoring) return;
    setRestoring(true);
    try {
      const { restored } = await restorePurchases();
      Alert.alert(
        restored ? 'Purchases restored' : 'Nothing to restore',
        restored
          ? 'Your Combat Timer Pro subscription has been restored.'
          : 'No previous purchases were found for this account.',
      );
    } catch {
      Alert.alert('Restore failed', 'Could not restore purchases. Check your connection and try again.');
    } finally {
      setRestoring(false);
    }
  };

  // ── Support: Write a review / Tell a friend ─────────────────────────────
  const handleWriteReview = async () => {
    try {
      await Linking.openURL(APP_STORE_WRITE_REVIEW_URL);
    } catch {
      Alert.alert('Could not open the App Store', 'Please try again later.');
    }
  };

  const handleTellAFriend = async () => {
    const subject = encodeURIComponent('Check out CombatTimer');
    const body = encodeURIComponent(`Check out this application: ${APP_STORE_SHARE_URL}`);
    try {
      await Linking.openURL(`mailto:?subject=${subject}&body=${body}`);
    } catch {
      Alert.alert('Could not open Mail', 'Please make sure you have a mail account set up on this device.');
    }
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

      {/* Go Pro CTA — shortcut to the same paywall as the COMBAT TIMER PRO
          section below; hidden once already subscribed. */}
      {!proActive && (
        <Pressable
          style={[styles.proCta, proProcessing && styles.rowDisabled]}
          onPress={handleGoPro}
          disabled={proProcessing}
        >
          <View style={styles.proCtaIconWrap}>
            <Ionicons name="flash" size={20} color="#ffd60a" />
          </View>
          <View style={styles.proCtaTextWrap}>
            <Text style={styles.proCtaTitle}>Go Pro</Text>
            <Text style={styles.proCtaSub}>
              {proProcessing ? 'Opening…' : 'No ads and more templates'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
        </Pressable>
      )}

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

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>COMBAT TIMER PRO</Text>

        {proActive ? (
          <View style={styles.row}>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Pro active</Text>
              <Text style={styles.rowSub}>Thanks for subscribing to Combat Timer Pro</Text>
            </View>
            <Ionicons name="checkmark-circle" size={22} color="#34c759" />
          </View>
        ) : (
          <Pressable
            style={[styles.row, proProcessing && styles.rowDisabled]}
            onPress={handleGoPro}
            disabled={proProcessing}
          >
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Go Pro</Text>
              <Text style={styles.rowSub}>
                {proProcessing ? 'Opening…' : 'No ads and more templates'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
          </Pressable>
        )}

        {proActive && (
          <Pressable
            style={[styles.row, styles.rowTop, managingSubscription && styles.rowDisabled]}
            onPress={handleManageSubscription}
            disabled={managingSubscription}
          >
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Manage Subscription</Text>
              <Text style={styles.rowSub}>
                {managingSubscription ? 'Opening…' : 'Change plan, cancel, or get purchase help'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
          </Pressable>
        )}

        <Pressable
          style={[styles.row, styles.rowTop, restoring && styles.rowDisabled]}
          onPress={handleRestorePurchases}
          disabled={restoring}
        >
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Restore Purchases</Text>
            <Text style={styles.rowSub}>
              {restoring ? 'Restoring…' : 'Already subscribed? Restore it here'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>PRIVACY</Text>
        <View style={styles.row}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Usage analytics</Text>
            <Text style={styles.rowSub}>Help improve the app with anonymous data</Text>
          </View>
          <Switch
            value={analyticsEnabled}
            onValueChange={handleAnalyticsToggle}
            trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#34c759' }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>SUPPORT</Text>

        <Pressable style={styles.row} onPress={handleWriteReview}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Write a review</Text>
            <Text style={styles.rowSub}>Rate CombatTimer on the App Store</Text>
          </View>
          <Ionicons name="star-outline" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>

        <Pressable style={[styles.row, styles.rowTop]} onPress={handleTellAFriend}>
          <View style={styles.rowContent}>
            <Text style={styles.rowLabel}>Tell a friend</Text>
            <Text style={styles.rowSub}>Share CombatTimer by email</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        </Pressable>
      </View>
    </ScrollView>

      <AppBanner />
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
  proCta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#34c759',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    marginBottom: 32,
  },
  proCtaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proCtaTextWrap: {
    flex: 1,
    gap: 2,
  },
  proCtaTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  proCtaSub: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
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
  rowDisabled: {
    opacity: 0.5,
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
