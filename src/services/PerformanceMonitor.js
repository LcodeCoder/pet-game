export class PerformanceMonitor {
  constructor() {
    this.frames = 0;
    this.elapsed = 0;
    this.fps = 0;
    this.lastTouchLatencyMs = 0;
  }

  update(deltaMs) {
    this.frames += 1;
    this.elapsed += deltaMs;
    if (this.elapsed >= 1000) {
      this.fps = Math.round((this.frames * 1000) / this.elapsed);
      this.frames = 0;
      this.elapsed = 0;
    }
  }

  recordTouchLatency(eventTime) {
    this.lastTouchLatencyMs = Math.max(0, performance.now() - eventTime);
  }

  snapshot() {
    return { fps: this.fps, touchLatencyMs: Math.round(this.lastTouchLatencyMs) };
  }
}
