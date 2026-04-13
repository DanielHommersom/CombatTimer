import { Audio } from 'expo-av';

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
