
import { ParticleOptions, ParticleBehavior } from '../types';

/**
 * Performance-optimized Particle class.
 */
export class Particle {
  public x: number = 0;
  public y: number = 0;
  public vx: number = 0;
  public vy: number = 0;
  public originX: number = 0;
  public originY: number = 0;
  public hue: number = 0;
  public alpha: number = 1;
  public decay: number = 0.02;
  public friction: number = 0.95;
  public gravity: number = 0.12;
  public resistance: number = 0.005;
  public size: number = 1;
  public life: number = 1;
  public behavior: ParticleBehavior = 'default';
  public twinkleFactor: number = 0;
  public timeOffset: number = 0;
  public color: string = '';
  public rotationSpeed: number = 0;

  constructor() {}

  init(options: ParticleOptions): void {
    this.x = options.x;
    this.y = options.y;
    this.originX = options.originX ?? options.x;
    this.originY = options.originY ?? options.y;
    this.hue = options.hue;
    this.behavior = options.behavior ?? 'default';
    this.life = 1;
    this.alpha = 1;
    this.timeOffset = Math.random() * 100;
    this.twinkleFactor = Math.random();

    const angle = options.angle ?? Math.random() * Math.PI * 2;
    const speed = options.speed ?? Math.random() * 10 + 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    if (this.behavior === 'willow') {
      this.friction = options.friction ?? 0.98;
      this.gravity = options.gravity ?? 0.04;
      this.decay = options.decay ?? 0.006;
      this.size = options.size ?? 1.5;
    } else if (this.behavior === 'glitter') {
      this.friction = options.friction ?? 0.92;
      this.gravity = options.gravity ?? 0.15;
      this.decay = options.decay ?? 0.02;
      this.size = options.size ?? Math.random() * 2 + 1;
    } else if (this.behavior === 'firefly') {
      this.friction = 0.94;
      this.gravity = -0.01;
      this.decay = 0.005;
      this.size = 1.2;
    } else if (this.behavior === 'comet') {
      this.friction = 0.995;
      this.gravity = 0.01;
      this.decay = options.decay ?? 0.006;
      this.size = 3;
      this.resistance = 0.0001;
    } else if (this.behavior === 'galaxy') {
      this.friction = 0.98;
      this.gravity = 0;
      this.decay = options.decay ?? 0.008;
      this.size = Math.random() * 1.5 + 0.5;
      this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    } else {
      this.friction = options.friction ?? 0.95;
      this.gravity = options.gravity ?? 0.12;
      this.decay = options.decay ?? Math.random() * 0.02 + 0.01;
      this.size = options.size ?? Math.random() * 2 + 1;
    }

    this.resistance = options.resistance ?? 0.005;
    this.color = `hsl(${this.hue % 360}, 100%, 75%)`;
  }

  update(): void {
    if (this.behavior === 'firefly') {
      const now = performance.now() * 0.005 + this.timeOffset;
      this.vx += Math.sin(now) * 0.05;
      this.vy += Math.cos(now) * 0.05;
    } else if (this.behavior === 'galaxy') {
      const dx = this.x - this.originX;
      const dy = this.y - this.originY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) + this.rotationSpeed;
      
      const targetX = this.originX + Math.cos(angle) * (dist + this.vx);
      const targetY = this.originY + Math.sin(angle) * (dist + this.vy);
      
      this.vx = targetX - this.x;
      this.vy = targetY - this.y;
    }

    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq > 0.001) {
      const speed = Math.sqrt(speedSq);
      const drag = speedSq * this.resistance;
      this.vx -= (this.vx / speed) * drag;
      this.vy -= (this.vy / speed) * drag;
    }

    this.vx *= this.friction;
    this.vy = this.vy * this.friction + this.gravity;
    
    this.x += this.vx;
    this.y += this.vy;

    this.life -= this.decay;
    
    if (this.behavior === 'ghost') {
      this.alpha = (Math.sin(this.life * 20) * 0.5 + 0.5) * this.life;
    } else if (this.behavior === 'firefly') {
      this.alpha = (Math.sin(performance.now() * 0.01 + this.timeOffset) * 0.4 + 0.6) * this.life;
    } else {
      this.alpha = this.life;
    }
    
    if (this.behavior === 'glitter') {
      this.twinkleFactor = (this.twinkleFactor + 0.15) % 1;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.alpha <= 0) return;

    let currentAlpha = this.alpha;
    if (this.behavior === 'glitter' && this.twinkleFactor > 0.5) {
      currentAlpha *= 0.2;
    }

    ctx.globalAlpha = currentAlpha;
    ctx.fillStyle = this.color;
    
    if (this.behavior === 'willow' || this.behavior === 'comet') {
      ctx.beginPath();
      const trailLen = this.behavior === 'comet' ? 8 : 3;
      ctx.lineWidth = this.behavior === 'comet' ? this.size * this.life : this.size;
      ctx.strokeStyle = this.color;
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.x - this.vx * trailLen, this.y - this.vy * trailLen);
      ctx.stroke();
      
      if (this.behavior === 'comet') {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * this.life, 0, 6.28);
        ctx.fill();
      }
    } else if (this.behavior === 'galaxy') {
      ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
    } else {
      if (this.size < 2) {
        ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, 6.28);
        ctx.fill();
      }
    }
  }

  isDead(): boolean {
    return this.life <= 0;
  }
}
