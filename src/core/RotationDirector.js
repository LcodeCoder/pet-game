import { MODE_CATALOG, modesByStimulation, STIMULATION } from './modeCatalog.js';
import { weightedChoice } from '../utils/random.js';

export class RotationDirector {
  constructor({ recentModes = [], preferences = {} } = {}) {
    this.recentModes = Array.isArray(recentModes) ? recentModes.slice(0, 3) : [];
    this.preferences = preferences && typeof preferences === 'object' ? preferences : {};
  }

  setPreferences(preferences) {
    this.preferences = preferences && typeof preferences === 'object' ? preferences : {};
  }

  recordMode(modeId) {
    this.recentModes = [modeId, ...this.recentModes.filter((id) => id !== modeId)].slice(0, 3);
    return this.recentModes;
  }

  chooseNextMode(settings = {}, currentModeId = null) {
    const strategy = settings.rotationStrategy || 'auto';
    let candidates = modesByStimulation(strategy);

    if (settings.stimulation === 'calm') {
      candidates = candidates.filter((mode) => mode.stimulation !== STIMULATION.HIGH);
    } else if (settings.stimulation === 'active') {
      candidates = candidates.filter((mode) => mode.stimulation !== STIMULATION.LOW || strategy === 'mixed');
    }

    const blocked = new Set([currentModeId, ...this.recentModes].filter(Boolean));
    let freshCandidates = candidates.filter((mode) => !blocked.has(mode.id));
    if (!freshCandidates.length) {
      freshCandidates = candidates.filter((mode) => mode.id !== currentModeId);
    }
    if (!freshCandidates.length) freshCandidates = MODE_CATALOG;

    if (strategy === 'mixed') {
      return freshCandidates[Math.floor(Math.random() * freshCandidates.length)];
    }

    return weightedChoice(freshCandidates, (mode) => {
      const preference = Number(this.preferences[String(mode.id)]?.score || 0);
      const stimulationBonus = mode.stimulation === STIMULATION.MEDIUM ? 1.2 : 1;
      return 1 + preference * 0.15 + stimulationBonus;
    });
  }
}
