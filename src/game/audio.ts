// Audio system using Web Audio API for procedural sound generation
class AudioSystem {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private enabled = true;

  init() {
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.warn('Audio not available');
      this.enabled = false;
    }
  }

  resume() {
    if (this.ctx?.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setEnabled(val: boolean) {
    this.enabled = val;
    if (this.masterGain) {
      this.masterGain.gain.value = val ? 0.3 : 0;
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'square', volume = 0.3, freqEnd?: number) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    if (freqEnd) {
      osc.frequency.exponentialRampToValueAtTime(freqEnd, this.ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime);
    osc.stop(this.ctx.currentTime + duration);
  }

  private playNoise(duration: number, volume = 0.2) {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  shoot() {
    this.playTone(800, 0.1, 'square', 0.15, 200);
  }

  enemyShoot() {
    this.playTone(300, 0.15, 'sawtooth', 0.1, 100);
  }

  explosion() {
    this.playNoise(0.4, 0.3);
    this.playTone(100, 0.3, 'sawtooth', 0.2, 30);
  }

  bigExplosion() {
    this.playNoise(0.6, 0.4);
    this.playTone(80, 0.5, 'sawtooth', 0.3, 20);
    this.playTone(60, 0.7, 'square', 0.2, 15);
  }

  powerUp() {
    this.playTone(400, 0.1, 'sine', 0.2, 800);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2, 1200), 100);
    setTimeout(() => this.playTone(800, 0.15, 'sine', 0.2, 1600), 200);
  }

  hit() {
    this.playTone(200, 0.1, 'square', 0.2, 50);
  }

  playerHit() {
    this.playNoise(0.3, 0.4);
    this.playTone(150, 0.3, 'sawtooth', 0.3, 50);
  }

  gameOver() {
    this.playTone(400, 0.3, 'square', 0.2, 200);
    setTimeout(() => this.playTone(300, 0.3, 'square', 0.2, 150), 300);
    setTimeout(() => this.playTone(200, 0.5, 'square', 0.2, 80), 600);
  }

  waveStart() {
    this.playTone(200, 0.2, 'sine', 0.15, 400);
    setTimeout(() => this.playTone(300, 0.2, 'sine', 0.15, 600), 150);
    setTimeout(() => this.playTone(400, 0.3, 'sine', 0.15, 800), 300);
  }
}

export const audio = new AudioSystem();
