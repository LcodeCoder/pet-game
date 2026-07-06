export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.settings = null;
    this.ambientNodes = null;
  }

  async unlock() {
    if (this.context || typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.context = new AudioContextClass();
    this.enabled = true;
  }

  configure(settings) {
    this.settings = settings;
    if (this.ambientNodes) {
      this.stopAmbient();
      this.startAmbient();
    }
  }

  volume() {
    if (!this.settings || this.settings.muted || this.settings.soundLevel === 'off') return 0;
    const gainByLevel = { soft: 0.018, standard: 0.032, active: 0.032 };
    return gainByLevel[this.settings.soundLevel] ?? 0.018;
  }

  startAmbient() {
    if (!this.context || !this.enabled || this.ambientNodes || this.volume() <= 0) return;
    const rustle = this.context.createOscillator();
    const bell = this.context.createOscillator();
    const gain = this.context.createGain();
    rustle.type = 'triangle';
    rustle.frequency.value = 118;
    bell.type = 'sine';
    bell.frequency.value = 620;
    gain.gain.value = this.volume() * 0.28;
    rustle.connect(gain);
    bell.connect(gain);
    gain.connect(this.context.destination);
    rustle.start();
    bell.start();
    this.ambientNodes = { rustle, bell, gain };
  }

  stopAmbient() {
    if (!this.ambientNodes) return;
    const stopAt = this.context?.currentTime ? this.context.currentTime + 0.04 : undefined;
    try {
      this.ambientNodes.gain.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      this.ambientNodes.rustle.stop(stopAt);
      this.ambientNodes.bell.stop(stopAt);
    } catch {}
    this.ambientNodes = null;
  }

  playHitCue(mode) {
    const baseGain = this.volume();
    if (!this.context || !this.enabled || baseGain <= 0) return;
    this.playTone(mode?.sound?.frequency || 420, 0.11, baseGain * 1.9, mode?.sound?.type || 'sine');
    this.playTone((mode?.sound?.frequency || 420) * 1.52, 0.16, baseGain * 0.75, 'sine', 0.03);
  }

  playModeCue(mode) {
    const baseGain = this.volume();
    if (!this.context || !this.enabled || baseGain <= 0) return;
    this.playTone(Math.max(160, (mode?.sound?.frequency || 320) * 0.72), 0.24, baseGain * 0.85, 'triangle');
  }

  playTone(frequency, duration, gainValue, type = 'sine', delay = 0) {
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    const startAt = this.context.currentTime + delay;
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, gainValue), startAt + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + duration + 0.02);
  }
}
