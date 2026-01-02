// FILE: src/core/Firework3D.ts

import { Vector3 } from './Vector3';
import { ExplosionType, AppSettings, ParticleOptions3D } from '../types';
import { Particle3D } from './Particle3D';

export interface Firework3DOptions {
  startX: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  hue: number;
  charge: number;
}

/**
 * 3D Firework class
 */
export class Firework3D {
  position: Vector3;
  target: Vector3;
  velocity: Vector3;
  hue: number;
  charge: number;
  exploded: boolean = false;
  trail: Vector3[] = [];
  trailLength: number;

  public type: ExplosionType;
  public lifeTime: number = 0;

  constructor(options: Firework3DOptions, settings: AppSettings) {
    this.position = new Vector3(options.startX, 0, options.startZ);
    this.target = new Vector3(options.targetX, options.targetY, options.targetZ);
    this.hue = options.hue;
    this.charge = options.charge;
    this.trailLength = settings.trailLength;

    // 智能随机类型：增加高级组合技的概率
    const rand = Math.random();
    if (rand > 0.8) {
      const shapeTypes = [
        ExplosionType.HEART_BEAT, ExplosionType.BUTTERFLY,
        ExplosionType.DRAGON, ExplosionType.HELIX, ExplosionType.ZODIAC
      ];
      this.type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    } else if (rand > 0.5) {
      const comboTypes = [
        ExplosionType.PISTIL, ExplosionType.STROBE,
        ExplosionType.SATURN, ExplosionType.CROSSETTE
      ];
      this.type = comboTypes[Math.floor(Math.random() * comboTypes.length)];
    } else {
      const basicTypes = [ExplosionType.SPHERE, ExplosionType.WILLOW, ExplosionType.GHOST];
      this.type = basicTypes[Math.floor(Math.random() * basicTypes.length)];
    }

    const distanceY = this.target.y - this.position.y;
    const gravity = settings.gravity * 1.5;

    const timeToApex = Math.sqrt(2 * Math.max(10, distanceY) / gravity);
    const initialVelY = gravity * timeToApex;

    const initialVelX = (this.target.x - this.position.x) / timeToApex;
    const initialVelZ = (this.target.z - this.position.z) / timeToApex;

    this.velocity = new Vector3(initialVelX, initialVelY, initialVelZ);
  }

  update(settings: AppSettings, deltaTime: number): void {
    if (deltaTime <= 0) return;

    const dt = deltaTime * 60;
    this.lifeTime += deltaTime;

    this.velocity.y -= settings.gravity * 1.5 * dt;

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    // 下坠到一定程度触发爆炸
    if (this.velocity.y <= -3) {
      this.exploded = true;
    }
  }

  /**
   * Create explosion particles
   */
  createExplosion(
      settings: AppSettings,
      spawnParticle: (opts: ParticleOptions3D) => Particle3D
  ): void {
    const baseCount = Math.min(800, Math.floor((150 + this.charge * 300) * settings.particleCountMultiplier));
    const sizeScale = settings.explosionSizeMultiplier;

    // 基础球形发射器
    const spawnSphere = (
        count: number,
        speedBase: number,
        hue: number,
        behavior: any = 'default',
        decay: number = 0.015
    ) => {
      for(let i=0; i<count; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const speed = (speedBase * 0.8 + Math.random() * speedBase * 0.4) * sizeScale;

        spawnParticle({
          x: this.position.x, y: this.position.y, z: this.position.z,
          originX: this.position.x, originY: this.position.y, originZ: this.position.z,
          hue: hue % 360,
          theta, phi, speed,
          gravity: settings.gravity,
          friction: settings.friction,
          behavior,
          decay
        });
      }
    };

    // 辅助：定点发射器 (用于形状)
    const spawnToShape = (x: number, y: number, z: number, hue: number) => {
      const len = Math.sqrt(x*x + y*y + z*z);
      if (len === 0) return;

      // 速度快，阻力大 -> 快速到达并停下
      const speed = 15 * sizeScale;
      const p = spawnParticle({
        x: this.position.x, y: this.position.y, z: this.position.z,
        hue: hue % 360,
        speed: 0,
        friction: 0.85,
        gravity: 0.01,
        decay: 0.005 + Math.random() * 0.005,
        behavior: 'stationary'
      });

      // 赋予方向向量
      p.velocity = new Vector3(
          (x/len) * speed * (len*0.1),
          (y/len) * speed * (len*0.1),
          (z/len) * speed * (len*0.1)
      );
    };

    switch (this.type) {
        // === 1. 双层花蕊 (Pistil) - 组合技 ===
      case ExplosionType.PISTIL: {
        // 外层：主色，速度快，数量多
        spawnSphere(baseCount, 25, this.hue, 'default', 0.01);
        // 内层：补色，速度慢，数量少，像花蕊
        const coreHue = (this.hue + 180) % 360;
        spawnSphere(baseCount * 0.4, 10, coreHue, 'glitter', 0.015);
        break;
      }

        // === 2. 闪烁爆裂 (Strobe) ===
      case ExplosionType.STROBE: {
        // 大量闪烁粒子，且颜色在白和主色之间跳变
        spawnSphere(baseCount, 22, this.hue, 'glitter', 0.008);
        // 加一点拖尾
        spawnSphere(baseCount * 0.3, 18, this.hue, 'willow', 0.01);
        break;
      }

        // === 3. 幽灵火 (Ghost) ===
      case ExplosionType.GHOST: {
        // 初始不可见(逻辑需在Particle中支持，这里用低alpha模拟)，慢慢显现
        // 或者用 'firefly' 行为模拟忽明忽暗
        spawnSphere(baseCount * 0.8, 15, this.hue, 'firefly', 0.005);
        break;
      }

        // === 4. 十字分裂 (Crossette) ===
      case ExplosionType.CROSSETTE: {
        // 发射 4 个方向的强力粒子束
        const arms = 8;
        for(let i=0; i<arms; i++) {
          // 在球面上均匀分布几个点
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          // 每个方向发射一束
          for(let j=0; j<20; j++) {
            const s = 20 + Math.random() * 10;
            // 稍微加一点散射
            spawnParticle({
              x: this.position.x, y: this.position.y, z: this.position.z,
              hue: this.hue,
              theta: theta + (Math.random()-0.5)*0.1,
              phi: phi + (Math.random()-0.5)*0.1,
              speed: s * sizeScale,
              gravity: settings.gravity, friction: 0.98,
              decay: 0.015,
              behavior: 'comet' // 带拖尾
            });
          }
        }
        break;
      }

        // === 5. 形状类 (复用之前的逻辑，但颜色更丰富) ===
      case ExplosionType.HEART_BEAT: {
        const count = baseCount;
        for (let i = 0; i < count; i++) {
          const t = Math.random() * Math.PI * 2;
          const scale = 2.0;
          const hx = 16 * Math.pow(Math.sin(t), 3) * scale;
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
          const hz = (Math.random() - 0.5) * 8;
          spawnToShape(hx, hy, hz, 350); // 红色
        }
        break;
      }

      case ExplosionType.BUTTERFLY: {
        const count = baseCount;
        for (let i = 0; i < count; i++) {
          const t = i * 0.1;
          const m = (Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5)) * 12;
          spawnToShape(Math.sin(t)*m, Math.cos(t)*m, (Math.random()-0.5)*5, this.hue);
        }
        break;
      }

      case ExplosionType.DRAGON: {
        const segments = 60;
        for (let i = 0; i < segments; i++) {
          const p = i / segments;
          const a = p * Math.PI * 6;
          const r = (10 + p * 30) * 1.5;
          for(let j=0; j<5; j++) {
            spawnToShape(
                Math.cos(a)*r + (Math.random()-0.5)*5,
                (p-0.5)*200 + (Math.random()-0.5)*5,
                Math.sin(a)*r + (Math.random()-0.5)*5,
                45 // Gold
            );
          }
        }
        break;
      }

      case ExplosionType.SATURN: {
        // 本体
        spawnSphere(baseCount * 0.4, 10, this.hue);
        // 环
        const ringHue = (this.hue + 60) % 360;
        for(let i=0; i<baseCount; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 35 + Math.random() * 10;
          spawnToShape(Math.cos(angle)*dist, Math.cos(angle)*dist*0.3, Math.sin(angle)*dist, ringHue);
        }
        break;
      }

      case ExplosionType.HELIX: {
        const h = 160;
        for(let i=0; i<baseCount; i++) {
          const y = (i/baseCount - 0.5) * h;
          const a = (i/baseCount) * Math.PI * 6;
          spawnToShape(Math.cos(a)*25, y, Math.sin(a)*25, this.hue);
          spawnToShape(Math.cos(a+Math.PI)*25, y, Math.sin(a+Math.PI)*25, (this.hue+180)%360);
        }
        break;
      }

      case ExplosionType.ZODIAC: {
        const len = 350;
        for(let i=0; i<len; i++) {
          const t = i * 0.15;
          spawnToShape((t - len*0.15/2)*12, Math.cos(t*0.5)*15, Math.sin(t)*30, 120);
        }
        break;
      }

      case ExplosionType.GREAT_WALL: {
        const w = 350, h = 40;
        for (let i = 0; i < 400; i++) {
          const x = (i/400 - 0.5) * w;
          const isT = Math.sin(x*0.15) > 0.8;
          spawnToShape(x, isT ? h*1.5 : h*Math.abs(Math.sin(x*0.05)), Math.sin(x*0.05)*20, 30);
        }
        break;
      }

      case ExplosionType.WILLOW:
        spawnSphere(baseCount, 18, this.hue, 'willow', 0.008);
        break;

      default:
        // 标准球形
        spawnSphere(baseCount, 22, this.hue, 'default');
        break;
    }
  }

  getColor(): { r: number; g: number; b: number } {
    const h = this.hue / 360;
    const s = 1;
    const l = 0.6;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return { r: hue2rgb(p, q, h + 1 / 3), g: hue2rgb(p, q, h), b: hue2rgb(p, q, h - 1 / 3) };
  }
}

// END OF FILE: src/core/Firework3D.ts