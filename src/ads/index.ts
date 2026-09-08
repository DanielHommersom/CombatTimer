import { useSyncExternalStore } from 'react';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { COMBAT_TIMER_PRO_ENTITLEMENT_ID, REVENUECAT_API_KEY } from '../config/adConfig';

export const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// Conditional require — the native module is never loaded in Expo Go
const adsLib = isExpoGo
  ? require('../mocks/googleMobileAdsMock')
  : require('react-native-google-mobile-ads');

const trackingLib = isExpoGo
  ? require('../mocks/expoTrackingTransparencyMock')
  : require('expo-tracking-transparency');

// Conditional require — RevenueCat's native modules are never loaded in
// Expo Go. Core SDK (purchases/entitlements) and UI SDK (Paywall / Customer
// Center) ship as two packages, mocked separately for the same reason.
const iapLib = isExpoGo
  ? require('../mocks/iapMock')
  : require('react-native-purchases');

const iapUiLib = isExpoGo
  ? require('../mocks/iapUiMock')
  : require('react-native-purchases-ui');

export const {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  // Rewarded ads use their own event-type enum in the real SDK — LOADED and
  // EARNED_REWARD live on RewardedAdEventType, NOT the shared AdEventType
  // (a real pitfall: using AdEventType.LOADED for a rewarded ad silently
  // never fires). Always pair RewardedAd with RewardedAdEventType.
  RewardedAd,
  RewardedAdEventType,
} = adsLib;

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

// ─── Entitlement state ──────────────────────────────────────────────────────
//
// `combat_timer_pro` is the app's only paid entitlement — subscribing (or
// restoring, or completing the Paywall/Customer Center) grants it, and it's
// what both AppBanner.tsx and ActiveTimerScreen.tsx gate ads on directly.
// (There used to be a second, separate "Remove Ads" one-time entitlement;
// it was removed on 2026-09-07 in favor of Pro being the only paid tier.)
//
// Exposed via `useSyncExternalStore` so subscribed components re-render the
// instant the value changes — a plain getter over a module variable would
// NOT trigger re-renders here, that was a real bug caught during review.
// Fail-safe default: `false` (ads show, Pro inactive) until RevenueCat
// proves otherwise, so an unresolved/offline cold start never silently
// grants access long-term.

function createEntitlementStore(initial: boolean) {
  let value = initial;
  const listeners = new Set<() => void>();
  return {
    get: () => value,
    set: (next: boolean) => {
      if (next === value) return;
      value = next;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

const proActiveStore = createEntitlementStore(false);

export function useCombatTimerPro(): boolean {
  return useSyncExternalStore(proActiveStore.subscribe, proActiveStore.get);
}

type CustomerInfo = { entitlements: { active: Record<string, unknown> } };

/**
 * Single place that turns a RevenueCat CustomerInfo object into local
 * entitlement state. Called from three places: the cold-boot check, every
 * purchase/restore call's own response, AND the CustomerInfo update listener
 * registered in _ensureConfigured() below — the listener is what keeps state
 * correct for changes this module didn't directly cause (a Paywall purchase,
 * a cancellation/refund made inside Customer Center, a renewal, etc.), so it
 * is the actual source of truth; the explicit calls elsewhere just make the
 * common cases (buy, restore) feel instant instead of waiting a tick.
 */
function _applyCustomerInfo(info: CustomerInfo | null | undefined) {
  const active = info?.entitlements?.active ?? {};
  proActiveStore.set(!!active[COMBAT_TIMER_PRO_ENTITLEMENT_ID]);
}

// Only ever called from the !isExpoGo branches below (iapLib.default is the
// mock's plain object in Expo Go, unused there).
const Purchases: {
  configure: (opts: { apiKey: string }) => void;
  setLogLevel: (level: string) => Promise<void>;
  addCustomerInfoUpdateListener: (listener: (info: CustomerInfo) => void) => void;
  getCustomerInfo: () => Promise<CustomerInfo>;
  getOfferings: () => Promise<{ current: { monthly?: unknown; annual?: unknown } | null; all: Record<string, unknown> }>;
  purchasePackage: (pkg: unknown) => Promise<{ customerInfo: CustomerInfo }>;
  restorePurchases: () => Promise<CustomerInfo>;
} = iapLib.default;

export const { PURCHASES_ERROR_CODE, LOG_LEVEL } = iapLib;

const RevenueCatUI: {
  presentPaywallIfNeeded: (opts: { requiredEntitlementIdentifier: string }) => Promise<string>;
  presentCustomerCenter: () => Promise<void>;
} = iapUiLib.default ?? iapUiLib;

export const { PAYWALL_RESULT } = iapUiLib;

let _configured = false;
function _ensureConfigured() {
  if (_configured || isExpoGo) return;
  // RevenueCat's own quickstart calls this before configure() so the
  // configure call itself logs too. VERBOSE is genuinely useful while
  // wiring purchases up, but noisy for a shipped build — dev-gated here
  // rather than left permanently on.
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.VERBOSE : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey: REVENUECAT_API_KEY });
  // Best practice per RevenueCat docs: register a listener once instead of
  // manually re-checking state after every call site. This is what keeps
  // useCombatTimerPro() correct for purchases made through the Paywall or
  // actions taken inside Customer Center, neither of which go through the
  // purchase functions below.
  Purchases.addCustomerInfoUpdateListener(_applyCustomerInfo);
  _configured = true;
}

/**
 * Calls RevenueCat's getCustomerInfo() once on cold boot — same lifecycle as
 * the existing mobileAds().initialize() call in App.tsx — and seeds the Pro
 * entitlement. Never throws: any failure (offline, RevenueCat not
 * configured yet, etc.) leaves state at its fail-safe default (ads showing)
 * instead of crashing app startup.
 */
export async function initAdsRemovedState(): Promise<void> {
  if (isExpoGo) {
    await iapLib.initAdsRemovedState();
    return;
  }
  try {
    _ensureConfigured();
    const info = await Purchases.getCustomerInfo();
    _applyCustomerInfo(info);
  } catch {
    // Fail-safe: leave state at its default (ads showing, Pro inactive).
  }
}

/**
 * Restore purchases for the current store account. Three distinct outcomes:
 *  - entitlement found      → resolves `{ restored: true }`, state updated,
 *                              caller shows a neutral success message
 *  - entitlement not found  → resolves `{ restored: false }` — this is a
 *                              valid empty result, NOT an error; caller shows
 *                              a neutral "nothing to restore" message
 *  - real failure (network/store) → rejects, caller shows an error Alert
 */
export async function restorePurchases(): Promise<{ restored: boolean }> {
  if (isExpoGo) {
    return iapLib.restorePurchases();
  }

  _ensureConfigured();
  const info = await Purchases.restorePurchases();
  _applyCustomerInfo(info);
  const restored = !!info?.entitlements?.active?.[COMBAT_TIMER_PRO_ENTITLEMENT_ID];
  return { restored };
}

// ─── Combat Timer Pro (auto-renewable subscription) ────────────────────────

/**
 * Shared purchase logic for both Pro durations below — buys a package
 * straight from the current Offering (no Paywall UI), e.g. for a custom
 * upgrade button. Reads it off `offerings.current` (RevenueCat's Offerings/
 * Packages system) rather than a hardcoded product ID — see the comment on
 * COMBAT_TIMER_PRO_ENTITLEMENT_ID in adConfig.ts.
 *  - success        → resolves, entitlement flipped true, listeners notified
 *  - user-cancelled  → rejects with `{ userCancelled: true }` — caller shows
 *                      NO alert (silent, user-initiated)
 *  - already owned  → resolves, treated identically to a fresh success (the
 *                      store SDK guarantees no double-charge)
 *  - other failure  → rejects — caller shows an error Alert
 */
async function _purchaseCombatTimerProPackage(
  duration: 'monthly' | 'annual',
): Promise<void> {
  _ensureConfigured();
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings?.current?.[duration];
    if (!pkg) {
      throw new Error(
        `RevenueCat: no "${duration}" package on the current offering — add ` +
        `a Package of type ${duration === 'monthly' ? 'Monthly' : 'Annual'} ` +
        'to your Offering in the RevenueCat dashboard.',
      );
    }
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    _applyCustomerInfo(customerInfo);
  } catch (err: any) {
    if (err?.userCancelled || err?.code === PURCHASES_ERROR_CODE?.PurchaseCancelledError) {
      throw { userCancelled: true };
    }
    if (err?.code === PURCHASES_ERROR_CODE?.ProductAlreadyPurchasedError) {
      const info = await Purchases.getCustomerInfo();
      _applyCustomerInfo(info);
      return;
    }
    throw err;
  }
}

/** Buys the Monthly (€1.99/mo) Combat Timer Pro package directly. */
export async function purchaseCombatTimerProMonthly(): Promise<void> {
  if (isExpoGo) {
    await iapLib.purchaseCombatTimerProMonthly();
    return;
  }
  return _purchaseCombatTimerProPackage('monthly');
}

/** Buys the Yearly (€11.99/yr) Combat Timer Pro package directly. */
export async function purchaseCombatTimerProYearly(): Promise<void> {
  if (isExpoGo) {
    await iapLib.purchaseCombatTimerProYearly();
    return;
  }
  return _purchaseCombatTimerProPackage('annual');
}

export type PaywallOutcome = 'purchased' | 'restored' | 'cancelled' | 'not_presented' | 'error';

/**
 * Presents RevenueCat's prebuilt Paywall UI, but ONLY if the user doesn't
 * already have `combat_timer_pro` — the recommended modern entry point for
 * an upgrade button (vs. purchaseCombatTimerProMonthly()/ProYearly(), which
 * skip straight to the store sheet with no marketing screen). Shows both the
 * Monthly and Annual packages together (with a picker) as soon as both exist
 * on the current Offering — no extra code needed here for that. The
 * Paywall's own purchase/restore flow updates entitlement state via the
 * CustomerInfo listener automatically; this function also refreshes
 * explicitly so the caller's own return value is immediately consistent.
 */
export async function presentProPaywallIfNeeded(): Promise<PaywallOutcome> {
  if (isExpoGo) {
    await iapUiLib.presentPaywallIfNeeded();
    return 'not_presented';
  }

  _ensureConfigured();
  try {
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: COMBAT_TIMER_PRO_ENTITLEMENT_ID,
    });
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      const info = await Purchases.getCustomerInfo();
      _applyCustomerInfo(info);
    }
    switch (result) {
      case PAYWALL_RESULT.PURCHASED:     return 'purchased';
      case PAYWALL_RESULT.RESTORED:      return 'restored';
      case PAYWALL_RESULT.CANCELLED:     return 'cancelled';
      case PAYWALL_RESULT.NOT_PRESENTED: return 'not_presented';
      default:                           return 'error';
    }
  } catch {
    return 'error';
  }
}

/**
 * Presents RevenueCat's Customer Center — lets a subscriber cancel, change
 * plan, request a refund, or get purchase help without leaving the app.
 */
export async function presentCustomerCenter(): Promise<void> {
  if (isExpoGo) {
    await iapUiLib.presentCustomerCenter();
    return;
  }

  _ensureConfigured();
  await RevenueCatUI.presentCustomerCenter();
  // Customer Center can cancel/refund/restore from inside its own UI —
  // refresh once it closes so Settings reflects any change immediately
  // (on top of the CustomerInfo listener, belt-and-suspenders as above).
  const info = await Purchases.getCustomerInfo();
  _applyCustomerInfo(info);
}
