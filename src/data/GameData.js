import { StorageService } from '../services/StorageService.js';

export const DEFAULT_SETTINGS = Object.freeze({
  speedLevel: 2,
  targetSize: 'medium',
  stimulation: 'standard',
  soundLevel: 'soft',
  rotationStrategy: 'auto',
  muted: false,
});

const VALID = Object.freeze({
  speedLevel: new Set([1, 2, 3]),
  targetSize: new Set(['small', 'medium', 'large']),
  stimulation: new Set(['calm', 'standard', 'active']),
  soundLevel: new Set(['off', 'soft', 'standard', 'active']),
  rotationStrategy: new Set(['auto', 'calmOnly', 'highStimShort', 'mixed']),
});

export function sanitizeSettings(input = {}) {
  const settings = { ...DEFAULT_SETTINGS, ...(input && typeof input === 'object' ? input : {}) };
  return {
    speedLevel: VALID.speedLevel.has(Number(settings.speedLevel)) ? Number(settings.speedLevel) : DEFAULT_SETTINGS.speedLevel,
    targetSize: VALID.targetSize.has(settings.targetSize) ? settings.targetSize : DEFAULT_SETTINGS.targetSize,
    stimulation: VALID.stimulation.has(settings.stimulation) ? settings.stimulation : DEFAULT_SETTINGS.stimulation,
    soundLevel: VALID.soundLevel.has(settings.soundLevel) ? settings.soundLevel : DEFAULT_SETTINGS.soundLevel,
    rotationStrategy: VALID.rotationStrategy.has(settings.rotationStrategy) ? settings.rotationStrategy : DEFAULT_SETTINGS.rotationStrategy,
    muted: Boolean(settings.muted),
  };
}

export class GameData {
  constructor(storage = new StorageService()) {
    this.storage = storage;
  }

  async loadSettings() {
    return sanitizeSettings(await this.storage.get('settings', DEFAULT_SETTINGS));
  }

  async saveSettings(settings) {
    return this.storage.set('settings', sanitizeSettings(settings));
  }

  async loadPreferences() {
    const value = await this.storage.get('preferences', {});
    return value && typeof value === 'object' ? value : {};
  }

  async savePreferences(preferences) {
    return this.storage.set('preferences', preferences && typeof preferences === 'object' ? preferences : {});
  }

  async loadRecentModes() {
    const value = await this.storage.get('recentModes', []);
    return Array.isArray(value) ? value.map(Number).filter(Number.isFinite).slice(0, 3) : [];
  }

  async saveRecentModes(modeIds) {
    const recent = Array.isArray(modeIds) ? modeIds.map(Number).filter(Number.isFinite).slice(0, 3) : [];
    return this.storage.set('recentModes', recent);
  }
}
