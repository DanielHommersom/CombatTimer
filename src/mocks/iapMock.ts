// Expo Go mock for the RevenueCat SDK (react-native-purchases) — mirrors
// src/mocks/googleMobileAdsMock.ts's pattern. Purchases require an EAS
// dev-client build (same constraint the existing ad mocks already work
// around), so every function here is a safe no-op/resolve: plain
// `expo start` must not crash when tapping purchase/restore/upgrade buttons.

export const PURCHASES_ERROR_CODE = {
  PurchaseCancelledError:       'PURCHASE_CANCELLED_ERROR',
  ProductAlreadyPurchasedError: 'PRODUCT_ALREADY_PURCHASED_ERROR',
};

export const LOG_LEVEL = {
  VERBOSE: 'VERBOSE',
  DEBUG:   'DEBUG',
  INFO:    'INFO',
  WARN:    'WARN',
  ERROR:   'ERROR',
};

export async function initAdsRemovedState(): Promise<void> {
  // No-op — entitlement state simply stays at its fail-safe default (false).
}

export async function restorePurchases(): Promise<{ restored: boolean }> {
  return { restored: false };
}

export async function purchaseCombatTimerProMonthly(): Promise<void> {
  // No-op — resolves so the Settings UI doesn't crash on tap, but doesn't
  // pretend a purchase happened (real IAP needs a dev-client build).
}

export async function purchaseCombatTimerProYearly(): Promise<void> {
  // No-op — same reasoning as purchaseCombatTimerProMonthly() above.
}

const PurchasesMock = {
  configure: (_opts: { apiKey: string }) => {},
  addCustomerInfoUpdateListener: (_listener: (info: unknown) => void) => {},
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  getOfferings: async () => ({ current: null, all: {} }),
  purchasePackage: async (_pkg: unknown) => ({ customerInfo: { entitlements: { active: {} } } }),
  restorePurchases: async () => ({ entitlements: { active: {} } }),
};

export default PurchasesMock;
