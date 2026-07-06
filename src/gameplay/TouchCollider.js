import { distance } from '../utils/math.js';

export const CAT_PAW_HIT_MULTIPLIER = 2;

export class TouchCollider {
  constructor(canvas, onHit, performanceMonitor) {
    this.canvas = canvas;
    this.onHit = onHit;
    this.performanceMonitor = performanceMonitor;
    this.enabled = false;
    this.activePointers = new Set();
    this.handlePointer = this.handlePointer.bind(this);
    this.handlePointerEnd = this.handlePointerEnd.bind(this);
  }

  enable() {
    if (this.enabled) return;
    this.enabled = true;
    this.canvas.addEventListener('pointerdown', this.handlePointer, { passive: false });
    this.canvas.addEventListener('pointermove', this.handlePointer, { passive: false });
    this.canvas.addEventListener('pointerup', this.handlePointerEnd, { passive: false });
    this.canvas.addEventListener('pointercancel', this.handlePointerEnd, { passive: false });
  }

  disable() {
    if (!this.enabled) return;
    this.enabled = false;
    this.activePointers.clear();
    this.canvas.removeEventListener('pointerdown', this.handlePointer);
    this.canvas.removeEventListener('pointermove', this.handlePointer);
    this.canvas.removeEventListener('pointerup', this.handlePointerEnd);
    this.canvas.removeEventListener('pointercancel', this.handlePointerEnd);
  }

  handlePointer(event) {
    if (event.type === 'pointerdown') this.activePointers.add(event.pointerId);
    if (event.type === 'pointermove' && event.pointerType === 'mouse' && event.buttons !== 1) return;
    if (event.type === 'pointermove' && event.pointerType !== 'mouse' && !this.activePointers.has(event.pointerId)) this.activePointers.add(event.pointerId);
    event.preventDefault();
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const point = {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
      pointerId: event.pointerId,
      eventTime: event.timeStamp,
    };
    this.performanceMonitor?.recordTouchLatency(event.timeStamp);
    this.onHit(point);
  }

  handlePointerEnd(event) {
    this.activePointers.delete(event.pointerId);
  }

  static hitTest(point, targets) {
    const sortedTargets = [...targets].sort((a, b) => b.radius - a.radius);
    return sortedTargets.find((target) => {
      if (!target.visible || target.hitCooldownMs > 0) return false;
      return distance(point.x, point.y, target.x, target.y) <= target.radius * CAT_PAW_HIT_MULTIPLIER;
    });
  }
}
