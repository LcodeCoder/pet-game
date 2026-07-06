export class AttractionDirector {
  constructor() {
    this.resetForMode(null);
    this.preferences = {};
  }

  setPreferences(preferences) {
    this.preferences = preferences && typeof preferences === 'object' ? { ...preferences } : {};
  }

  resetForMode(mode) {
    this.mode = mode;
    this.startedAt = performance.now?.() || Date.now();
    this.touchCount = 0;
    this.comboHits = 0;
    this.bestCombo = 0;
    this.firstTouchMs = null;
    this.lastTouchAt = this.startedAt;
    this.noTouchMs = 0;
    this.score = 0;
  }

  update(now) {
    this.noTouchMs = Math.max(0, now - this.lastTouchAt);
  }

  recordHit(target, now = performance.now?.() || Date.now()) {
    this.touchCount += 1;
    if (this.firstTouchMs == null) this.firstTouchMs = now - this.startedAt;
    const recent = now - this.lastTouchAt < 1500;
    this.comboHits = recent ? this.comboHits + 1 : 1;
    this.bestCombo = Math.max(this.bestCombo, this.comboHits);
    this.lastTouchAt = now;
    const comboBonus = Math.min(8, this.comboHits);
    const targetBonus = target?.radius ? Math.max(1, 80 / target.radius) : 1;
    this.score += Math.round(10 + comboBonus * 2 + targetBonus);
    return { score: this.score, hits: this.touchCount, combo: this.comboHits };
  }

  metrics(now = performance.now?.() || Date.now()) {
    return {
      modeId: this.mode?.id,
      touchCount: this.touchCount,
      dwellMs: now - this.startedAt,
      comboHits: this.bestCombo,
      noTouchMs: Math.max(0, now - this.lastTouchAt),
      firstTouchMs: this.firstTouchMs ?? undefined,
      score: this.score,
    };
  }

  mergePreference(modeId, metrics = this.metrics()) {
    if (!modeId) return this.preferences;
    const key = String(modeId);
    const previous = this.preferences[key] || { plays: 0, score: 0, touches: 0, bestCombo: 0 };
    const firstTouchBonus = metrics.firstTouchMs == null ? 0 : Math.max(0, 10 - metrics.firstTouchMs / 1000);
    const sessionScore = metrics.touchCount * 3 + metrics.comboHits * 1.5 + firstTouchBonus + Math.min(8, metrics.dwellMs / 30000);
    this.preferences[key] = {
      plays: previous.plays + 1,
      score: Number((previous.score * 0.7 + sessionScore * 0.3).toFixed(2)),
      touches: previous.touches + metrics.touchCount,
      bestCombo: Math.max(previous.bestCombo, metrics.comboHits),
    };
    return this.preferences;
  }
}
