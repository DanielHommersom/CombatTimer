import React from 'react';
import { Alert, Text, View } from 'react-native';

export const BannerAdSize = {
  BANNER:           'BANNER',
  FULL_BANNER:      'FULL_BANNER',
  LARGE_BANNER:     'LARGE_BANNER',
  LEADERBOARD:      'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ANCHORED_ADAPTIVE_BANNER:       'ANCHORED_ADAPTIVE_BANNER',
  LARGE_ANCHORED_ADAPTIVE_BANNER: 'LARGE_ANCHORED_ADAPTIVE_BANNER',
};

export const AdEventType = {
  LOADED:  'loaded',
  ERROR:   'error',
  OPENED:  'opened',
  CLOSED:  'closed',
  CLICKED: 'clicked',
};

// Rewarded ads use a distinct event-type enum from banner/interstitial in the
// real SDK (react-native-google-mobile-ads) — LOADED/EARNED_REWARD live here,
// not on the shared AdEventType. Mirrored here for Expo Go parity.
export const RewardedAdEventType = {
  LOADED:        'rewarded_loaded',
  EARNED_REWARD: 'rewarded_earned_reward',
};

export const TestIds = {
  BANNER:       'test-banner',
  INTERSTITIAL: 'test-interstitial',
  REWARDED:     'test-rewarded',
};

export function BannerAd(): React.ReactElement {
  return React.createElement(
    View,
    {
      style: {
        width: '100%',
        height: 50,
        backgroundColor: '#1c1c1e',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
      },
    },
    React.createElement(
      Text,
      { style: { color: 'rgba(255,255,255,0.3)', fontSize: 11, letterSpacing: 0.5 } },
      'AD PLACEHOLDER (Expo Go)',
    ),
  );
}

export const InterstitialAd = {
  createForAdRequest: (_unitId: string, _options?: object) => {
    const listeners: Record<string, () => void> = {};
    return {
      addAdEventListener: (event: string, handler: () => void) => {
        listeners[event] = handler;
        return () => { delete listeners[event]; };
      },
      load: () => {
        // Simulate the LOADED event firing after a short delay
        setTimeout(() => listeners[AdEventType.LOADED]?.(), 500);
      },
      show: () => {
        Alert.alert(
          'Interstitial Ad',
          '[Expo Go placeholder]\nA full-screen ad would appear here.',
          [{ text: 'Close', style: 'cancel' }],
        );
      },
    };
  },
};

export const RewardedAd = {
  createForAdRequest: (_unitId: string, _options?: object) => {
    const listeners: Record<string, (reward?: { amount: number; type: string }) => void> = {};
    return {
      addAdEventListener: (
        event: string,
        handler: (reward?: { amount: number; type: string }) => void,
      ) => {
        listeners[event] = handler;
        return () => { delete listeners[event]; };
      },
      load: () => {
        // Simulate the LOADED event firing after a short delay
        setTimeout(() => listeners[RewardedAdEventType.LOADED]?.(), 500);
      },
      show: () => {
        Alert.alert(
          'Rewarded Ad',
          '[Expo Go placeholder]\nWatch to skip your next interstitial.',
          [
            { text: 'Skip', style: 'cancel' },
            {
              text: 'Watch (simulate reward)',
              onPress: () => listeners[RewardedAdEventType.EARNED_REWARD]?.({ amount: 1, type: 'skip' }),
            },
          ],
        );
      },
    };
  },
};

export default {
  BannerAd,
  BannerAdSize,
  AdEventType,
  RewardedAdEventType,
  TestIds,
  InterstitialAd,
  RewardedAd,
};
