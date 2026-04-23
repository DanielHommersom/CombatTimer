import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Dimensions, Image, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { CombatTimerLogo } from '../components/CombatTimerLogo';

ExpoSplashScreen.preventAutoHideAsync();

const easeOut   = Easing.bezier(0, 0, 0.58, 1);
const easeIn    = Easing.bezier(0.42, 0, 1, 1);
const easeInOut = Easing.bezier(0.37, 0, 0.63, 1);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_WIDTH  = Math.min(SCREEN_WIDTH * 0.75, 360);
const LOGO_HEIGHT = LOGO_WIDTH * (280 / 584);

// ── Pre-splash timing ─────────────────────────────────────────────────────────
const PRE_FADE_IN  = 500;   // PNG fades in
const PRE_HOLD     = 500;   // PNG holds
const PRE_FADE_OUT = 350;   // PNG fades out / SVG fades in simultaneously
const SVG_START    = PRE_FADE_IN + PRE_HOLD; // when SVG phase begins

interface Props {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: Props) {
  // Pre-splash (PNG)
  const preOpacity = useSharedValue(0);

  // Main splash (SVG)
  const glowOpacity      = useSharedValue(0);
  const logoOpacity      = useSharedValue(0);
  const logoScale        = useSharedValue(0.85);
  const containerOpacity = useSharedValue(1);

  const preStyle = useAnimatedStyle(() => ({ opacity: preOpacity.value }));

  const glowStyle = useAnimatedStyle(() => ({ opacity: glowOpacity.value }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));

  useEffect(() => {
    ExpoSplashScreen.hideAsync();

    // ── Phase 1: PNG pre-splash ───────────────────────────────────────────────
    preOpacity.value = withSequence(
      withTiming(1,   { duration: PRE_FADE_IN,  easing: easeOut }),
      withTiming(1,   { duration: PRE_HOLD }),
      withTiming(0,   { duration: PRE_FADE_OUT, easing: easeIn }),
    );

    // ── Phase 2: SVG main splash (starts as PNG begins fading out) ───────────
    const svgIn = SVG_START; // PNG fade-in + hold

    glowOpacity.value = withDelay(svgIn, withTiming(1, { duration: 600, easing: easeOut }));
    logoOpacity.value = withDelay(svgIn, withTiming(1, { duration: 600, easing: easeOut }));
    logoScale.value   = withDelay(svgIn, withSpring(1, { damping: 12, stiffness: 120, mass: 0.8 }));

    // Shimmer pulse → hold → fade out
    const PULSE_DUR  = 380;
    const pulseStart = svgIn + 700;
    const HOLD_DELAY = pulseStart + PULSE_DUR * 4 + 600;

    logoOpacity.value = withDelay(
      pulseStart,
      withSequence(
        withTiming(0.75, { duration: PULSE_DUR, easing: easeInOut }),
        withTiming(1.0,  { duration: PULSE_DUR, easing: easeInOut }),
        withTiming(0.75, { duration: PULSE_DUR, easing: easeInOut }),
        withTiming(1.0,  { duration: PULSE_DUR, easing: easeInOut }),
        withDelay(600, withTiming(0, { duration: 480, easing: easeIn })),
      ),
    );

    glowOpacity.value = withDelay(
      HOLD_DELAY,
      withTiming(0, { duration: 480, easing: easeIn }),
    );

    containerOpacity.value = withDelay(
      HOLD_DELAY,
      withTiming(0, { duration: 480, easing: easeIn }, () => {
        runOnJS(onComplete)();
      }),
    );
  }, []);

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Pre-splash PNG */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.center, preStyle]}>
        <Image
          source={require('../../assets/combattimer-logo-black.png')}
          style={styles.preImage}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Main splash SVG */}
      <Animated.View style={[styles.glow, glowStyle]} />
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <CombatTimerLogo width={LOGO_WIDTH} height={LOGO_HEIGHT} />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111111',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  preImage: {
    width:  SCREEN_WIDTH * 0.88,
    height: SCREEN_WIDTH * 0.88 * (400 / 1200),
  },
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#3B82F6',
    opacity: 0,
    transform: [{ scale: 1.8 }],
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
