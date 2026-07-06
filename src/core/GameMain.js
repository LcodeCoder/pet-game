import { MODE_CATALOG, getModeById } from './modeCatalog.js';
import { RotationDirector } from './RotationDirector.js';
import { AnimalSpawner } from '../gameplay/AnimalSpawner.js';
import { AttractionDirector } from '../gameplay/AttractionDirector.js';
import { TouchCollider } from '../gameplay/TouchCollider.js';
import { GameData, DEFAULT_SETTINGS, sanitizeSettings } from '../data/GameData.js';
import { AudioManager } from '../services/AudioManager.js';
import { AdManager } from '../services/AdManager.js';
import { PerformanceMonitor } from '../services/PerformanceMonitor.js';
import { Hud } from '../ui/Hud.js';

export class GameMain {
  constructor({ canvas, documentRef = document, windowRef = window } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.document = documentRef;
    this.window = windowRef;
    this.gameData = new GameData();
    this.audio = new AudioManager();
    this.ads = new AdManager();
    this.performance = new PerformanceMonitor();
    this.hud = new Hud(documentRef);
    this.spawner = new AnimalSpawner(canvas);
    this.attraction = new AttractionDirector();
    this.rotation = new RotationDirector();
    this.touch = new TouchCollider(canvas, (point) => this.handlePointer(point), this.performance);
    this.settings = { ...DEFAULT_SETTINGS };
    this.mode = MODE_CATALOG[0];
    this.running = false;
    this.lastFrameAt = 0;
    this.modeStartedAt = 0;
    this.playStartedAt = 0;
    this.restShown = false;
    this.switchingMode = false;
    this.longPressTimer = null;
    this.handleResize = this.handleResize.bind(this);
    this.loop = this.loop.bind(this);
  }

  async init() {
    this.settings = await this.gameData.loadSettings();
    const preferences = await this.gameData.loadPreferences();
    const recentModes = await this.gameData.loadRecentModes();
    this.rotation = new RotationDirector({ recentModes, preferences });
    this.attraction.setPreferences(preferences);
    this.audio.configure(this.settings);
    await this.ads.preload();
    this.bindUi();
    this.bindLongPressSettings();
    this.resize();
    this.startMode(getModeById(recentModes[0]) || MODE_CATALOG[0], { savePrevious: false });
    this.hud.setSettings(this.settings);
    this.hud.updateStats({ mode: this.mode, score: 0, hits: 0, combo: 0, fps: 0 });
    this.drawIdle();
  }

  bindUi() {
    this.hud.bindHandlers({
      onStart: () => this.start(),
      onNextMode: () => this.nextMode(),
      onOpenSettings: () => this.hud.showSettings(true),
      onCloseSettings: () => this.hud.showSettings(false),
      onSaveSettings: () => this.saveSettingsFromHud(),
      onResetSettings: () => this.resetSettings(),
      onDismissRest: () => this.hud.showRestPrompt(false),
    });
    this.window.addEventListener('resize', this.handleResize);
    this.window.addEventListener('orientationchange', this.handleResize);
  }

  bindLongPressSettings() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.target !== this.canvas) return;
      clearTimeout(this.longPressTimer);
      this.longPressTimer = setTimeout(() => this.hud.showSettings(true), 2000);
    });
    for (const eventName of ['pointerup', 'pointercancel', 'pointermove']) {
      this.canvas.addEventListener(eventName, () => clearTimeout(this.longPressTimer));
    }
  }

  async start() {
    await this.audio.unlock();
    this.audio.configure(this.settings);
    this.hud.showStart(false);
    this.running = true;
    this.playStartedAt = performance.now();
    this.modeStartedAt = this.playStartedAt;
    this.lastFrameAt = this.playStartedAt;
    this.touch.enable();
    requestAnimationFrame(this.loop);
  }

  async startMode(mode, { savePrevious = true } = {}) {
    const now = performance.now();
    if (savePrevious && this.mode) {
      const preferences = this.attraction.mergePreference(this.mode.id, this.attraction.metrics(now));
      this.rotation.setPreferences(preferences);
      await this.gameData.savePreferences(preferences);
      await this.gameData.saveRecentModes(this.rotation.recordMode(this.mode.id));
    }
    this.mode = mode;
    this.modeStartedAt = now;
    this.spawner.reset(mode, this.settings);
    this.attraction.resetForMode(mode);
    this.audio.playModeCue(mode);
    this.hud.updateStats({ mode, score: 0, hits: 0, combo: 0, fps: this.performance.fps });
  }

  async nextMode() {
    if (this.switchingMode) return;
    this.switchingMode = true;
    try {
      const next = this.rotation.chooseNextMode(this.settings, this.mode?.id);
      await this.ads.maybeShowInterstitial('manual-next-mode');
      await this.startMode(next);
    } finally {
      this.switchingMode = false;
    }
  }

  async saveSettingsFromHud() {
    this.settings = sanitizeSettings(this.hud.readSettings(this.settings));
    this.audio.configure(this.settings);
    await this.gameData.saveSettings(this.settings);
    this.hud.setSettings(this.settings);
    this.hud.showSettings(false);
    this.spawner.reset(this.mode, this.settings);
  }

  async resetSettings() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.audio.configure(this.settings);
    await this.gameData.saveSettings(this.settings);
    this.hud.setSettings(this.settings);
    this.spawner.reset(this.mode, this.settings);
  }

  handlePointer(point) {
    const target = TouchCollider.hitTest(point, this.spawner.targets);
    if (!target) return;
    this.spawner.hitTarget(target, point);
    const stats = this.attraction.recordHit(target, performance.now());
    this.audio.playHitCue(this.mode);
    this.hud.updateStats({ mode: this.mode, score: stats.score, hits: stats.hits, combo: stats.combo, fps: this.performance.fps });
  }

  loop(now) {
    if (!this.running) return;
    const deltaMs = Math.min(48, now - this.lastFrameAt || 16.7);
    this.lastFrameAt = now;
    this.performance.update(deltaMs);
    this.attraction.update(now);
    this.spawner.update(deltaMs, this.settings);
    this.spawner.draw(this.ctx, now);

    const modeDuration = this.settings.rotationStrategy === 'highStimShort' ? 28_000 : 45_000;
    if (!this.switchingMode && now - this.modeStartedAt > modeDuration) {
      this.nextMode();
    }

    if (!this.restShown && now - this.playStartedAt > 10 * 60 * 1000) {
      this.restShown = true;
      this.settings = { ...this.settings, stimulation: 'calm' };
      this.hud.setSettings(this.settings);
      this.hud.showRestPrompt(true);
    }

    const metrics = this.attraction.metrics(now);
    if (metrics.noTouchMs > 90_000 && this.settings.stimulation !== 'calm') {
      this.settings = { ...this.settings, targetSize: 'large', stimulation: 'calm' };
      this.hud.setSettings(this.settings);
      this.spawner.reset(this.mode, this.settings);
    }

    const perf = this.performance.snapshot();
    this.hud.updateStats({ mode: this.mode, score: metrics.score, hits: metrics.touchCount, combo: this.attraction.comboHits, fps: perf.fps });
    requestAnimationFrame(this.loop);
  }

  drawIdle() {
    this.spawner.draw(this.ctx, performance.now());
  }

  handleResize() {
    this.resize();
    this.spawner.reset(this.mode, this.settings);
    this.drawIdle();
  }

  resize() {
    const dpr = Math.min(2, this.window.devicePixelRatio || 1);
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(960, Math.floor(rect.width * dpr));
    const height = Math.max(540, Math.floor(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }
}
