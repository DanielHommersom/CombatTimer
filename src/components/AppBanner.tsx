import React from 'react';
import { BannerAd, BannerAdSize, useCombatTimerPro } from '../ads';
import { AD_UNIT_IDS } from '../config/adConfig';

// DRY banner gating: renders the existing BannerAd markup, or nothing once
// Combat Timer Pro is active. Reactive via useCombatTimerPro() — no app
// restart or screen remount needed for the banner to disappear right after
// subscribing.
export default function AppBanner(): React.ReactElement | null {
  const proActive = useCombatTimerPro();
  if (proActive) return null;

  return (
    <BannerAd
      unitId={AD_UNIT_IDS.banner}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
}
