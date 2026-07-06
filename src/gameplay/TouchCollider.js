import { distance } from '../utils/math.js';

export class TouchCollider {
  constructor(canvas, onHit, performanceMonitor) {
    this.canvas = canvas;
    this.onHit = onHit;
    this.performanceMonitor = performanceMonitor;
    this.enabled = false;
    this.handlePointer = this.handlePointer.bind(this);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.canvas.addEventListener('pointerdown', this.handlePointer, { passive: false });
    this.canvas.addEventListener('pointermove', this.handlePointer, { passive: false });
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.canvas.removeEventListener('pointerdown', this.handlePointer);
    this.canvas.removeEventListener('pointermove', this.handlePointer);
  }

  handlePointer(event) {
    if (event.type === 'pointermove' && event.buttons !== 1 && event.pointerType === 'mouse') return;
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const point = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      eventTime: event.timeStamp,
    };
    this.performanceMonitor?.recordTouchLatency(event.timeStamp);
    this.onHit(point);
  }

  static hitTest(point, targets) {
    const sortedTargets = [...targets].sort((a, b) => b.radius - a.radius);
    return sortedTargets.find((target) => {
      if (!target.visible || target.hitCooldownMs > 0) return false;
      return distance(point.x, point.y, target.x, target.y) <= target.radius * 1.5;
    });
  }
}
