import { MODE_CATALOG, getModeById } from './modeCatalog.js';
import { RotationDirector } from './RotationDirector.js';
import { AnimalSpawner } from '../gameplay/AnimalSpawner.js';
import { AttractionDirector } from '../gameplay/AttractionDirector.js';
import { TouchCollider } from '../gameplay/TouchCollider.js';
import { GameData, DEFAULT_SETTINGS, sanitizeSettings } from '../data/GameData.js';
import { AudioManager } from '../services/AudioManager.js';
import { AdManager } from '../services/AdManager.js';
import { AuthService } from '../services/AuthService.js';
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
    this.auth = new AuthService();
    this.performance = new PerformanceMonitor();
    this.hud = new Hud(documentRef);
    this.spawner = new AnimalSpawner(canvas);
    this.attraction = new AttractionDirector();
    this.rotation = new RotationDirector();
    this.touch = new TouchCollider(canvas, (point) => this.handlePointer(point), this.performance);
    this.settings = { ...DEFAULT_SETTINGS };
    this.mode = MODE_CATALOG[0];
    this.running = false;
    this.state = 'home';
    this.lastFrameAt = 0;
    this.modeStartedAt = 0;
    this.playStartedAt = 0;
    this.accumulatedSessionMs = 0;
    this.restShown = false;
    this.switchingMode = false;
    this.longPressTimer = null;
    this.sessionSaved = false;
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
    await this.startMode(getModeById(recentModes[0]) || MODE_CATALOG[0], { savePrevious: false });
    this.hud.setSettings(this.settings);
    this.hud.updateStats({ mode: this.mode, score: 0, hits: 0, combo: 0, fps: 0 });
    await this.refreshHistory();
    this.drawIdle();
  }

  bindUi() {
    this.hud.bindHandlers({
      onStart: () => this.start(),
      onPlayAgain: () => this.start(),
      onNextMode: () => this.nextMode(),
      onOpenSettings: () => this.openSettings(),
      onCloseSettings: () => this.hud.showSettings(false),
      onSaveSettings: () => this.saveSettingsFromHud(),
      onOpenHistory: () => this.openHistory(),
      onCloseHistory: () => this.hud.showHistory(false),
      onPause: () => this.pause(),
      onResume: () => this.resume(),
      onBackHome: () => this.endRoundAndShowSummary(),
      onSummaryHome: () => this.goHome(),
      onGoHome: () => this.goHome(),
      onDismissRest: () => this.hud.showRestPrompt(false),
      onLoginMock: () => this.auth.loginMock(),
    });
    this.window.addEventListener('resize', this.handleResize);
    this.window.addEventListener('orientationchange', this.handleResize);
  }

  bindLongPressSettings() {
    this.canvas.addEventListener('pointerdown', (event) => {
      if (event.target !== this.canvas || this.state !== 'playing') return;
      clearTimeout(this.longPressTimer);
      this.longPressTimer = setTimeout(() => this.openSettings(), 2200);
    });
    for (const eventName of ['pointerup', 'pointercancel', 'pointermove']) {
      this.canvas.addEventListener(eventName, () => clearTimeout(this.longPressTimer));
    }
  }

  now() { return this.window.performance?.now?.() ?? performance.now?.() ?? Date.now(); }
  requestFrame() { (this.window.requestAnimationFrame || requestAnimationFrame)(this.loop); }

  async start() {
    await this.audio.unlock();
    this.audio.configure(this.settings);
    this.hud.hideAllPanels();
    this.hud.showHome(false);
    this.hud.showSummary(false);
    this.state = 'playing';
    this.running = true;
    this.sessionSaved = false;
    this.accumulatedSessionMs = 0;
    this.playStartedAt = this.now();
    this.modeStartedAt = this.playStartedAt;
    this.lastFrameAt = this.playStartedAt;
    await this.startMode(this.mode || MODE_CATALOG[0], { savePrevious: false });
    this.touch.enable();
    this.audio.startAmbient();
    this.requestFrame();
  }

  async startMode(mode, { savePrevious = true } = {}) {
    const now = this.now();
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

  openSettings() { this.hud.showSettings(true); }

  async openHistory() {
    await this.refreshHistory();
    this.hud.showSettings(false);
    this.hud.showHistory(true);
  }

  async refreshHistory() {
    this.hud.renderHistory(await this.gameData.loadHistory());
  }

  pause() {
    if (this.state !== 'playing' || !this.running) return;
    this.accumulatedSessionMs += this.now() - this.playStartedAt;
    this.running = false;
    this.state = 'paused';
    this.touch.disable();
    this.audio.stopAmbient();
    this.hud.showPause(true);
    this.spawner.draw(this.ctx, this.now());
  }

  resume() {
    if (this.state !== 'paused') return;
    this.hud.showPause(false);
    this.state = 'playing';
    this.running = true;
    this.playStartedAt = this.now();
    this.lastFrameAt = this.playStartedAt;
    this.touch.enable();
    this.audio.startAmbient();
    this.requestFrame();
  }

  async saveSettingsFromHud() {
    this.settings = sanitizeSettings(this.hud.readSettings(this.settings));
    this.audio.configure(this.settings);
    await this.gameData.saveSettings(this.settings);
    this.hud.setSettings(this.settings);
    this.hud.showSettings(false);
    this.spawner.reset(this.mode, this.settings);
    this.drawIdle();
  }

  handlePointer(point) {
    if (this.state !== 'playing') return;
    const target = TouchCollider.hitTest(point, this.spawner.targets);
    if (!target) return;
    this.spawner.hitTarget(target, point);
    const stats = this.attraction.recordHit(target, this.now());
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

    const modeDuration = 55_000;
    if (!this.switchingMode && now - this.modeStartedAt > modeDuration) this.nextMode();

    if (!this.restShown && now - this.playStartedAt + this.accumulatedSessionMs > 10 * 60 * 1000) {
      this.restShown = true;
      this.settings = { ...this.settings, speedLevel: 1, stimulation: 'calm' };
      this.hud.setSettings(this.settings);
      this.hud.showRestPrompt(true);
    }

    const metrics = this.attraction.metrics(now);
    const perf = this.performance.snapshot();
    this.hud.updateStats({ mode: this.mode, score: metrics.score, hits: metrics.touchCount, combo: this.attraction.comboHits, fps: perf.fps });
    this.requestFrame();
  }

  async endRoundAndShowSummary() {
    const summary = await this.finishSession();
    this.hud.hideAllPanels();
    this.hud.showHome(false);
    this.hud.updateSummary(summary);
    this.hud.showSummary(true);
    this.state = 'summary';
    await this.refreshHistory();
  }

  async finishSession() {
    if (this.sessionSaved) return { touches: 0, ...(await this.gameData.historySummary()) };
    const now = this.now();
    const metrics = this.attraction.metrics(now);
    const durationMs = Math.max(0, this.accumulatedSessionMs + (this.running ? now - this.playStartedAt : 0));
    this.running = false;
    this.touch.disable();
    this.audio.stopAmbient();
    this.sessionSaved = true;
    const history = await this.gameData.addSession({ touches: metrics.touchCount, score: metrics.score, durationMs, endedAt: new Date().toISOString() });
    const summary = history.reduce((acc, session) => ({
      bestTouches: Math.max(acc.bestTouches, session.touches),
      totalDurationMs: acc.totalDurationMs + session.durationMs,
    }), { bestTouches: 0, totalDurationMs: 0 });
    return { touches: metrics.touchCount, score: metrics.score, durationMs, ...summary };
  }

  goHome() {
    this.running = false;
    this.state = 'home';
    this.touch.disable();
    this.audio.stopAmbient();
    this.hud.hideAllPanels();
    this.hud.showSummary(false);
    this.hud.showHome(true);
    this.drawIdle();
  }

  drawIdle() { this.spawner.draw(this.ctx, this.now()); }

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
