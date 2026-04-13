import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import SettingsScreen from '../screens/SettingsScreen';
import TimerScreen    from '../screens/TimerScreen';
import WorkoutScreen  from '../screens/WorkoutScreen';
import { Workout }    from '../types/workout';

// ─── Param lists ─────────────────────────────────────────────────────────────

export type RootStackParamList = {
  MainTabs:    undefined;
  ActiveTimer: { workout: Workout };
};

export type TabParamList = {
  Workout:  undefined;
  Timer:    undefined;
  Settings: undefined;
};

// ─── Tab Timer placeholder ───────────────────────────────────────────────────

function TimerTabPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Ionicons name="timer-outline" size={40} color="rgba(255,255,255,0.15)" />
      <Text style={styles.placeholderText}>Tap ▶ on a workout to begin</Text>
    </View>
  );
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab  = createBottomTabNavigator<TabParamList>();
const Root = createNativeStackNavigator<RootStackParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const ICONS: Record<keyof TabParamList, { active: IoniconName; inactive: IoniconName }> = {
  Workout:  { active: 'barbell',  inactive: 'barbell-outline'  },
  Timer:    { active: 'timer',    inactive: 'timer-outline'    },
  Settings: { active: 'settings', inactive: 'settings-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Workout"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, size }) => {
          const icons = ICONS[route.name as keyof TabParamList];
          const name  = focused ? icons.active : icons.inactive;
          return (
            <Ionicons
              name={name}
              size={size}
              color={focused ? '#FFFFFF' : 'rgba(255,255,255,0.4)'}
            />
          );
        },
        tabBarLabel:           route.name,
        tabBarActiveTintColor:   '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.4)',
        tabBarStyle: {
          backgroundColor:  '#111111',
          borderTopWidth:   0.5,
          borderTopColor:   'rgba(255,255,255,0.08)',
          elevation:        0,
          shadowOpacity:    0,
        },
        tabBarLabelStyle: {
          fontSize:     11,
          fontWeight:   '600',
          letterSpacing: 0.5,
        },
        tabBarIconStyle: { marginTop: 2 },
      })}
    >
      <Tab.Screen name="Workout"  component={WorkoutScreen}       />
      <Tab.Screen name="Timer"    component={TimerTabPlaceholder} />
      <Tab.Screen name="Settings" component={SettingsScreen}      />
    </Tab.Navigator>
  );
}

// ─── Root stack navigator ─────────────────────────────────────────────────────

export default function RootNavigator() {
  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      <Root.Screen name="MainTabs"    component={MainTabs} />
      <Root.Screen
        name="ActiveTimer"
        component={TimerScreen}
        options={{
          animation:      'slide_from_bottom',
          gestureEnabled: false, // back handled via our own button + Alert
        }}
      />
    </Root.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  placeholderText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 14,
    letterSpacing: 0.5,
  },
});
