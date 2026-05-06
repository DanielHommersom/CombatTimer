import React from 'react';
import { Alert, Text, View } from 'react-native';

export const BannerAdSize = {
  BANNER:           'BANNER',
  FULL_BANNER:      'FULL_BANNER',
  LARGE_BANNER:     'LARGE_BANNER',
  LEADERBOARD:      'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ADAPTIVE_BANNER:  'ADAPTIVE_BANNER',
};

export const AdEventType = {
  LOADED:  'loaded',
  ERROR:   'error',
  OPENED:  'opened',
  CLOSED:  'closed',
  CLICKED: 'clicked',
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

export default {
  BannerAd,
  BannerAdSize,
  AdEventType,
  TestIds,
  InterstitialAd,
};
