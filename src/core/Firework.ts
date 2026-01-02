
import { Vector2 } from './Vector2';
import { FireworkOptions, ExplosionType, AppSettings, ParticleOptions } from '../types';
import { Particle } from './Particle';

export class Firework {
  pos: Vector2;
  target: Vector2;
  vel: Vector2;
  hue: number;
  charge: number;
  exploded: boolean = false;
  trail: Vector2[] = [];
  trailLength: number;

  constructor(options: FireworkOptions, settings: AppSettings) {
    this.pos = new Vector2(options.startX, window.innerHeight);
    this.target = new Vector2(options.targetX, options.targetY);
    this.hue = options.hue;
    this.charge = options.charge;
    this.trailLength = settings.trailLength;

    const distanceY = this.pos.y - this.target.y;
    const gravity = settings.gravity;
    const initialVelY = -Math.sqrt(2 * gravity * Math.max(10, distanceY)) * (0.85 + Math.random() * 0.3);
    const timeToApex = -initialVelY / gravity;
    const initialVelX = (this.target.x - this.pos.x) / timeToApex;

    this.vel = new Vector2(initialVelX, initialVelY);
  }

  update(settings: AppSettings): void {
    this.trail.push(this.pos.clone());
    if (this.trail.length > this.trailLength) {
      this.trail.shift();
    }
    this.vel.y += settings.gravity;
    this.pos.add(this.vel);
    
    if (this.vel.y >= -0.2) {
      this.exploded = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.strokeStyle = `hsl(${this.hue}, 100%, 75%)`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < this.trail.length; i++) {
      const p = this.trail[i];
      const alpha = i / this.trail.length;
      ctx.globalAlpha = alpha * 0.8;
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  createExplosion(settings: AppSettings, spawnParticle: (opts: ParticleOptions) => Particle): void {
    const types = Object.values(ExplosionType);
    const type = types[Math.floor(Math.random() * types.length)] as ExplosionType;
    
    let baseCount = Math.floor((180 + this.charge * 450) * settings.particleCountMultiplier);
    const sizeScale = settings.explosionSizeMultiplier;

    const spawn = (angle: number, speed: number, extraHue = 0, behavior: any = 'default', decay?: number) => {
      spawnParticle({
        x: this.pos.x, y: this.pos.y,
        originX: this.pos.x,
        originY: this.pos.y,
        hue: (this.hue + extraHue) % 360,
        angle,
        speed: speed * sizeScale,
        gravity: settings.gravity,
        friction: settings.friction,
        behavior,
        decay
      });
    };

    switch (type) {
      case ExplosionType.HEART:
        const heartCount = baseCount * 1.5;
        for (let i = 0; i < heartCount; i++) {
          const t = (i / heartCount) * Math.PI * 2;
          const x = 16 * Math.pow(Math.sin(t), 3);
          const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
          const speed = (Math.sqrt(x*x + y*y) / 8) * (6 + this.charge * 8);
          spawn(Math.atan2(y, x), speed, 0, 'default', 0.012);
        }
        break;

      case ExplosionType.STAR:
        const pts = 5;
        const starCount = baseCount * 1.3;
        for (let i = 0; i < starCount; i++) {
          const ang = (i / starCount) * Math.PI * 2;
          const mod = (Math.abs(Math.cos(ang * pts / 2)) * 0.7 + 0.3);
          spawn(ang, mod * (14 + this.charge * 18));
        }
        break;

      case ExplosionType.GALAXY:
        const arms = 4 + Math.floor(this.charge * 4);
        for (let a = 0; a < arms; a++) {
          const armBaseAngle = (a / arms) * Math.PI * 2;
          for (let i = 0; i < baseCount / arms; i++) {
            const prog = i / (baseCount / arms);
            const angle = armBaseAngle + prog * Math.PI * 2.5;
            const speed = prog * (15 + this.charge * 15);
            spawn(angle, speed, prog * 80, 'galaxy');
          }
        }
        break;

      case ExplosionType.SPIRAL:
        const sArms = 4 + Math.floor(this.charge * 4);
        const pPerArm = Math.floor(baseCount / sArms);
        for (let a = 0; a < sArms; a++) {
          const armBaseAngle = (a / sArms) * Math.PI * 2;
          for (let i = 0; i < pPerArm; i++) {
            const prog = i / pPerArm;
            const swirlAngle = armBaseAngle + (prog * Math.PI * 8);
            const speed = (0.2 + prog * 0.8) * (20 + this.charge * 15);
            spawn(swirlAngle, speed, prog * 60);
          }
        }
        break;

      case ExplosionType.BUTTERFLY:
        const bfCount = baseCount * 1.5;
        for (let i = 0; i < bfCount; i++) {
          const t = (i / bfCount) * Math.PI * 2;
          const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
          const x = Math.sin(t) * r;
          const y = -Math.cos(t) * r;
          spawn(Math.atan2(y, x), Math.sqrt(x*x + y*y) * (8 + this.charge * 10), Math.sin(t) * 40);
        }
        break;

      case ExplosionType.DOUBLE_RING:
        const ringCount = Math.floor(baseCount * 0.6);
        for (let i = 0; i < ringCount; i++) spawn((i / ringCount) * Math.PI * 2, 22 + this.charge * 12);
        for (let i = 0; i < ringCount; i++) spawn((i / ringCount) * Math.PI * 2 + 0.2, 14 + this.charge * 8, 40);
        break;

      case ExplosionType.GLITTER:
        for (let i = 0; i < baseCount; i++) spawn(Math.random() * Math.PI * 2, Math.random() * (22 + this.charge * 18), 0, 'glitter');
        break;

      default:
        for (let i = 0; i < baseCount; i++) {
          const angle = (i / baseCount) * Math.PI * 2;
          spawn(angle, Math.random() * (20 + this.charge * 24));
        }
        break;
    }
  }
}
