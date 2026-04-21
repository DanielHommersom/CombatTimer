import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { BELL_SOUNDS } from '../data/bellSounds';
import { SETTINGS_KEYS } from '../hooks/useSettings';

type SoundKey = 'start' | 'warning' | 'rest' | 'finish';

// Frequencies (Hz) and durations (ms) for generated tones via short silence files.
// Since we're using expo-av without bundled assets, we generate beeps programmatically
// using the system's built-in sounds or handle silence gracefully.
//
// Replace the `require` paths below with actual asset files when available.
// e.g.: require('../../assets/sounds/bell.mp3')

const SOUND_CONFIG: Record<SoundKey, { uri?: string; fallback: boolean }> = {
  start:   { fallback: true },
  warning: { fallback: true },
  rest:    { fallback: true },
  finish:  { fallback: true },
};

class AudioManager {
  private sounds: Partial<Record<SoundKey, Audio.Sound>> = {};
  private enabled = true;

  async init(): Promise<void> {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }

  setEnabled(value: boolean): void {
    this.enabled = value;
  }

  async play(key: SoundKey): Promise<void> {
    const raw = await AsyncStorage.getItem(SETTINGS_KEYS.soundsEnabled);
    if (raw === 'false') return;
    if (!this.enabled) return;

    const config = SOUND_CONFIG[key];
    if (config.uri) {
      try {
        let sound = this.sounds[key];
        if (!sound) {
          const { sound: loaded } = await Audio.Sound.createAsync({ uri: config.uri });
          this.sounds[key] = loaded;
          sound = loaded;
        }
        const volume = parseFloat((await AsyncStorage.getItem(SETTINGS_KEYS.volume)) ?? '0.8');
        await sound.setVolumeAsync(volume);
        await sound.replayAsync();
      } catch {
        // Asset not available — silently skip
      }
    }
    // When no URI, the caller can handle UI feedback (vibration, flash, etc.)
  }

  async playStart(): Promise<void>   { await this.play('start'); }
  async playWarning(): Promise<void> { await this.play('warning'); }
  async playRest(): Promise<void>    { await this.play('rest'); }
  async playFinish(): Promise<void>  { await this.play('finish'); }

  async unload(): Promise<void> {
    for (const sound of Object.values(this.sounds)) {
      await sound?.unloadAsync();
    }
    this.sounds = {};
  }
}

export const audioManager = new AudioManager();

async function vibrationEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEYS.vibrationEnabled);
  return raw !== 'false';
}

export async function playPhaseTransition(): Promise<void> {
  if (!(await vibrationEnabled())) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function playRoundEnd(): Promise<void> {
  if (!(await vibrationEnabled())) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

export async function loadBellSound(): Promise<Audio.Sound> {
  const selectedId = (await AsyncStorage.getItem(SETTINGS_KEYS.bellSound)) ?? 'boxing-bell';
  const bell = BELL_SOUNDS.find((b) => b.id === selectedId) ?? BELL_SOUNDS[0];
  const { sound } = await Audio.Sound.createAsync(bell.file);
  return sound;
}

export async function previewBellSound(id: string): Promise<void> {
  const bell = BELL_SOUNDS.find((b) => b.id === id) ?? BELL_SOUNDS[0];
  try {
    const volume = parseFloat((await AsyncStorage.getItem(SETTINGS_KEYS.volume)) ?? '0.8');
    const { sound } = await Audio.Sound.createAsync(bell.file);
    await sound.setVolumeAsync(volume);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch {
    // Sound file not yet available — silently skip
  }
}
