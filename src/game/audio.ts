import { GameSettings } from './types';

class RetroAudioEngine {
  private ctx: AudioContext | null = null;
  private settings: GameSettings = {
    musicVolume: 0.45,
    sfxVolume: 0.7,
    musicEnabled: true,
    sfxEnabled: true,
  };
  private bgmInterval: number | null = null;
  private step = 0;
  private isBossTrack = false;
  private isPlayingBgm = false;

  public updateSettings(settings: GameSettings): void {
    this.settings = { ...settings };
    if (!this.settings.musicEnabled || this.settings.musicVolume <= 0.01) {
      this.stopMusic();
    } else if (this.isPlayingBgm && this.bgmInterval === null) {
      this.startMusicLoop();
    }
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlock(): void {
    this.ensureContext();
  }

  public startMusic(bossMode = false): void {
    this.isPlayingBgm = true;
    this.isBossTrack = bossMode;
    if (!this.settings.musicEnabled || this.settings.musicVolume <= 0.01) {
      this.stopMusicIntervalOnly();
      return;
    }
    this.startMusicLoop();
  }

  public setBossTrack(bossMode: boolean): void {
    if (this.isBossTrack === bossMode) return;
    this.isBossTrack = bossMode;
    if (this.isPlayingBgm && this.settings.musicEnabled) {
      this.startMusicLoop();
    }
  }

  public stopMusic(): void {
    this.isPlayingBgm = false;
    this.stopMusicIntervalOnly();
  }

  private stopMusicIntervalOnly(): void {
    if (this.bgmInterval !== null) {
      window.clearInterval(this.bgmInterval);
      this.bgmInterval = null;
    }
  }

  private startMusicLoop(): void {
    this.stopMusicIntervalOnly();
    const tempoMs = this.isBossTrack ? 135 : 165;
    this.step = 0;

    const normalLead = [
      330, 0, 392, 440, 392, 0, 330, 294,
      262, 0, 330, 392, 440, 392, 330, 0,
      349, 0, 440, 523, 494, 0, 440, 392,
      330, 392, 440, 392, 330, 294, 262, 0,
    ];
    const normalBass = [
      110, 110, 165, 110, 110, 110, 165, 147,
      131, 131, 196, 131, 131, 131, 196, 165,
      175, 175, 220, 175, 196, 196, 247, 196,
      165, 165, 220, 165, 147, 147, 131, 131,
    ];

    const bossLead = [
      220, 262, 330, 220, 349, 330, 294, 262,
      220, 262, 330, 392, 440, 392, 349, 330,
      196, 247, 294, 349, 330, 294, 262, 247,
      220, 0, 440, 0, 392, 349, 330, 294,
    ];
    const bossBass = [
      110, 110, 220, 110, 110, 110, 220, 110,
      98, 98, 196, 98, 98, 98, 196, 98,
      87, 87, 175, 87, 98, 98, 196, 98,
      110, 110, 220, 110, 131, 147, 165, 196,
    ];

    this.bgmInterval = window.setInterval(() => {
      if (!this.isPlayingBgm || !this.settings.musicEnabled) return;
      const ctx = this.ctx;
      if (!ctx || ctx.state !== 'running') return;

      const vol = this.settings.musicVolume * 0.14;
      if (vol <= 0.001) return;

      const idx = this.step % 32;
      const lead = this.isBossTrack ? bossLead[idx] : normalLead[idx];
      const bass = this.isBossTrack ? bossBass[idx] : normalBass[idx];

      if (lead > 0) {
        this.playTone(lead, 0.11, 'square', vol * 0.7, lead * 0.99);
      }
      if (bass > 0) {
        this.playTone(bass, 0.13, 'triangle', vol * 0.9, bass);
      }
      this.step++;
    }, tempoMs);
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType,
    volume: number,
    endFreq?: number,
    delay = 0
  ): void {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    if (endFreq && endFreq !== freq) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
    }

    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  private playNoise(duration: number, volume: number, highpass = 600): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const sampleCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, sampleCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = highpass;

    const gain = ctx.createGain();
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(Math.max(0.0001, volume), now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  }

  private sfxVol(scale = 1): number {
    if (!this.settings.sfxEnabled) return 0;
    return this.settings.sfxVolume * 0.25 * scale;
  }

  public shootPistol(): void {
    const v = this.sfxVol(0.8);
    if (!v) return;
    this.playTone(540, 0.08, 'square', v, 160);
    this.playNoise(0.05, v * 0.5, 1400);
  }

  public shootRifle(): void {
    const v = this.sfxVol(0.65);
    if (!v) return;
    this.playTone(680, 0.055, 'sawtooth', v, 190);
    this.playNoise(0.04, v * 0.6, 1800);
  }

  public shootLaser(): void {
    const v = this.sfxVol(0.85);
    if (!v) return;
    this.playTone(1180, 0.14, 'sawtooth', v, 240);
    this.playTone(880, 0.11, 'sine', v * 0.6, 420);
  }

  public hit(): void {
    const v = this.sfxVol(0.55);
    if (!v) return;
    this.playTone(220, 0.06, 'square', v, 110);
  }

  public playerHurt(): void {
    const v = this.sfxVol(0.95);
    if (!v) return;
    this.playTone(240, 0.18, 'sawtooth', v, 75);
    this.playNoise(0.12, v * 0.7, 300);
  }

  public explosion(): void {
    const v = this.sfxVol(0.95);
    if (!v) return;
    this.playNoise(0.24, v * 1.1, 140);
    this.playTone(130, 0.22, 'sawtooth', v * 0.8, 35);
  }

  public coin(): void {
    const v = this.sfxVol(0.75);
    if (!v) return;
    this.playTone(988, 0.07, 'square', v, 988, 0);
    this.playTone(1319, 0.14, 'square', v, 1319, 0.065);
  }

  public heart(): void {
    const v = this.sfxVol(0.85);
    if (!v) return;
    this.playTone(523, 0.08, 'triangle', v, 523, 0);
    this.playTone(659, 0.08, 'triangle', v, 659, 0.08);
    this.playTone(784, 0.16, 'triangle', v, 784, 0.16);
  }

  public uiClick(): void {
    const v = this.sfxVol(0.5);
    if (!v) return;
    this.playTone(660, 0.045, 'square', v, 880);
  }

  public upgrade(): void {
    const v = this.sfxVol(0.85);
    if (!v) return;
    this.playTone(440, 0.08, 'square', v, 440, 0);
    this.playTone(554, 0.08, 'square', v, 554, 0.07);
    this.playTone(659, 0.08, 'square', v, 659, 0.14);
    this.playTone(880, 0.18, 'square', v, 880, 0.21);
  }

  public bossWarning(): void {
    const v = this.sfxVol(1.0);
    if (!v) return;
    for (let i = 0; i < 3; i++) {
      this.playTone(320, 0.16, 'sawtooth', v, 180, i * 0.22);
    }
  }

  public levelClear(): void {
    const v = this.sfxVol(0.95);
    if (!v) return;
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === 3 ? 0.28 : 0.1, 'square', v, n, idx * 0.11);
    });
  }

  public youWin(): void {
    const v = this.sfxVol(1.0);
    if (!v) return;
    const notes = [523, 659, 784, 659, 784, 1046, 1318];
    const times = [0, 0.1, 0.2, 0.3, 0.4, 0.52, 0.68];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === notes.length - 1 ? 0.45 : 0.11, 'square', v, n, times[idx]);
    });
  }

  public gameOver(): void {
    const v = this.sfxVol(0.95);
    if (!v) return;
    const notes = [392, 349, 311, 261];
    notes.forEach((n, idx) => {
      this.playTone(n, idx === 3 ? 0.45 : 0.16, 'sawtooth', v, n * 0.95, idx * 0.17);
    });
  }
}

export const audio = new RetroAudioEngine();
