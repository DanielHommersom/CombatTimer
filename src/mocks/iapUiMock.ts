// Expo Go mock for react-native-purchases-ui — mirrors src/mocks/iapMock.ts.
// The prebuilt Paywall and Customer Center are native screens and can't be
// rendered in Expo Go; every function here shows an explanatory placeholder
// instead of crashing, matching how src/mocks/googleMobileAdsMock.ts stands
// in for the interstitial/rewarded ad UI.

import { Alert } from 'react-native';

export const PAYWALL_RESULT = {
  NOT_PRESENTED: 'NOT_PRESENTED',
  ERROR:         'ERROR',
  CANCELLED:     'CANCELLED',
  PURCHASED:     'PURCHASED',
  RESTORED:      'RESTORED',
};

export async function presentPaywallIfNeeded(): Promise<string> {
  Alert.alert(
    'Combat Timer Pro',
    '[Expo Go placeholder]\nThe RevenueCat Paywall renders here on a dev-client build.',
    [{ text: 'Close', style: 'cancel' }],
  );
  return PAYWALL_RESULT.NOT_PRESENTED;
}

export async function presentPaywall(): Promise<string> {
  return presentPaywallIfNeeded();
}

export async function presentCustomerCenter(): Promise<void> {
  Alert.alert(
    'Manage Subscription',
    '[Expo Go placeholder]\nThe RevenueCat Customer Center renders here on a dev-client build.',
    [{ text: 'Close', style: 'cancel' }],
  );
}
