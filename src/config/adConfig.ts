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

// Public Apple App Store key from RevenueCat > Project Settings > API Keys
// (2026-09-08 — replaced the earlier `test_...` Test Store key, which only
// works against fake Test Store products and was never valid for the real
// combat_timer_pro Offering built in Product catalog).
//
// TODO: Android isn't shipped yet, so this slot still holds the old Test
// Store key as a harmless placeholder — swap in a real `goog_...` key from
// the same API Keys page before ever building for Android.
const REVENUECAT_API_KEYS = {
  ios:     'appl_vKEyeufURhRkkxgRCOTWosQHdIh',
  android: 'test_ByZLwHzcgyWHJyKAKskjwdGYRlo',
};

// (2026-09-09) — the real combat_timer_pro subscriptions aren't reachable
// from App Store Connect yet (first-ever subscription group: still needs a
// new app version submitted for review before StoreKit will serve them —
// see the "SOS" section of the setup guide). Flip this to `true` locally to
// route iOS to RevenueCat's Test Store instead, so you can test the full
// purchase → entitlement → Pro-unlock flow in the meantime with fake,
// instant purchases. Requires Test Store products (attached to the
// `combat_timer_pro` entitlement, added to the current Offering) to exist
// in the dashboard — see RevenueCat > Apps and providers > Test Store.
//
// ⚠️ MUST be `false` again before any TestFlight or App Store build —
// Apple will reject/ignore a build configured with a Test Store key, and
// RevenueCat explicitly warns to never ship one.
const USE_TEST_STORE_FOR_LOCAL_TESTING = false;

export const REVENUECAT_API_KEY = USE_TEST_STORE_FOR_LOCAL_TESTING
  ? REVENUECAT_API_KEYS.android // the test_... Test Store key, reused here on purpose
  : Platform.select({ ios: REVENUECAT_API_KEYS.ios, android: REVENUECAT_API_KEYS.android }) ??
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
