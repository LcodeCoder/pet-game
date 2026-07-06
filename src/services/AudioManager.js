export class AudioManager {
  constructor() {
    this.context = null;
    this.enabled = false;
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
  }

  playHitCue(mode) {
    if (!this.context || !this.enabled || !this.settings || this.settings.muted || this.settings.soundLevel === 'off') return;
    const gainByLevel = { soft: 0.035, standard: 0.06, active: 0.09 };
    const gainValue = gainByLevel[this.settings.soundLevel] ?? 0.035;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = mode.sound?.type || 'sine';
    oscillator.frequency.value = mode.sound?.frequency || 440;
    gain.gain.setValueAtTime(0.0001, this.context.currentTime);
    gain.gain.exponentialRampToValueAtTime(gainValue, this.context.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + 0.14);
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.16);
  }

  playModeCue(mode) {
    if (!this.context || !this.enabled || this.settings?.muted || this.settings?.soundLevel === 'off') return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = Math.max(120, (mode.sound?.frequency || 320) * 0.5);
    gain.gain.value = 0.02;
    oscillator.connect(gain);
    gain.connect(this.context.destination);
    oscillator.start();
    oscillator.stop(this.context.currentTime + 0.28);
  }
}
