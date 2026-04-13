import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Screen } from '../store/useTimerStore';

interface Tab {
  screen: Screen;
  label: string;
  icon: string;
}

const TABS: Tab[] = [
  { screen: 'workout',  label: 'Workout',  icon: '🥊' },
  { screen: 'timer',    label: 'Timer',    icon: '⏱' },
  { screen: 'settings', label: 'Settings', icon: '⚙️' },
];

interface Props {
  activeScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export default function BottomTabBar({ activeScreen, onNavigate }: Props) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const active = tab.screen === activeScreen;
        return (
          <Pressable
            key={tab.screen}
            style={styles.tab}
            onPress={() => onNavigate(tab.screen)}
          >
            <Text style={styles.icon}>{tab.icon}</Text>
            <Text style={[styles.label, active && styles.labelActive]}>
              {tab.label}
            </Text>
            {active && <View style={styles.indicator} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    paddingBottom: 24, // safe area for home bar
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    position: 'relative',
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: '#555555',
  },
  labelActive: {
    color: '#FF4444',
  },
  indicator: {
    position: 'absolute',
    top: -10,
    width: 24,
    height: 2,
    backgroundColor: '#FF4444',
    borderRadius: 1,
  },
});
