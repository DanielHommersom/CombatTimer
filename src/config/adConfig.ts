import { Platform } from 'react-native';

export const AD_UNIT_IDS = {
  banner:       'ca-app-pub-3366446717708247/9049024503',
  interstitial: 'ca-app-pub-3366446717708247/7604080891',
  // TODO(§0 of monetization-implementation-checklist.md): create a rewarded
  // ad unit in the AdMob console (only banner + interstitial exist there
  // today) and paste its ID here.
  rewarded:     'ca-app-pub-3366446717708247/REPLACE_WITH_REWARDED_UNIT_ID',
  // Second banner, shown at the bottom of ActiveTimerScreen.tsx (in addition
  // to AppBanner's `banner` unit used elsewhere) — a distinct ad unit so the
  // two placements report separately in the AdMob console. Same AdMob app
  // (App ID ca-app-pub-3366446717708247~5105910064, already set as
  // iosAppId/androidAppId in app.json) — this is only a new ad unit within it.
  timerBanner:  'ca-app-pub-3366446717708247/6424830127',
};

// NOTE: this key was provided directly (not pulled from the RevenueCat
// dashboard) and is used as-is per instruction. RevenueCat's public SDK keys
// are normally prefixed appl_ (iOS) / goog_ (Android) / amzn_ / strp_
// depending on store — "test_..." doesn't match that pattern. Before
// shipping to either store, confirm in RevenueCat > Project Settings >
// API Keys that this is the intended key, and put the real per-platform
// key in each slot below (a single shared key works for local testing but
// is not how RevenueCat issues production keys).
const REVENUECAT_API_KEYS = {
  ios:     'test_ByZLwHzcgyWHJyKAKskjwdGYRlo',
  android: 'test_ByZLwHzcgyWHJyKAKskjwdGYRlo',
};

export const REVENUECAT_API_KEY =
  Platform.select({ ios: REVENUECAT_API_KEYS.ios, android: REVENUECAT_API_KEYS.android }) ??
  REVENUECAT_API_KEYS.android;

// ─── "Combat Timer Pro" (auto-renewable subscription, 2 durations) ─────────
//
// This is now the app's ONLY paid entitlement. The earlier one-time "Remove
// Ads" non-consumable has been removed on purpose (2026-09-07) — Pro is what
// removes ads now, sold as monthly/yearly instead of a one-time unlock. See
// `useCombatTimerPro()` in src/ads/index.ts, which both AppBanner.tsx and
// ActiveTimerScreen.tsx gate on directly.

// TODO(§0-pro): in App Store Connect, create a Subscription Group with TWO
// auto-renewable products in it (same group so a subscriber can switch
// between them):
//   - Monthly — €1.99 / month
//   - Yearly  — €11.99 / year
// Prices are set in App Store Connect / Google Play Console, not here — this
// file never hardcodes a price. In RevenueCat: add both as Products, attach
// BOTH to the `combat_timer_pro` entitlement below, then in your current
// Offering add a Package of type "Monthly" (→ the monthly product) and a
// Package of type "Annual" (→ the yearly product).
//
// purchaseCombatTimerProMonthly()/purchaseCombatTimerProYearly() (src/ads/
// index.ts) deliberately do NOT hardcode a product ID — they read
// `offerings.current.monthly` / `.annual`, RevenueCat's Offerings/Packages
// system, which is the source of truth and lets you change prices/products
// in the dashboard without an app update. The prebuilt Paywall (presented
// via presentProPaywallIfNeeded()) picks up both packages automatically once
// they exist on the Offering — no extra code needed to show a monthly/yearly
// picker there.
export const COMBAT_TIMER_PRO_ENTITLEMENT_ID = 'combat_timer_pro';

// ─── Support: "Write a review" / "Tell a friend" (SettingsScreen.tsx) ──────
//
// Apple ID from App Store Connect > App Information > Apple ID — also the
// number in the app's public apps.apple.com/app/id<NUMBER> URL. Android has
// no equivalent review-compose deep link — Play Store review prompts go
// through `expo-store-review`'s native in-app review flow instead, not
// wired up here since this app currently only ships to iOS.
const APP_STORE_ID = '6762453732';

// Deep-links straight into the App Store's review-compose screen (skips the
// product page) — this is what "Write a review" in Settings opens.
export const APP_STORE_WRITE_REVIEW_URL =
  `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;

// Plain product-page link — this is the "*Link to the app in the app store*"
// dropped into the "Tell a friend" email body.
export const APP_STORE_SHARE_URL = `https://apps.apple.com/app/id${APP_STORE_ID}`;
