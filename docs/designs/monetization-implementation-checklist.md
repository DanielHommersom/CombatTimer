# CombatTimer Monetization — Implementation Checklist

Derived from `docs/designs/monetization-fill-the-gaps.md` (office-hours) and its
`/plan-eng-review`. Locked decisions are noted inline — don't re-litigate them,
just build.

## 0. Manual console setup (do first, blocks everything else)

- [ ] Create a rewarded ad unit in the AdMob console (only banner + interstitial
      exist today in `src/config/adConfig.ts`)
- [ ] Create a RevenueCat account and project, linked to both App Store Connect
      and Google Play Console (RevenueCat chosen over raw `react-native-iap` —
      handles cross-platform receipt validation, avoids hand-rolled StoreKit/Play
      Billing verification)
- [ ] Configure the "Remove Ads" non-consumable product in App Store Connect
- [ ] Configure the "Remove Ads" non-consumable product in Google Play Console
- [ ] Map both store products to a single RevenueCat entitlement (e.g. `no_ads`)
- [ ] Price-check 2-3 competing boxing-timer apps' ad-removal/pro pricing before
      setting the price point (per the design doc's Assignment)
- [ ] Check Play Console's current app-content/ads-declaration requirements now
      that a paid ad-removal path exists alongside ads

## 1. Foundation — `src/ads/index.ts` (IAP + entitlement layer)

- [ ] Add `react-native-purchases` (RevenueCat SDK) as a dependency
- [ ] Add a module-level `_adsRemoved` boolean, default `false` (fail-safe: ads
      show until proven otherwise)
- [ ] Implement `useAdsRemoved()` with **`useSyncExternalStore`** — not a plain
      function. A plain getter over a module-level variable will NOT trigger
      re-renders when purchase state changes; this was a real bug caught during
      review. Screens must re-render immediately post-purchase, no app restart.
- [ ] Implement `initAdsRemovedState()` — calls RevenueCat's `getCustomerInfo()`
      once on cold boot (same lifecycle as the existing `mobileAds().initialize()`
      call in `App.tsx`), sets `_adsRemoved` from the `no_ads` entitlement, fires
      the `useSyncExternalStore` listeners
- [ ] Implement `purchaseRemoveAds()`:
  - [ ] Success → `_setAdsRemoved(true)`, notify listeners
  - [ ] User-cancelled → reject, caller shows **no alert** (silent, user-initiated)
  - [ ] Repeat purchase (already owned) → treat identically to success, no
        special-case UI (store SDK guarantees no double-charge)
  - [ ] Other failure (network, store error) → reject, caller shows an error Alert
- [ ] Implement `restorePurchases()` with **3 distinct outcomes** (not 2):
  - [ ] Entitlement found → resolves, `_setAdsRemoved(true)`, neutral success message
  - [ ] Entitlement not found → resolves (this is a valid empty result, NOT an
        error), neutral "nothing to restore" message
  - [ ] Real failure (network/store error) → rejects, error Alert
- [ ] Add `AD_UNIT_IDS.rewarded` to `src/config/adConfig.ts`
- [ ] Export `RewardedAd`, `RewardedAdEventType` from the ads barrel — **use
      `RewardedAdEventType.LOADED`, not the shared `AdEventType.LOADED`** (a real
      pitfall found during search — different enum for rewarded vs interstitial)

## 2. Expo Go mock parity

- [ ] Create `src/mocks/iapMock.ts` mirroring `src/mocks/googleMobileAdsMock.ts`'s
      pattern
- [ ] `purchaseRemoveAds()`, `restorePurchases()`, `initAdsRemovedState()` all
      safe no-op/resolve in the mock — plain `expo start` must not crash when
      tapping purchase/restore buttons (purchases require an EAS dev-client
      build, same constraint the existing ad mocks already work around)
- [ ] Wire the mock into the existing `isExpoGo` conditional require in
      `src/ads/index.ts`

## 3. DRY banner gating — `src/components/AppBanner.tsx` (new)

- [ ] Create `AppBanner.tsx`: renders `null` if `useAdsRemoved()` is true,
      otherwise renders the existing `BannerAd` markup
- [ ] Swap `<BannerAd unitId=... size=.../>` for `<AppBanner />` in:
  - [ ] `src/screens/TimerScreen.tsx`
  - [ ] `src/screens/WorkoutScreen.tsx`
  - [ ] `src/screens/SettingsScreen.tsx`

## 4. Settings screen — purchase UI

- [ ] Add "Remove Ads" button/row
- [ ] Add "Restore Purchases" button/row (required for App Store review approval
      of any non-consumable IAP; standard practice on Play too)
- [ ] Wire both to the `ads/index.ts` functions with the error handling above —
      distinguish cancel (silent) / not-found (neutral) / real failure (Alert)

## 5. `src/screens/ActiveTimerScreen.tsx` — interstitial gate + rewarded flow

This was the one piece of scope the initial architecture review missed — caught
by the outside-voice cross-model check. A "Remove Ads" purchase that doesn't
actually remove the interstitial fails App Store review scrutiny.

- [ ] Gate the existing interstitial `.show()` call behind `!useAdsRemoved()` —
      purchasers see zero interstitials, full stop
- [ ] Add the rewarded-ad "watch to skip your next interstitial" offer:
  - [ ] `RewardedAd.createForAdRequest(AD_UNIT_IDS.rewarded, ...)`
  - [ ] On `RewardedAdEventType.LOADED` → show
  - [ ] On `RewardedAdEventType.EARNED_REWARD` → set a `skipNextInterstitial`
        flag
  - [ ] Next workout completion: if `skipNextInterstitial` is true, skip the
        interstitial once and reset the flag to `false`
  - [ ] Rewarded ad fails to load (offline etc.) → offer is hidden/disabled,
        never crashes the screen
  - [ ] Rewarded offer should not appear at all once `useAdsRemoved()` is true —
        nothing left to skip

## 6. Manual QA (no automated tests exist in this repo yet — see §7)

Full scenario list lives in the eng-review test plan artifact
(`~/.gstack/projects/DanielHommersom-CombatTimer/danielhommersom-main-eng-review-test-plan-*.md`).
Highlights:

- [ ] Sandbox-purchase Remove Ads → banner + interstitial gone immediately, no
      app restart needed
- [ ] Cancel the purchase sheet → no error alert, state unchanged
- [ ] Purchase with network off → error Alert, distinct wording from cancel
- [ ] Restore Purchases with a prior purchase → entitlement restored
- [ ] Restore Purchases with nothing to restore → neutral message, not an error
- [ ] Full workout → accept rewarded ad → next workout skips interstitial once,
      then resumes normal behavior
- [ ] Rewarded ad declined → interstitial behaves exactly as before (no regression)
- [ ] Cold launch right after a purchase, before entitlement check resolves →
      ads show briefly (fail-safe), then disappear once resolved
- [ ] `expo start` (plain Expo Go) → purchase/restore buttons don't crash

## 7. Tracked separately (not blocking this PR)

- [ ] TODOS.md: "Stand up test framework (Jest + React Native Testing Library)"
      — already added to `TODOS.md` in this repo. Zero test infra exists;
      standing one up is separate scope from this feature per Approach A's
      deliberately minimal framing, but it's the first thing to build once a
      framework lands (purchase/restore paths are the highest-risk surface —
      real money, App Store review consequences).
