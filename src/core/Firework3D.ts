// FILE: src/core/Firework3D.ts

import { Vector3 } from './Vector3';
import { ExplosionType, AscensionType, ColorStyle, AppSettings, ParticleOptions3D, FireworkConfig } from '../types';
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
  public ascension: AscensionType;
  public colorStyle: ColorStyle;
  public lifeTime: number = 0;

  private initialX: number;
  private initialZ: number;

  constructor(options: Firework3DOptions, settings: AppSettings, config: FireworkConfig) {
    this.initialX = options.startX;
    this.initialZ = options.startZ;
    this.position = new Vector3(options.startX, 0, options.startZ);
    this.target = new Vector3(options.targetX, options.targetY, options.targetZ);
    this.hue = options.hue;
    this.charge = options.charge;
    this.trailLength = settings.trailLength;

    // 1. 从配置中随机选择升空方式
    const ascList = config.enabledAscensions.length > 0 ? config.enabledAscensions : [AscensionType.LINEAR];
    this.ascension = ascList[Math.floor(Math.random() * ascList.length)];

    // 2. 从配置中随机选择颜色风格
    const colList = config.enabledColors.length > 0 ? config.enabledColors : [ColorStyle.SINGLE];
    this.colorStyle = colList[Math.floor(Math.random() * colList.length)];

    // 3. 从配置中随机选择爆炸类型
    const typeList = config.enabledShapes.length > 0 ? config.enabledShapes : [ExplosionType.SPHERE];
    this.type = typeList[Math.floor(Math.random() * typeList.length)];

    // 4. 计算初始速度
    const distanceY = this.target.y - this.position.y;
    let gravity = settings.gravity * 1.5;

    if (this.ascension === AscensionType.ACCELERATE) {
      gravity *= 0.8;
    }

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

    // === 升空物理模拟 ===
    switch (this.ascension) {
      case AscensionType.SPIRAL: {
        const freq = 10;
        const angle = this.lifeTime * freq;
        this.velocity.x += Math.cos(angle) * 0.6;
        this.velocity.z += Math.sin(angle) * 0.6;
        this.velocity.y -= settings.gravity * 1.5 * dt;
        break;
      }
      case AscensionType.ZIGZAG: {
        const freq = 8;
        this.velocity.x += Math.cos(this.lifeTime * freq) * 0.8;
        this.velocity.y -= settings.gravity * 1.5 * dt;
        break;
      }
      case AscensionType.ACCELERATE: {
        if (this.lifeTime < 0.5) this.velocity.y -= settings.gravity * 1.5 * dt;
        else if (this.lifeTime < 1.0) this.velocity.y += 0.3 * dt;
        else this.velocity.y -= settings.gravity * 2.0 * dt;
        break;
      }
      case AscensionType.DRAWING: {
        this.velocity.y -= settings.gravity * 1.2 * dt;
        break;
      }
      case AscensionType.WOBBLE: {
        this.velocity.x += (Math.random()-0.5) * 1.0;
        this.velocity.z += (Math.random()-0.5) * 1.0;
        this.velocity.y -= settings.gravity * 1.5 * dt;
        break;
      }
      default: // LINEAR
        this.velocity.y -= settings.gravity * 1.5 * dt;
        break;
    }

    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

    if (this.velocity.y <= -2.5) {
      this.exploded = true;
    }
  }

  createExplosion(
      settings: AppSettings,
      spawnParticle: (opts: ParticleOptions3D) => Particle3D
  ): void {
    let baseCount = Math.min(800, Math.floor((150 + this.charge * 300) * settings.particleCountMultiplier));
    const sizeScale = settings.explosionSizeMultiplier;

    // === 颜色生成器 ===
    const getParticleHue = (index: number, total: number): number => {
      switch (this.colorStyle) {
        case ColorStyle.RAINBOW: return (index / total) * 360;
        case ColorStyle.DUAL: return index % 2 === 0 ? this.hue : (this.hue + 180) % 360;
        case ColorStyle.GRADIENT: return this.hue + (index / total) * 60 - 30;
        case ColorStyle.GOLDEN: return 45 + Math.random() * 10;
        case ColorStyle.PASTEL: return this.hue; // 在渲染层处理饱和度更好，这里暂且用原色
        default: return this.hue;
      }
    };

    // === 发射器工厂 ===
    const spawn = (theta: number, phi: number, speed: number, hueOverride?: number, behavior: any = 'default', decay?: number, friction?: number, size?: number) => {
      spawnParticle({
        x: this.position.x, y: this.position.y, z: this.position.z,
        originX: this.position.x, originY: this.position.y, originZ: this.position.z,
        hue: hueOverride ?? this.hue,
        theta, phi, speed: speed * sizeScale,
        gravity: settings.gravity,
        friction: friction ?? settings.friction,
        behavior, size,
        decay: decay ?? (0.01 + Math.random() * 0.015)
      });
    };

    const spawnToShape = (x: number, y: number, z: number, hue: number) => {
      const speedMod = 15 * sizeScale;
      const len = Math.sqrt(x*x + y*y + z*z);
      if (len === 0) return;
      const p = spawnParticle({
        x: this.position.x, y: this.position.y, z: this.position.z,
        hue: hue, speed: 0,
        friction: 0.88, gravity: 0.02, decay: 0.005 + Math.random() * 0.008,
        behavior: 'stationary'
      });
      p.velocity = new Vector3(
          (x/len)*speedMod*(len*0.1), (y/len)*speedMod*(len*0.1), (z/len)*speedMod*(len*0.1)
      );
    };

    // === 32种烟花逻辑实现 ===
    switch (this.type) {
        // --- 基础类 ---
      case ExplosionType.SPHERE:
      case ExplosionType.BURST: {
        for (let i = 0; i < baseCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          spawn(theta, phi, 20 + Math.random() * 10, getParticleHue(i, baseCount));
        }
        break;
      }
      case ExplosionType.RING: {
        for (let i = 0; i < baseCount; i++) {
          spawn(Math.random() * Math.PI * 2, Math.PI / 2, 25, getParticleHue(i, baseCount));
        }
        break;
      }
      case ExplosionType.DOUBLE_RING: {
        for (let i = 0; i < baseCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          spawn(theta, Math.PI/2, 30, this.hue); // 外
          spawn(theta, Math.PI/2, 15, (this.hue+180)%360); // 内
        }
        break;
      }
      case ExplosionType.WILLOW: {
        for (let i = 0; i < baseCount; i++) {
          spawn(Math.random() * Math.PI * 2, Math.random() * Math.PI, 15, getParticleHue(i, baseCount), 'willow', 0.008);
        }
        break;
      }
      case ExplosionType.STAGED: {
        for (let i = 0; i < baseCount*0.5; i++) spawn(Math.random()*6.28, Math.acos(2*Math.random()-1), 35, this.hue, 'default', 0.05);
        for (let i = 0; i < baseCount*0.5; i++) spawn(Math.random()*6.28, Math.acos(2*Math.random()-1), 8, (this.hue+60)%360, 'glitter', 0.008, 0.92);
        break;
      }
      case ExplosionType.FLASH: {
        for (let i = 0; i < baseCount; i++) {
          spawn(Math.random()*6.28, Math.acos(2*Math.random()-1), 25, 0, 'glitter', 0.03, 0.9); // 白闪
        }
        break;
      }

        // --- 自然/生物 ---
      case ExplosionType.FLOWER: {
        // 花瓣算法
        const petals = 6;
        for (let i = 0; i < baseCount; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = (Math.sin(theta * petals) + 1) * 0.5 * Math.PI; // 花瓣形状
          spawn(theta, phi * 0.5, 20, getParticleHue(i, baseCount));
        }
        break;
      }
      case ExplosionType.BUTTERFLY: {
        const count = baseCount * 1.2;
        for (let i = 0; i < count; i++) {
          const t = i * 0.1;
          const m = (Math.exp(Math.cos(t)) - 2*Math.cos(4*t) - Math.pow(Math.sin(t/12), 5)) * 12;
          spawnToShape(Math.sin(t)*m, Math.cos(t)*m, (Math.random()-0.5)*4, getParticleHue(i, count));
        }
        break;
      }
      case ExplosionType.FALLING_LEAVES: {
        for (let i = 0; i < baseCount; i++) {
          const theta = Math.random() * 6.28;
          const r = Math.random() * 40;
          const p = spawnParticle({
            x: this.position.x, y: this.position.y, z: this.position.z,
            hue: getParticleHue(i, baseCount), speed: 0, gravity: 0.03, friction: 0.85, decay: 0.006, behavior: 'falling'
          });
          p.velocity = new Vector3(Math.cos(theta)*r, 10 + (Math.random()-0.5)*15, Math.sin(theta)*r);
        }
        break;
      }
      case ExplosionType.SNOWFLAKE: {
        const arms = 6;
        for(let i=0; i<arms; i++) {
          const angle = (i/arms) * Math.PI * 2;
          for(let j=0; j<20; j++) {
            // 主干
            spawnToShape(Math.cos(angle)*j*2, Math.sin(angle)*j*2, 0, 200); // 蓝色系
            // 分叉
            if(j > 10 && j % 3 === 0) {
              spawnToShape(Math.cos(angle+0.5)*j*2, Math.sin(angle+0.5)*j*2, 0, 200);
              spawnToShape(Math.cos(angle-0.5)*j*2, Math.sin(angle-0.5)*j*2, 0, 200);
            }
          }
        }
        break;
      }
      case ExplosionType.FISH: {
        // 简单鱼形 (侧面)
        for(let i=0; i<baseCount; i++) {
          const t = (i/baseCount) * Math.PI * 2;
          const x = 30 * Math.cos(t) - 15 * Math.sin(t) * Math.sin(t);
          const y = 30 * Math.cos(t) * Math.sin(t);
          spawnToShape(x, y, (Math.random()-0.5)*5, 10); // 红色锦鲤
        }
        break;
      }
      case ExplosionType.CAT_FACE: {
        // 脸圆
        for(let i=0; i<50; i++) {
          const t = (i/50)*6.28;
          spawnToShape(Math.cos(t)*20, Math.sin(t)*15, 0, 30);
        }
        // 耳朵
        for(let i=0; i<20; i++) {
          const x = 10 + i * 0.5; const y = 10 + i * 1.5;
          spawnToShape(x, y, 0, 30); spawnToShape(-x, y, 0, 30);
        }
        // 眼睛嘴巴 (略)
        spawnToShape(-8, 5, 0, 120); spawnToShape(8, 5, 0, 120);
        break;
      }

        // --- 几何 ---
      case ExplosionType.CUBE: {
        const side = 20;
        const step = 5;
        for(let x=-side; x<=side; x+=step) {
          for(let y=-side; y<=side; y+=step) {
            for(let z=-side; z<=side; z+=step) {
              if (Math.abs(x)===side || Math.abs(y)===side || Math.abs(z)===side) {
                spawnToShape(x, y, z, getParticleHue(x+y+z, side*3));
              }
            }
          }
        }
        break;
      }
      case ExplosionType.PYRAMID: {
        // 四面体
        const h = 30;
        for(let i=0; i<100; i++) {
          const t = i/100;
          // 边缘
          spawnToShape(t*h, -h/2, t*h, this.hue);
          spawnToShape(-t*h, -h/2, t*h, this.hue);
          // 顶点连线
          spawnToShape(t*h, -h/2 + (1-t)*h, t*h, this.hue); // 粗略模拟
        }
        break;
      }
      case ExplosionType.STAR: {
        const pts = 5;
        for(let i=0; i<baseCount; i++) {
          const ang = (i / baseCount) * Math.PI * 2;
          const r = 30 * (Math.abs(Math.cos(ang * pts / 2)) * 0.5 + 0.5); // 简单的星形极坐标
          // 更好的星形：
          // const r = 30 * (Math.sin(ang * 5 / 2 + Math.PI/2) * 0.5 + 0.8);
          spawnToShape(Math.cos(ang)*r, Math.sin(ang)*r, 0, this.hue);
        }
        break;
      }
      case ExplosionType.HEART_BEAT: {
        const count = Math.floor(baseCount * 1.2);
        for (let i = 0; i < count; i++) {
          const t = Math.random() * Math.PI * 2;
          const scale = 2.0;
          const hx = 16 * Math.pow(Math.sin(t), 3) * scale;
          const hy = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
          spawnToShape(hx, hy, (Math.random() - 0.5) * 8, 330 + Math.random() * 30);
        }
        break;
      }
      case ExplosionType.SMILE: {
        const r = 25;
        // 脸
        for(let i=0; i<60; i++) {
          const t = (i/60)*6.28;
          spawnToShape(Math.cos(t)*r, Math.sin(t)*r, 0, 50); // 黄脸
        }
        // 眼
        spawnToShape(-8, 8, 0, 0); spawnToShape(8, 8, 0, 0);
        // 嘴
        for(let i=0; i<30; i++) {
          const t = Math.PI + (i/30)*Math.PI;
          spawnToShape(Math.cos(t)*15, Math.sin(t)*15 - 5, 0, 0);
        }
        break;
      }
      case ExplosionType.SPIRAL: {
        // 阿基米德螺旋
        for(let i=0; i<baseCount; i++) {
          const t = i * 0.1;
          const r = 1 + t * 0.5;
          spawnToShape(r*Math.cos(t), r*Math.sin(t), 0, getParticleHue(i, baseCount));
        }
        break;
      }

        // --- 宏大 ---
      case ExplosionType.GALAXY: {
        const arms = 5;
        for(let i=0; i<baseCount; i++) {
          const arm = Math.floor(Math.random() * arms);
          const dist = Math.random() * 40;
          const angle = (arm / arms) * 6.28 + dist * 0.1;
          spawnToShape(Math.cos(angle)*dist, (Math.random()-0.5)*5, Math.sin(angle)*dist, getParticleHue(dist, 40));
        }
        break;
      }
      case ExplosionType.SATURN: {
        for(let i=0; i<baseCount/2; i++) { // 本体
          const theta = Math.random()*6.28, phi = Math.acos(2*Math.random()-1);
          spawn(theta, phi, Math.random()*15, 40);
        }
        for(let i=0; i<baseCount; i++) { // 环
          const angle = Math.random()*6.28, dist = 30+Math.random()*10;
          spawnToShape(Math.cos(angle)*dist, Math.cos(angle)*dist*0.3, Math.sin(angle)*dist, 200);
        }
        break;
      }
      case ExplosionType.HELIX: {
        const h = 100, turns = 3;
        for(let i=0; i<baseCount; i++) {
          const y = (i/baseCount - 0.5) * h;
          const angle = (i/baseCount) * 6.28 * turns;
          spawnToShape(Math.cos(angle)*20, y, Math.sin(angle)*20, this.hue);
          spawnToShape(Math.cos(angle+Math.PI)*20, y, Math.sin(angle+Math.PI)*20, (this.hue+180)%360);
        }
        break;
      }
      case ExplosionType.DRAGON: {
        const segments = 50;
        for (let i = 0; i < segments; i++) {
          const p = i / segments;
          const a = p * 6.28 * 2;
          const r = (10 + p * 30);
          spawnToShape(Math.cos(a)*r, (p-0.5)*200, Math.sin(a)*r, 45);
        }
        break;
      }
      case ExplosionType.GREAT_WALL: {
        const len = 300, h = 40;
        for (let i = 0; i < 300; i++) {
          const x = (i/300 - 0.5) * len;
          const tower = Math.sin(x*0.15) > 0.8;
          const y = tower ? h*1.5 : h*Math.abs(Math.sin(x*0.05));
          spawnToShape(x, y, Math.sin(x*0.05)*20, 30);
        }
        break;
      }
      case ExplosionType.ZODIAC: {
        // 蛇
        for(let i=0; i<300; i++) {
          const t = i * 0.15;
          spawnToShape((t - 300*0.15/2)*10, Math.cos(t*0.5)*15, Math.sin(t)*30, 120);
        }
        break;
      }
      case ExplosionType.GHOST: {
        for (let i = 0; i < baseCount; i++) {
          const theta = Math.random() * 6.28, phi = Math.acos(2 * Math.random() - 1);
          spawn(theta, phi, 10 + Math.random() * 25, 260, 'ghost', 0.01, 0.94);
        }
        break;
      }
      case ExplosionType.CROSS_STEP: {
        for(let j=0; j<4; j++) {
          const baseTheta = (j/4)*6.28, basePhi = Math.PI/2;
          for(let k=0; k<40; k++) spawn(baseTheta, basePhi, 10+k, (this.hue+k*5)%360, 'glitter', 0.015);
        }
        break;
      }

        // --- 新增创意 ---
      case ExplosionType.ATOM: {
        // 核
        for(let i=0; i<50; i++) spawnToShape((Math.random()-0.5)*10, (Math.random()-0.5)*10, (Math.random()-0.5)*10, 0);
        // 电子轨道
        const orbits = 3;
        for(let o=0; o<orbits; o++) {
          const rotX = Math.random()*3, rotY = Math.random()*3;
          for(let i=0; i<100; i++) {
            const a = (i/100)*6.28;
            const r = 30;
            let x = Math.cos(a)*r, y = Math.sin(a)*r, z = 0;
            // 3D 旋转矩阵简化
            // ...这里简化处理，只做平面圆
            if (o===0) spawnToShape(x, y, z, 200);
            else if (o===1) spawnToShape(x, z, y, 200);
            else spawnToShape(z, x, y, 200);
          }
        }
        break;
      }
      case ExplosionType.FAN: {
        // 扇形向上
        for(let i=0; i<baseCount; i++) {
          const a = (i/baseCount) * Math.PI; // 0 to PI
          const r = 10 + Math.random() * 30;
          spawnToShape(Math.cos(a)*r, Math.sin(a)*r, 0, getParticleHue(i, baseCount));
        }
        break;
      }
      case ExplosionType.WATERFALL: {
        // 顶部水平喷发，然后重力接管
        for(let i=0; i<baseCount; i++) {
          const theta = Math.random() * 6.28;
          const r = Math.random() * 20;
          const p = spawnParticle({
            x: this.position.x, y: this.position.y, z: this.position.z,
            hue: 200, speed: 0, gravity: 0.05, friction: 0.95, decay: 0.005, behavior: 'default'
          });
          p.velocity = new Vector3(Math.cos(theta)*r, 5, Math.sin(theta)*r);
        }
        break;
      }
      case ExplosionType.CHAOS: {
        for(let i=0; i<baseCount; i++) {
          spawn(Math.random()*6.28, Math.random()*3.14, Math.random()*40, Math.random()*360);
        }
        break;
      }
      case ExplosionType.TEXT_HI: {
        // H
        for(let y=-20; y<=20; y+=2) { spawnToShape(-15, y, 0, this.hue); spawnToShape(-5, y, 0, this.hue); }
        for(let x=-15; x<=-5; x+=2) spawnToShape(x, 0, 0, this.hue);
        // I
        for(let y=-20; y<=20; y+=2) spawnToShape(10, y, 0, this.hue);
        break;
      }
      case ExplosionType.CROWN: {
        for(let i=0; i<baseCount; i++) {
          const a = (i/baseCount)*6.28;
          const r = 30;
          const h = 20 * Math.abs(Math.sin(a*3)); // 皇冠波浪
          spawnToShape(Math.cos(a)*r, h, Math.sin(a)*r, 50);
        }
        break;
      }

      default:
        for (let i = 0; i < baseCount; i++) {
          const theta = Math.random() * 6.28, phi = Math.acos(2*Math.random()-1);
          spawn(theta, phi, 10+Math.random()*20, this.hue);
        }
        break;
    }
  }

  getColor(): { r: number; g: number; b: number } {
    const h = this.hue / 360; const s = 1; const l = 0.6;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t; if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6; return p;
    };
    return { r: hue2rgb(p, q, h + 1/3), g: hue2rgb(p, q, h), b: hue2rgb(p, q, h - 1/3) };
  }
}

// END OF FILE: src/core/Firework3D.ts