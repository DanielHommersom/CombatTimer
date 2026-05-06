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
