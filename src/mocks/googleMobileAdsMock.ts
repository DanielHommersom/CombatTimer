import React from 'react';
import { View } from 'react-native';

export const BannerAdSize = {
  BANNER:         'BANNER',
  FULL_BANNER:    'FULL_BANNER',
  LARGE_BANNER:   'LARGE_BANNER',
  LEADERBOARD:    'LEADERBOARD',
  MEDIUM_RECTANGLE: 'MEDIUM_RECTANGLE',
  ADAPTIVE_BANNER: 'ADAPTIVE_BANNER',
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
  return React.createElement(View, null);
}

export const InterstitialAd = {
  createForAdRequest: (_unitId: string, _options?: object) => ({
    addAdEventListener: (_event: string, _handler: () => void) => () => {},
    load:  () => {},
    show:  () => {},
  }),
};

export default {
  BannerAd,
  BannerAdSize,
  AdEventType,
  TestIds,
  InterstitialAd,
};
