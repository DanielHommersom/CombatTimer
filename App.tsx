import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import BottomTabNavigator from './src/navigation/BottomTabNavigator';
import { TimerProvider } from './src/store/TimerContext';

export default function App() {
  return (
    <TimerProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <BottomTabNavigator />
      </NavigationContainer>
    </TimerProvider>
  );
}
