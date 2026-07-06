import { clamp, circlePoint, easeInOutSine } from '../utils/math.js';
import { randomBetween, choice } from '../utils/random.js';

const SIZE_MAP = Object.freeze({ small: 1.05, medium: 1.22, large: 1.42 });
const SPEED_MAP = Object.freeze({ 1: 0.66, 2: 0.82, 3: 1 });
const SAFE_MARGIN = 86;

export class AnimalSpawner {
  constructor(canvas) {
    this.canvas = canvas;
    this.targets = [];
    this.effects = [];
    this.mode = null;
  }

  reset(mode, settings = {}) {
    this.mode = mode;
    this.targets = [];
    this.effects = [];
    const count = mode?.targetCount || 1;
    for (let index = 0; index < count; index += 1) this.targets.push(this.createTarget(index, settings));
  }

  createTarget(index, settings) {
    const width = this.canvas.width || 1280;
    const height = this.canvas.height || 720;
    const sizeFactor = SIZE_MAP[settings.targetSize] || SIZE_MAP.large;
    const radius = randomBetween(26, 40) * sizeFactor;
    const color = choice(this.mode?.palette || []) || '#FFD28A';
    const angle = randomBetween(0, Math.PI * 2);
    const speed = this.speedForSettings(settings) * randomBetween(0.82, 1.08);
    const point = this.spawnPoint(index, width, height);
    return {
      id: `${this.mode?.id || 'toy'}-${index}-${Date.now()}`,
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      targetVx: Math.cos(angle) * speed,
      targetVy: Math.sin(angle) * speed,
      radius,
      color,
      accent: this.mode?.accent || '#E6A45E',
      ageMs: randomBetween(0, 1400),
      turnTimerMs: randomBetween(900, 2200),
      pauseMs: 0,
      visible: true,
      alpha: 1,
      wiggleSeed: randomBetween(0, Math.PI * 2),
      hitCooldownMs: 0,
      kind: this.mode?.targetKind || 'yarn',
    };
  }

  speedForSettings(settings = {}) {
    const base = this.mode?.motion?.baseSpeed || 44;
    return base * (SPEED_MAP[settings.speedLevel] || SPEED_MAP[2]) / 1000;
  }

  spawnPoint(index, width, height) {
    const columns = Math.max(1, Math.ceil(Math.sqrt(this.mode?.targetCount || 1)));
    const col = index % columns;
    const row = Math.floor(index / columns);
    return {
      x: clamp((col + 0.55) * width / (columns + 0.12) + randomBetween(-70, 70), SAFE_MARGIN, width - SAFE_MARGIN),
      y: clamp((row + 0.58) * height / (columns + 0.38) + randomBetween(-56, 56), SAFE_MARGIN, height - SAFE_MARGIN),
    };
  }

  update(deltaMs, settings = {}) {
    const width = this.canvas.width || 1280;
    const height = this.canvas.height || 720;
    for (const target of this.targets) {
      target.ageMs += deltaMs;
      target.hitCooldownMs = Math.max(0, target.hitCooldownMs - deltaMs);
      target.turnTimerMs -= deltaMs;
      target.alpha = Math.min(1, target.alpha + deltaMs / 600);

      if (target.pauseMs > 0) {
        target.pauseMs = Math.max(0, target.pauseMs - deltaMs);
        target.vx *= 0.985;
        target.vy *= 0.985;
      } else {
        if (target.turnTimerMs <= 0) this.pickNewDirection(target, settings);
        target.vx += (target.targetVx - target.vx) * 0.018;
        target.vy += (target.targetVy - target.vy) * 0.018;
      }

      target.x += target.vx * deltaMs;
      target.y += target.vy * deltaMs;
      this.keepInBounds(target, width, height);
    }

    this.effects = this.effects.filter((effect) => {
      effect.ageMs += deltaMs;
      return effect.ageMs < effect.lifeMs;
    });
  }

  pickNewDirection(target, settings = {}) {
    const currentAngle = Math.atan2(target.vy, target.vx);
    const angle = currentAngle + randomBetween(-0.75, 0.75);
    const speed = this.speedForSettings(settings) * randomBetween(0.82, 1.06);
    target.targetVx = Math.cos(angle) * speed;
    target.targetVy = Math.sin(angle) * speed;
    target.turnTimerMs = randomBetween(this.mode?.motion?.turnEveryMs || 2400, (this.mode?.motion?.turnEveryMs || 2400) + 1600);
    if (Math.random() < (this.mode?.motion?.pauseChance || 0.08)) target.pauseMs = randomBetween(220, 560);
  }

  keepInBounds(target, width, height) {
    const margin = Math.max(SAFE_MARGIN, target.radius * 2.1);
    if (target.x < margin || target.x > width - margin) {
      target.x = clamp(target.x, margin, width - margin);
      target.vx *= -0.72;
      target.targetVx *= -1;
    }
    if (target.y < margin || target.y > height - margin) {
      target.y = clamp(target.y, margin, height - margin);
      target.vy *= -0.72;
      target.targetVy *= -1;
    }
  }

  hitTarget(target, point) {
    target.hitCooldownMs = 120;
    target.alpha = 0.76;
    const nudgeAngle = Math.atan2(target.y - point.y, target.x - point.x) || randomBetween(0, Math.PI * 2);
    const nudge = 0.085;
    target.targetVx += Math.cos(nudgeAngle) * nudge;
    target.targetVy += Math.sin(nudgeAngle) * nudge;
    this.effects.push({ x: point.x, y: point.y, radius: target.radius, color: target.color, accent: target.accent, ageMs: 0, lifeMs: 760 });
  }

  draw(ctx, timeMs = 0) {
    if (!ctx) return;
    this.drawBackground(ctx);
    for (const target of this.targets) {
      ctx.save();
      ctx.globalAlpha = target.alpha;
      this.drawTarget(ctx, target, timeMs);
      ctx.restore();
    }
    this.drawEffects(ctx);
  }

  drawBackground(ctx) {
    const width = this.canvas.width || 1280;
    const height = this.canvas.height || 720;
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#FFF9E6');
    gradient.addColorStop(0.48, '#FFEFD3');
    gradient.addColorStop(1, '#FFF4DD');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.globalAlpha = 0.055;
    for (let x = 80; x < width; x += 230) {
      for (let y = 76; y < height; y += 170) this.drawPawPattern(ctx, x, y, 24);
    }
    ctx.globalAlpha = 0.045;
    ctx.strokeStyle = '#DDA45F';
    ctx.lineWidth = 3;
    for (let x = 160; x < width; x += 300) {
      for (let y = 120; y < height; y += 240) this.drawYarnPattern(ctx, x, y, 30);
    }
    ctx.restore();
  }

  drawPawPattern(ctx, x, y, r) {
    ctx.fillStyle = '#DCA45F';
    ctx.beginPath();
    ctx.ellipse(x, y + r * 0.36, r * 0.82, r * 0.62, 0, 0, Math.PI * 2);
    ctx.ellipse(x - r * 0.72, y - r * 0.12, r * 0.28, r * 0.38, -0.25, 0, Math.PI * 2);
    ctx.ellipse(x - r * 0.24, y - r * 0.48, r * 0.27, r * 0.4, -0.08, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.28, y - r * 0.48, r * 0.27, r * 0.4, 0.08, 0, Math.PI * 2);
    ctx.ellipse(x + r * 0.74, y - r * 0.12, r * 0.28, r * 0.38, 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  drawYarnPattern(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.moveTo(x - r * 0.8, y - r * 0.2);
    ctx.quadraticCurveTo(x, y - r * 0.6, x + r * 0.8, y + r * 0.2);
    ctx.moveTo(x - r * 0.65, y + r * 0.48);
    ctx.quadraticCurveTo(x - r * 0.1, y, x + r * 0.72, y - r * 0.42);
    ctx.stroke();
  }

  drawTarget(ctx, target, timeMs) {
    const pulse = 1 + Math.sin(timeMs / 900 + target.wiggleSeed) * 0.035;
    const r = target.radius * pulse;
    ctx.translate(target.x, target.y);
    ctx.rotate(Math.atan2(target.vy, target.vx) * 0.35);
    ctx.shadowColor = target.color;
    ctx.shadowBlur = 18;

    if (target.kind === 'fish') this.drawFish(ctx, target, r);
    else if (target.kind === 'feather') this.drawFeatherPom(ctx, target, r);
    else if (target.kind === 'mouse') this.drawMouse(ctx, target, r);
    else if (target.kind === 'pom') this.drawPom(ctx, target, r);
    else if (target.kind === 'cloud') this.drawCloud(ctx, target, r);
    else this.drawYarnBall(ctx, target, r);

    this.drawFur(ctx, target, r);
  }

  plushFill(ctx, color, r) {
    const gradient = ctx.createRadialGradient(-r * 0.25, -r * 0.3, r * 0.1, 0, 0, r * 1.7);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.26, color);
    gradient.addColorStop(1, color);
    ctx.fillStyle = gradient;
  }

  drawYarnBall(ctx, target, r) {
    this.plushFill(ctx, target.color, r);
    ctx.beginPath(); ctx.arc(0, 0, r * 1.04, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = target.accent; ctx.lineWidth = Math.max(2, r * 0.07); ctx.globalAlpha *= 0.65;
    for (let i = -2; i <= 2; i += 1) {
      ctx.beginPath();
      ctx.ellipse(0, i * r * 0.13, r * 0.95, r * 0.32, i * 0.38, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  drawMouse(ctx, target, r) {
    this.plushFill(ctx, target.color, r);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.18, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.72, -r * 0.38, r * 0.28, 0, Math.PI * 2); ctx.arc(r * 0.72, r * 0.38, r * 0.28, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = target.accent; ctx.lineWidth = Math.max(2, r * 0.05);
    ctx.beginPath(); ctx.moveTo(-r * 1.05, 0); ctx.bezierCurveTo(-r * 1.7, -r * 0.42, -r * 1.95, r * 0.32, -r * 2.35, 0); ctx.stroke();
    ctx.fillStyle = '#8B5B39'; ctx.beginPath(); ctx.arc(r * 0.58, -r * 0.12, r * 0.08, 0, Math.PI * 2); ctx.fill();
  }

  drawFish(ctx, target, r) {
    this.plushFill(ctx, target.color, r);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.24, r * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = target.accent;
    ctx.beginPath(); ctx.ellipse(-r * 1.18, -r * 0.3, r * 0.48, r * 0.32, -0.55, 0, Math.PI * 2); ctx.ellipse(-r * 1.18, r * 0.3, r * 0.48, r * 0.32, 0.55, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8B5B39'; ctx.beginPath(); ctx.arc(r * 0.62, -r * 0.12, r * 0.09, 0, Math.PI * 2); ctx.fill();
  }

  drawFeatherPom(ctx, target, r) {
    ctx.strokeStyle = target.accent; ctx.lineWidth = Math.max(3, r * 0.08); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 1.65, r * 0.25); ctx.quadraticCurveTo(-r * 0.56, -r * 0.25, r * 0.35, 0); ctx.stroke();
    for (let i = -3; i <= 3; i += 1) {
      ctx.save(); ctx.rotate(i * 0.18); this.plushFill(ctx, target.color, r);
      ctx.beginPath(); ctx.ellipse(r * 0.42, i * r * 0.06, r * 0.98, r * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    this.drawPom(ctx, target, r * 0.5, r * 1.1, 0);
  }

  drawPom(ctx, target, r, offsetX = 0, offsetY = 0) {
    ctx.save(); ctx.translate(offsetX, offsetY); this.plushFill(ctx, target.color, r);
    for (let i = 0; i < 11; i += 1) {
      const p = circlePoint((Math.PI * 2 * i) / 11, r * 0.34);
      ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
    }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawCloud(ctx, target, r) {
    this.plushFill(ctx, target.color, r);
    ctx.beginPath();
    ctx.arc(-r * 0.48, r * 0.08, r * 0.62, 0, Math.PI * 2);
    ctx.arc(0, -r * 0.18, r * 0.75, 0, Math.PI * 2);
    ctx.arc(r * 0.58, r * 0.08, r * 0.58, 0, Math.PI * 2);
    ctx.ellipse(0, r * 0.28, r * 1.22, r * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFur(ctx, target, r) {
    ctx.save();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(145, 103, 66, 0.23)';
    ctx.lineWidth = 1.2;
    const count = 18;
    for (let i = 0; i < count; i += 1) {
      const angle = (Math.PI * 2 * i) / count + target.wiggleSeed;
      const innerRadius = r * (0.42 + ((i * 37) % 41) / 100);
      const outerRadius = r * (0.68 + ((i * 23) % 34) / 100);
      const inner = circlePoint(angle, innerRadius);
      const outer = circlePoint(angle + 0.1, outerRadius);
      ctx.beginPath(); ctx.moveTo(inner.x, inner.y); ctx.lineTo(outer.x, outer.y); ctx.stroke();
    }
    ctx.restore();
  }

  drawEffects(ctx) {
    for (const effect of this.effects) {
      const t = easeInOutSine(effect.ageMs / effect.lifeMs);
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = effect.accent;
      ctx.fillStyle = effect.color;
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (1 + t * 1.4), 0, Math.PI * 2); ctx.stroke();
      ctx.globalAlpha *= 0.28;
      ctx.beginPath(); ctx.arc(effect.x, effect.y, effect.radius * (0.72 + t * 0.8), 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }
}

