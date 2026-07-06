export class Hud {
  constructor(documentRef = document) {
    this.document = documentRef;
    this.elements = {
      modeName: documentRef.getElementById('modeName'),
      score: documentRef.getElementById('score'),
      hits: documentRef.getElementById('hits'),
      combo: documentRef.getElementById('combo'),
      fps: documentRef.getElementById('fps'),
      homePage: documentRef.getElementById('homePage'),
      startOverlay: documentRef.getElementById('homePage'),
      settingsPanel: documentRef.getElementById('settingsPanel'),
      pausePanel: documentRef.getElementById('pausePanel'),
      summaryPage: documentRef.getElementById('summaryPage'),
      historyPage: documentRef.getElementById('historyPage'),
      restPrompt: documentRef.getElementById('restPrompt'),
      speedLevel: documentRef.getElementById('speedLevel'),
      soundLevel: documentRef.getElementById('soundLevel'),
      summaryTouches: documentRef.getElementById('summaryTouches'),
      summaryBest: documentRef.getElementById('summaryBest'),
      summaryDuration: documentRef.getElementById('summaryDuration'),
      historyList: documentRef.getElementById('historyList'),
    };
  }

  bindHandlers(handlers) {
    const bind = (id, fn) => {
      if (typeof fn === 'function') this.document.getElementById(id)?.addEventListener('click', fn);
    };
    bind('startButton', handlers.onStart);
    bind('nextModeButton', handlers.onNextMode);
    bind('settingsButton', handlers.onOpenSettings);
    bind('pauseButton', handlers.onPause);
    bind('resumeButton', handlers.onResume);
    bind('backHomeButton', handlers.onBackHome);
    bind('closeSettingsButton', handlers.onCloseSettings);
    bind('saveSettingsButton', handlers.onSaveSettings);
    bind('historyButton', handlers.onOpenHistory);
    bind('closeHistoryButton', handlers.onCloseHistory);
    bind('historyHomeButton', handlers.onGoHome || handlers.onBackHome);
    bind('playAgainButton', handlers.onPlayAgain);
    bind('summaryHomeButton', handlers.onSummaryHome || handlers.onBackHome);
    bind('dismissRestButton', handlers.onDismissRest);
    bind('loginMockButton', handlers.onLoginMock);
  }

  updateStats({ mode, score, hits, combo, fps }) {
    if (this.elements.modeName && mode) this.elements.modeName.textContent = mode.name || '小猫逗乐专用';
    if (this.elements.score) this.elements.score.textContent = String(score ?? 0);
    if (this.elements.hits) this.elements.hits.textContent = String(hits ?? 0);
    if (this.elements.combo) this.elements.combo.textContent = String(combo ?? 0);
    if (this.elements.fps) this.elements.fps.textContent = fps ? String(fps) : '--';
  }

  setSettings(settings) {
    if (this.elements.speedLevel) this.elements.speedLevel.value = String(settings.speedLevel);
    if (this.elements.soundLevel) this.elements.soundLevel.value = String(settings.soundLevel);
  }

  readSettings(current) {
    return {
      ...current,
      speedLevel: Number(this.elements.speedLevel?.value || current.speedLevel),
      soundLevel: this.elements.soundLevel?.value || current.soundLevel,
    };
  }

  showHome(visible) { this.toggle(this.elements.homePage, visible); }
  showStart(visible) { this.showHome(visible); }
  showSettings(visible) { this.toggle(this.elements.settingsPanel, visible); }
  showPause(visible) { this.toggle(this.elements.pausePanel, visible); }
  showSummary(visible) { this.toggle(this.elements.summaryPage, visible); }
  showHistory(visible) { this.toggle(this.elements.historyPage, visible); }
  showRestPrompt(visible) { this.toggle(this.elements.restPrompt, visible); }

  hideAllPanels() {
    this.showSettings(false);
    this.showPause(false);
    this.showSummary(false);
    this.showHistory(false);
    this.showRestPrompt(false);
  }

  toggle(element, visible) {
    element?.classList.toggle('visible', Boolean(visible));
    element?.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  updateSummary(stats) {
    if (this.elements.summaryTouches) this.elements.summaryTouches.textContent = String(stats?.touches ?? 0);
    if (this.elements.summaryBest) this.elements.summaryBest.textContent = String(stats?.bestTouches ?? 0);
    if (this.elements.summaryDuration) this.elements.summaryDuration.textContent = formatDuration(stats?.totalDurationMs ?? 0);
  }

  renderHistory(history = []) {
    if (!this.elements.historyList) return;
    if (!history.length) {
      this.elements.historyList.innerHTML = '<div class="history-empty">还没有玩耍记录，开启逗猫后会自动保存。</div>';
      return;
    }
    this.elements.historyList.innerHTML = history.slice(0, 12).map((session, index) => {
      const endedAt = session.endedAt ? new Date(session.endedAt).toLocaleString('zh-CN', { hour12: false }) : `第 ${index + 1} 次`;
      return `<article class="history-item"><div><strong>${endedAt}</strong><span class="history-meta">触碰 ${session.touches || 0} 次 · 分数 ${session.score || 0}</span></div><b>${formatDuration(session.durationMs || 0)}</b></article>`;
    }).join('');
  }
}

export function formatDuration(ms) {
  const minutes = Math.max(0, Math.round(Number(ms || 0) / 60000));
  if (minutes < 1) return '少于 1 分钟';
  return `${minutes} 分钟`;
}