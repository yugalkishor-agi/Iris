import { Audio } from 'expo-av';

class FeedAudioService {
  private sound: Audio.Sound | null = null;
  private activeKey: string | null = null;
  private activeUri: string | null = null;
  private pendingKey: string | null = null;
  private preloadedSound: Audio.Sound | null = null;
  private preloadedUri: string | null = null;
  private loadToken = 0;
  private preloadToken = 0;
  private audioModeConfigured = false;

  private async ensureAudioMode() {
    if (this.audioModeConfigured) return;
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    });
    this.audioModeConfigured = true;
  }

  private async disposeSound(sound: Audio.Sound | null) {
    if (!sound) return;
    try {
      await sound.stopAsync();
    } catch {}
    try {
      await sound.unloadAsync();
    } catch {}
  }

  async preload(uri?: string | null) {
    if (!uri) return;
    if (uri === this.activeUri || uri === this.preloadedUri) return;

    const token = ++this.preloadToken;
    await this.ensureAudioMode();

    const oldPreloaded = this.preloadedSound;
    this.preloadedSound = null;
    this.preloadedUri = null;
    await this.disposeSound(oldPreloaded);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: true,
          volume: 0,
          rate: 1,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 250,
        }
      );

      if (token !== this.preloadToken) {
        await this.disposeSound(sound);
        return;
      }

      this.preloadedSound = sound;
      this.preloadedUri = uri;
    } catch (error) {
      console.error('Feed audio preload failed:', error);
    }
  }

  async play(options: { key: string; uri: string; positionMillis?: number; muted?: boolean }) {
    const { key, uri, positionMillis = 0, muted = false } = options;
    if (!uri) {
      await this.stop(key);
      return;
    }

    const token = ++this.loadToken;
    this.pendingKey = key;
    await this.ensureAudioMode();

    if (this.activeKey === key && this.sound && this.activeUri === uri) {
      try {
        await this.sound.setStatusAsync({
          rate: 1,
          shouldCorrectPitch: true,
          volume: muted ? 0 : 1,
          positionMillis: Math.max(0, Math.floor(positionMillis)),
          shouldPlay: true,
          isLooping: true,
        });
      } catch {}
      return;
    }

    const previousActive = this.sound;
    this.sound = null;
    this.activeKey = null;
    this.activeUri = null;
    await this.disposeSound(previousActive);

    let nextSound: Audio.Sound | null = null;

    if (this.preloadedSound && this.preloadedUri === uri) {
      nextSound = this.preloadedSound;
      this.preloadedSound = null;
      this.preloadedUri = null;
    } else {
      const created = await Audio.Sound.createAsync(
        { uri },
        {
          shouldPlay: false,
          isLooping: true,
          volume: muted ? 0 : 1,
          positionMillis: Math.max(0, Math.floor(positionMillis)),
          rate: 1,
          shouldCorrectPitch: true,
          progressUpdateIntervalMillis: 250,
        }
      );
      nextSound = created.sound;
    }

    if (token !== this.loadToken || this.pendingKey !== key) {
      await this.disposeSound(nextSound);
      return;
    }

    this.sound = nextSound;
    this.activeKey = key;
    this.activeUri = uri;
    this.pendingKey = null;

    try {
      await nextSound.setStatusAsync({
        volume: muted ? 0 : 1,
        positionMillis: Math.max(0, Math.floor(positionMillis)),
        rate: 1,
        shouldCorrectPitch: true,
        shouldPlay: true,
        isLooping: true,
      });
    } catch (error) {
      console.error('Feed audio play failed:', error);
    }
  }

  async setMuted(key: string, muted: boolean) {
    if (this.activeKey !== key || !this.sound) return;
    try {
      await this.sound.setStatusAsync({ volume: muted ? 0 : 1, rate: 1, shouldCorrectPitch: true });
    } catch {}
  }

  async stop(key?: string) {
    if (key && this.activeKey !== key && this.pendingKey !== key) return;

    this.loadToken += 1;
    if (!key || this.pendingKey === key) {
      this.pendingKey = null;
    }

    const sound = this.sound;
    this.sound = null;
    this.activeKey = null;
    this.activeUri = null;

    await this.disposeSound(sound);
  }
}

export const feedAudioService = new FeedAudioService();
