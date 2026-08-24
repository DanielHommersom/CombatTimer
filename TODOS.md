# TODOS

## Infrastructure

### Stand up test framework (Jest + React Native Testing Library)

**What:** Add Jest and React Native Testing Library to the project; write first tests for the IAP/purchase flow.

**Why:** The repo has zero test infrastructure (no jest config, no test script, no test files). The monetization PR (rewarded ad + "Remove Ads" IAP) adds a real-money purchase flow with ~24 untested branches — entitlement reactivity, purchase/restore success and failure paths, and post-workout interstitial/rewarded-ad gating — shipped with manual QA only.

**Context:** See `docs/designs/monetization-fill-the-gaps.md` and the eng-review test plan artifact (`~/.gstack/projects/DanielHommersom-CombatTimer/danielhommersom-main-eng-review-test-plan-*.md`) for the specific coverage diagram and first-target branches: `useAdsRemoved()` reactivity via `useSyncExternalStore`, `purchaseRemoveAds()`/`restorePurchases()` success and failure paths, and the post-workout interstitial gate + rewarded-ad skip-flag lifecycle in `src/ads/index.ts` and `ActiveTimerScreen.tsx`.

**Effort:** M
**Priority:** P2
**Depends on:** None
