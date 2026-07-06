export class Hud {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.elements = {
      modeName: documentRef.getElementById('modeName'),
      score: documentRef.getElementById('score'),
      hits: documentRef.getElementById('hits'),
      combo: documentRef.getElementById('combo'),
      fps: documentRef.getElementById('fps'),
      settingsPanel: documentRef.getElementById('settingsPanel'),
      startOverlay: documentRef.getElementById('startOverlay'),
      restPrompt: documentRef.getElementById('restPrompt'),
      speedLevel: documentRef.getElementById('speedLevel'),
      targetSize: documentRef.getElementById('targetSize'),
      stimulation: documentRef.getElementById('stimulation'),
      soundLevel: documentRef.getElementById('soundLevel'),
      rotationStrategy: documentRef.getElementById('rotationStrategy'),
      muted: documentRef.getElementById('muted'),
    };
  }

  bindHandlers({ onStart, onNextMode, onOpenSettings, onCloseSettings, onSaveSettings, onResetSettings, onDismissRest }) {
    this.document.getElementById('startButton')?.addEventListener('click', onStart);
    this.document.getElementById('nextModeButton')?.addEventListener('click', onNextMode);
    this.document.getElementById('settingsButton')?.addEventListener('click', onOpenSettings);
    this.document.getElementById('closeSettingsButton')?.addEventListener('click', onCloseSettings);
    this.document.getElementById('saveSettingsButton')?.addEventListener('click', onSaveSettings);
    this.document.getElementById('resetButton')?.addEventListener('click', onResetSettings);
    this.document.getElementById('dismissRestButton')?.addEventListener('click', onDismissRest);
  }

  updateStats({ mode, score, hits, combo, fps }) {
    if (this.elements.modeName && mode) this.elements.modeName.textContent = mode.name;
    if (this.elements.score) this.elements.score.textContent = String(score ?? 0);
    if (this.elements.hits) this.elements.hits.textContent = String(hits ?? 0);
    if (this.elements.combo) this.elements.combo.textContent = String(combo ?? 0);
    if (this.elements.fps) this.elements.fps.textContent = fps ? String(fps) : '--';
  }

  setSettings(settings) {
    for (const key of ['speedLevel', 'targetSize', 'stimulation', 'soundLevel', 'rotationStrategy']) {
      if (this.elements[key]) this.elements[key].value = String(settings[key]);
    }
    if (this.elements.muted) this.elements.muted.checked = Boolean(settings.muted);
  }

  readSettings(current) {
    return {
      ...current,
      speedLevel: Number(this.elements.speedLevel?.value || current.speedLevel),
      targetSize: this.elements.targetSize?.value || current.targetSize,
      stimulation: this.elements.stimulation?.value || current.stimulation,
      soundLevel: this.elements.soundLevel?.value || current.soundLevel,
      rotationStrategy: this.elements.rotationStrategy?.value || current.rotationStrategy,
      muted: Boolean(this.elements.muted?.checked),
    };
  }

  showSettings(visible) {
    this.elements.settingsPanel?.classList.toggle('visible', visible);
    this.elements.settingsPanel?.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  showStart(visible) {
    this.elements.startOverlay?.classList.toggle('visible', visible);
  }

  showRestPrompt(visible) {
    this.elements.restPrompt?.classList.toggle('visible', visible);
    this.elements.restPrompt?.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }
}
