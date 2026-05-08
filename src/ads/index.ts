import Constants, { ExecutionEnvironment } from 'expo-constants';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditional require — the native module is never loaded in Expo Go
const adsLib = isExpoGo
  ? require('../mocks/googleMobileAdsMock')
  : require('react-native-google-mobile-ads');

const trackingLib = isExpoGo
  ? require('../mocks/expoTrackingTransparencyMock')
  : require('expo-tracking-transparency');

export const { BannerAd, BannerAdSize, InterstitialAd, AdEventType } = adsLib;

// mobileAds() is the default export used for SDK initialisation
export const mobileAds: () => { initialize: () => Promise<void> } = isExpoGo
  ? () => ({ initialize: async () => {} })
  : adsLib.default;

export const { requestTrackingPermissionsAsync } = trackingLib;

// Conditional require — Firebase native modules are not available in Expo Go
const analyticsLib = isExpoGo
  ? require('../mocks/firebaseAnalyticsMock')
  : require('@react-native-firebase/analytics');

export const analytics: () => {
  setAnalyticsCollectionEnabled: (enabled: boolean) => Promise<void>;
  logEvent: (name: string, params?: object) => Promise<void>;
  logScreenView: (params: { screen_name: string; screen_class: string }) => Promise<void>;
} = analyticsLib.default;
