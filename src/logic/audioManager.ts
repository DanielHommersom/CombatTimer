import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { BELL_SOUNDS } from '../data/bellSounds';
import { SETTINGS_KEYS } from '../hooks/useSettings';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function soundsOn(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEYS.soundsEnabled);
  return raw !== 'false';
}

async function getVolume(): Promise<number> {
  return parseFloat((await AsyncStorage.getItem(SETTINGS_KEYS.volume)) ?? '0.8');
}

async function vibrationOn(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEYS.vibrationEnabled);
  return raw !== 'false';
}

// ─── AudioManager ─────────────────────────────────────────────────────────────

class AudioManager {
  private bellSound: Audio.Sound | null = null;
  private loadedBellId: string | null = null;

  async init(): Promise<void> {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
    });
  }

  private async loadBell(): Promise<Audio.Sound | null> {
    const selectedId = (await AsyncStorage.getItem(SETTINGS_KEYS.bellSound)) ?? 'boxing-bell';
    if (this.bellSound && this.loadedBellId === selectedId) return this.bellSound;

    // Unload previous if selection changed
    if (this.bellSound) {
      await this.bellSound.unloadAsync().catch(() => {});
      this.bellSound = null;
    }

    const bell = BELL_SOUNDS.find((b) => b.id === selectedId) ?? BELL_SOUNDS[0];
    if (!bell.file) return null;

    try {
      const { sound } = await Audio.Sound.createAsync(bell.file, { shouldPlay: false });
      this.bellSound = sound;
      this.loadedBellId = selectedId;
      return sound;
    } catch {
      return null;
    }
  }

  private async playBell(): Promise<void> {
    if (!(await soundsOn())) return;
    const sound = await this.loadBell();
    if (!sound) return;
    try {
      const volume = await getVolume();
      await sound.setVolumeAsync(volume);
      await sound.replayAsync();
    } catch {
      // Sound unavailable — skip silently
    }
  }

  async playStart(): Promise<void>   { await this.playBell(); }
  async playWarning(): Promise<void> { /* silent */ }
  async playRest(): Promise<void>    { /* silent */ }
  async playFinish(): Promise<void>  { await this.playBell(); }

  async unload(): Promise<void> {
    if (this.bellSound) {
      await this.bellSound.unloadAsync().catch(() => {});
      this.bellSound = null;
      this.loadedBellId = null;
    }
  }
}

export const audioManager = new AudioManager();

// ─── Phase feedback (haptics) ─────────────────────────────────────────────────

export async function playPhaseTransition(): Promise<void> {
  if (!(await vibrationOn())) return;
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}

export async function playRoundEnd(): Promise<void> {
  if (!(await vibrationOn())) return;
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
}

// ─── Bell preview (SettingsScreen) ────────────────────────────────────────────

export async function previewBellSound(id: string): Promise<void> {
  const bell = BELL_SOUNDS.find((b) => b.id === id) ?? BELL_SOUNDS[0];
  if (!bell.file) return;
  try {
    const volume = await getVolume();
    const { sound } = await Audio.Sound.createAsync(bell.file, { shouldPlay: false });
    await sound.setVolumeAsync(volume);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) sound.unloadAsync();
    });
  } catch {
    // Sound unavailable — skip silently
  }
}
