import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import mobileAds from 'react-native-google-mobile-ads';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { SplashScreen } from './src/screens/SplashScreen';
import { TimerProvider } from './src/store/TimerContext';

export default function App() {
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const initAds = async () => {
      await requestTrackingPermissionsAsync();
      await mobileAds().initialize();
    };
    initAds();
  }, []);

  return (
    <GestureHandlerRootView style={styles.root}>
      <BottomSheetModalProvider>
        <TimerProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <BottomTabNavigator />
          </NavigationContainer>
        </TimerProvider>
      </BottomSheetModalProvider>

      {/* Splash sits on top, fades out to reveal the already-rendered app */}
      {!splashDone && (
        <SplashScreen onComplete={() => setSplashDone(true)} />
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
