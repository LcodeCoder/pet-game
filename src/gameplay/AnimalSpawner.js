import { clamp, circlePoint, easeInOutSine } from '../utils/math.js';
import { randomBetween, randomInt, choice } from '../utils/random.js';

const SIZE_MAP = Object.freeze({ small: 0.78, medium: 1, large: 1.28 });
const SPEED_MAP = Object.freeze({ 1: 0.72, 2: 1, 3: 1.28 });

export class AnimalSpawner {
  constructor(canvas) {
    this.canvas = canvas;
    this.targets = [];
    this.effects = [];
    this.mode = null;
  }

  reset(mode, settings) {
    this.mode = mode;
    this.targets = [];
    this.effects = [];
    const count = mode.targetCount || 1;
    for (let index = 0; index < count; index += 1) {
      this.targets.push(this.createTarget(index, settings));
    }
  }

  createTarget(index, settings) {
    const width = this.canvas.width || 1280;
    const height = this.canvas.height || 720;
    const sizeFactor = SIZE_MAP[settings.targetSize] || 1;
    const baseRadius = randomBetween(19, 35) * sizeFactor;
    const color = choice(this.mode.palette) || '#ff2a2a';
    const angle = randomBetween(0, Math.PI * 2);
    const speed = this.speedForSettings(settings) * randomBetween(0.82, 1.18);
    const point = this.spawnPoint(index, width, height);
    return {
      id: `${this.mode.id}-${index}-${Date.now()}`,
      x: point.x,
      y: point.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: baseRadius,
      baseRadius,
      color,
      accent: choice(this.mode.palette) || '#ffffff',
      visible: true,
      alpha: 1,
      ageMs: 0,
      turnTimerMs: randomBetween(200, this.mode.movement.turnEveryMs || 1000),
      pauseTimerMs: 0,
      vanishTimerMs: 0,
      hitCooldownMs: 0,
      wiggleSeed: randomBetween(0, Math.PI * 2),
    };
  }

  spawnPoint(index, width, height) {
    const margin = 90;
    if (this.mode.movement.pathKind === 'edgeRun') {
      const edge = index % 4;
      if (edge === 0) return { x: margin, y: randomBetween(margin, height - margin) };
      if (edge === 1) return { x: width - margin, y: randomBetween(margin, height - margin) };
      if (edge === 2) return { x: randomBetween(margin, width - margin), y: margin };
      return { x: randomBetween(margin, width - margin), y: height - margin };
    }
    return { x: randomBetween(margin, width - margin), y: randomBetween(margin + 40, height - margin) };
  }

  speedForSettings(settings) {
    const speedLevel = SPEED_MAP[Number(settings.speedLevel)] || 1;
    const stimulationBoost = settings.stimulation === 'active' ? 1.18 : settings.stimulation === 'calm' ? 0.82 : 1;
    return (this.mode.movement.baseSpeed || 140) * speedLevel * stimulationBoost;
  }

  update(deltaMs, settings) {
    const dt = deltaMs / 1000;
    const width = this.canvas.width || 1280;
    const height = this.canvas.height || 720;
    for (const target of this.targets) {
      target.ageMs += deltaMs;
      target.hitCooldownMs = Math.max(0, target.hitCooldownMs - deltaMs);
      if (target.vanishTimerMs > 0) {
        target.vanishTimerMs -= deltaMs;
        target.visible = target.vanishTimerMs <= 0;
        target.alpha = target.visible ? 1 : 0;
        if (!target.visible) continue;
      }
      if (target.pauseTimerMs > 0) {
        target.pauseTimerMs -= deltaMs;
        target.radius = target.baseRadius * (1 + Math.sin(target.ageMs / 80) * 0.04);
        continue;
      }

      this.applyPathMotion(target, dt, width, height);
      this.keepInBounds(target, width, height);

      target.turnTimerMs -= deltaMs;
      if (target.turnTimerMs <= 0) {
        this.randomizeBehavior(target, settings);
      }
    }
    this.effects = this.effects.filter((effect) => {
      effect.ageMs += deltaMs;
      return effect.ageMs < effect.lifeMs;
    });
  }

  applyPathMotion(target, dt, width, height) {
    const kind = this.mode.movement.pathKind;
    if (kind === 'float') {
      target.x += target.vx * dt;
      target.y += (target.vy + Math.sin(target.ageMs / 520 + target.wiggleSeed) * 45) * dt;
    } else if (kind === 'sway') {
      target.x += (target.vx * 0.55 + Math.sin(target.ageMs / 420 + target.wiggleSeed) * 90) * dt;
      target.y += (target.vy * 0.35 + Math.cos(target.ageMs / 700 + target.wiggleSeed) * 35) * dt;
    } else if (kind === 'peek') {
      target.x += target.vx * dt * 0.5;
      target.y += target.vy * dt * 0.5;
      target.radius = target.baseRadius * (0.75 + easeInOutSine((Math.sin(target.ageMs / 450) + 1) / 2) * 0.45);
    } else if (kind === 'shadow') {
      target.x += target.vx * dt;
      target.y += Math.sin(target.ageMs / 900 + target.wiggleSeed) * 30 * dt;
      target.alpha = 0.42 + Math.sin(target.ageMs / 1000) * 0.14;
    } else if (kind === 'edgeRun') {
      target.x += target.vx * dt;
      target.y += target.vy * dt;
      const edgeBias = 0.2;
      if (target.x < width * edgeBias || target.x > width * (1 - edgeBias)) target.vy += Math.sin(target.ageMs / 240) * 18;
      if (target.y < height * edgeBias || target.y > height * (1 - edgeBias)) target.vx += Math.cos(target.ageMs / 240) * 18;
    } else {
      target.x += target.vx * dt;
      target.y += target.vy * dt;
    }
  }

  keepInBounds(target, width, height) {
    const margin = target.radius + 12;
    if (target.x < margin || target.x > width - margin) {
      target.x = clamp(target.x, margin, width - margin);
      target.vx *= -randomBetween(0.82, 1.1);
    }
    if (target.y < margin + 56 || target.y > height - margin) {
      target.y = clamp(target.y, margin + 56, height - margin);
      target.vy *= -randomBetween(0.82, 1.1);
    }
  }

  randomizeBehavior(target, settings) {
    const movement = this.mode.movement;
    const speed = this.speedForSettings(settings) * randomBetween(0.82, 1.25);
    const angle = randomBetween(0, Math.PI * 2);
    target.vx = Math.cos(angle) * speed;
    target.vy = Math.sin(angle) * speed;
    target.turnTimerMs = randomBetween(280, movement.turnEveryMs || 1000);
    if (Math.random() < (movement.pauseChance || 0)) target.pauseTimerMs = randomBetween(120, 680);
    if (Math.random() < (movement.vanishChance || 0)) {
      target.visible = false;
      target.vanishTimerMs = randomBetween(120, 420);
      const point = this.spawnPoint(randomInt(0, 6), this.canvas.width, this.canvas.height);
      target.x = point.x;
      target.y = point.y;
    }
  }

  hitTarget(target, point) {
    target.hitCooldownMs = 120;
    target.pauseTimerMs = 80;
    target.visible = false;
    target.vanishTimerMs = randomBetween(80, 180);
    target.vx *= -1.15;
    target.vy *= -1.15;
    this.effects.push({ x: point.x, y: point.y, color: target.color, ageMs: 0, lifeMs: 460, radius: target.radius });
  }

  draw(ctx, timeMs) {
    this.drawBackground(ctx, timeMs);
    for (const target of this.targets) {
      if (!target.visible) continue;
      ctx.save();
      ctx.globalAlpha = target.alpha;
      this.drawTarget(ctx, target, timeMs);
      ctx.restore();
    }
    for (const effect of this.effects) {
      const t = effect.ageMs / effect.lifeMs;
      ctx.save();
      ctx.globalAlpha = 1 - t;
      ctx.strokeStyle = effect.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(effect.x, effect.y, effect.radius * (1 + t * 1.6), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawBackground(ctx, timeMs) {
    const [start, end] = this.mode?.background || ['#08111d', '#141022'];
    const gradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, start);
    gradient.addColorStop(1, end);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.strokeStyle = '#dff4ff';
    ctx.lineWidth = 1;
    const offset = (timeMs / 70) % 80;
    for (let x = -80; x < this.canvas.width + 80; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x + offset, 0);
      ctx.lineTo(x + offset - 240, this.canvas.height);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawTarget(ctx, target, timeMs) {
    const pulse = 1 + Math.sin(timeMs / 140 + target.wiggleSeed) * 0.07;
    const r = target.radius * pulse;
    ctx.translate(target.x, target.y);
    ctx.rotate(Math.atan2(target.vy, target.vx));
    ctx.shadowColor = target.color;
    ctx.shadowBlur = target.targetKind === 'shadow' ? 0 : 22;

    if (this.mode.targetKind === 'bug') this.drawBug(ctx, target, r);
    else if (this.mode.targetKind === 'fish') this.drawFish(ctx, target, r);
    else if (this.mode.targetKind === 'feather') this.drawFeather(ctx, target, r);
    else if (this.mode.targetKind === 'mouse') this.drawMouse(ctx, target, r);
    else if (this.mode.targetKind === 'shadow') this.drawShadow(ctx, target, r);
    else this.drawDot(ctx, target, r);
  }

  drawDot(ctx, target, r) {
    const gradient = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 1.9);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.18, target.color);
    gradient.addColorStop(1, 'rgba(255, 42, 42, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.55, 0, Math.PI * 2);
    ctx.fill();
  }

  drawBug(ctx, target, r) {
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.1, r * 0.68, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.1, r * 0.16, 0, Math.PI * 2);
    ctx.arc(r * 0.55, r * 0.18, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = target.accent;
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-r * 0.2, i * r * 0.2);
      ctx.lineTo(-r * 0.9, i * r * 0.55);
      ctx.stroke();
    }
  }

  drawFish(ctx, target, r) {
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.3, r * 0.72, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 1.1, 0);
    ctx.lineTo(-r * 1.9, -r * 0.62);
    ctx.lineTo(-r * 1.9, r * 0.62);
    ctx.closePath();
    ctx.fillStyle = target.accent;
    ctx.fill();
    ctx.fillStyle = '#020b14';
    ctx.beginPath();
    ctx.arc(r * 0.62, -r * 0.12, r * 0.13, 0, Math.PI * 2);
    ctx.fill();
  }

  drawFeather(ctx, target, r) {
    ctx.strokeStyle = target.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-r * 1.4, 0);
    ctx.quadraticCurveTo(0, -r * 0.8, r * 1.5, 0);
    ctx.quadraticCurveTo(0, r * 0.8, -r * 1.4, 0);
    ctx.stroke();
    ctx.fillStyle = target.color;
    ctx.globalAlpha *= 0.82;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.35, r * 0.42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawMouse(ctx, target, r) {
    ctx.fillStyle = '#050505';
    ctx.beginPath();
    ctx.arc(0, r * 0.28, r * 1.25, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = target.color;
    ctx.beginPath();
    ctx.ellipse(0, -r * 0.1, r * 0.85, r * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.55, -r * 0.35, r * 0.24, 0, Math.PI * 2);
    ctx.arc(r * 0.55, r * 0.15, r * 0.24, 0, Math.PI * 2);
    ctx.fill();
  }

  drawShadow(ctx, target, r) {
    ctx.fillStyle = '#030303';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 1.55, r * 0.52, 0, 0, Math.PI * 2);
    ctx.fill();
    const wing = circlePoint(Math.sin(target.ageMs / 300) * 0.4, r * 1.1);
    ctx.beginPath();
    ctx.ellipse(-r * 0.3, wing.y, r * 0.7, r * 0.24, 0.4, 0, Math.PI * 2);
    ctx.ellipse(r * 0.3, -wing.y, r * 0.7, r * 0.24, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}
