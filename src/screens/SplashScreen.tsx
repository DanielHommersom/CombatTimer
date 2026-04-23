import * as ExpoSplashScreen from 'expo-splash-screen';
import React, { useEffect } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
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

const easeOut  = Easing.bezier(0, 0, 0.58, 1);
const easeIn   = Easing.bezier(0.42, 0, 1, 1);
const easeInOut = Easing.bezier(0.37, 0, 0.63, 1);
import { CombatTimerLogo } from '../components/CombatTimerLogo';

ExpoSplashScreen.preventAutoHideAsync();

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const LOGO_WIDTH  = Math.min(SCREEN_WIDTH * 0.75, 360);
const LOGO_HEIGHT = LOGO_WIDTH * (280 / 584);

interface Props {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: Props) {
  const glowOpacity      = useSharedValue(0);
  const logoOpacity      = useSharedValue(0);
  const logoScale        = useSharedValue(0.8);
  const containerOpacity = useSharedValue(1);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity:   logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  useEffect(() => {
    ExpoSplashScreen.hideAsync();

    // 1. Fade in glow + logo with spring scale
    glowOpacity.value = withTiming(1, { duration: 600, easing: easeOut });
    logoOpacity.value = withTiming(1, { duration: 600, easing: easeOut });
    logoScale.value   = withSpring(1, { damping: 12, stiffness: 120, mass: 0.8 });

    // 2. After 700ms: shimmer pulse (2× yoyo), then hold 600ms, then fade out
    const PULSE_DUR  = 380;
    const HOLD_DELAY = 700 + PULSE_DUR * 4 + 600;

    logoOpacity.value = withDelay(
      700,
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
