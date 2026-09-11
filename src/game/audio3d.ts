class AudioSystem3D {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
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

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3, freqEnd?: number) {
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

  private playNoise(duration: number, volume = 0.2, filterFreq = 2000) {
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
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start();
  }

  collect() {
    this.playTone(880, 0.15, 'sine', 0.2, 1760);
    setTimeout(() => this.playTone(1320, 0.1, 'sine', 0.15, 2640), 80);
  }

  crash() {
    this.playNoise(0.5, 0.4, 3000);
    this.playTone(100, 0.4, 'sawtooth', 0.3, 30);
    this.playTone(60, 0.6, 'square', 0.2, 20);
  }

  nearMiss() {
    this.playTone(440, 0.08, 'sine', 0.1, 880);
  }

  speedUp() {
    this.playTone(200, 0.3, 'sawtooth', 0.15, 400);
  }

  startEngine() {
    if (!this.enabled || !this.ctx || !this.masterGain) return;
    if (this.engineOsc) return;
    
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 80;
    this.engineGain.gain.value = 0.05;
    this.engineOsc.connect(this.engineGain);
    this.engineGain.connect(this.masterGain);
    this.engineOsc.start();
  }

  updateEngine(speed: number) {
    if (!this.engineOsc || !this.engineGain) return;
    const freq = 60 + speed * 30;
    this.engineOsc.frequency.setTargetAtTime(freq, this.ctx!.currentTime, 0.1);
    this.engineGain.gain.setTargetAtTime(0.03 + speed * 0.01, this.ctx!.currentTime, 0.1);
  }

  stopEngine() {
    if (this.engineOsc) {
      this.engineOsc.stop();
      this.engineOsc = null;
      this.engineGain = null;
    }
  }

  gameOver() {
    this.stopEngine();
    this.playTone(400, 0.3, 'square', 0.2, 200);
    setTimeout(() => this.playTone(300, 0.3, 'square', 0.2, 150), 300);
    setTimeout(() => this.playTone(200, 0.5, 'square', 0.2, 80), 600);
  }
}

export const audio3d = new AudioSystem3D();
