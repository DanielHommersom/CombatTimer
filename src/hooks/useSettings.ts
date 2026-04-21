import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

export const SETTINGS_KEYS = {
  soundsEnabled:     'setting_sounds_enabled',
  volume:            'setting_volume',
  vibrationEnabled:  'setting_vibration_enabled',
} as const;

export interface Settings {
  soundsEnabled:        boolean;
  setSoundsEnabled:     (value: boolean) => void;
  volume:               number;
  setVolume:            (value: number) => void;
  vibrationEnabled:     boolean;
  setVibrationEnabled:  (value: boolean) => void;
}

export function useSettings(): Settings {
  const [soundsEnabled,    setSoundsEnabledState]    = useState(true);
  const [volume,           setVolumeState]            = useState(0.8);
  const [vibrationEnabled, setVibrationEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet([
      SETTINGS_KEYS.soundsEnabled,
      SETTINGS_KEYS.volume,
      SETTINGS_KEYS.vibrationEnabled,
    ]).then(([[, rawEnabled], [, rawVolume], [, rawVibration]]) => {
      if (rawEnabled   !== null) setSoundsEnabledState(rawEnabled !== 'false');
      if (rawVolume    !== null) setVolumeState(parseFloat(rawVolume));
      if (rawVibration !== null) setVibrationEnabledState(rawVibration !== 'false');
    });
  }, []);

  const setSoundsEnabled = (value: boolean) => {
    setSoundsEnabledState(value);
    AsyncStorage.setItem(SETTINGS_KEYS.soundsEnabled, value ? 'true' : 'false');
  };

  const setVolume = (value: number) => {
    setVolumeState(value);
    AsyncStorage.setItem(SETTINGS_KEYS.volume, String(value));
  };

  const setVibrationEnabled = (value: boolean) => {
    setVibrationEnabledState(value);
    AsyncStorage.setItem(SETTINGS_KEYS.vibrationEnabled, value ? 'true' : 'false');
  };

  return { soundsEnabled, setSoundsEnabled, volume, setVolume, vibrationEnabled, setVibrationEnabled };
}
