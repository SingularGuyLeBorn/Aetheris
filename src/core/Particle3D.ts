import { Vector3 } from './Vector3';
import { ParticleBehavior, ParticleOptions3D } from '../types';
import { getPhysicsEngine } from './PhysicsEngine';
import { ParticlePBRProperties, ParticleMaterialType, PBR_PRESETS } from './PBRMaterial';

/**
 * 3D Particle class for the firework system
 * Uses Three.js coordinate system (Y-up)
 * 
 * 升级特性：
 * - Verlet/RK4 积分器支持 (通过 PhysicsEngine)
 * - PBR 材质属性 (粗糙度、金属度、发光强度)
 * - 高精度轨迹计算
 */
export class Particle3D {
  public position: Vector3;
  public velocity: Vector3;
  public previousPosition: Vector3;  // Verlet 积分器所需
  public origin: Vector3;
  
  // 基础属性
  public hue: number = 0;
  public alpha: number = 1;
  public decay: number = 0.02;
  public friction: number = 0.95;
  public gravity: number = 0.005;  // Default gravity reduced for hover effect
  public resistance: number = 0.005;
  public size: number = 1;
  public life: number = 1;
  public behavior: ParticleBehavior = 'default';
  public twinkleFactor: number = 0;
  public timeOffset: number = 0;
  public rotationSpeed: number = 0;
  
  // PBR 材质属性
  public roughness: number = 0.3;
  public metalness: number = 0.5;
  public emissiveIntensity: number = 2.0;
  public temperature: number = 5000;  // 色温 (Kelvin)
  
  // 物理引擎标记
  public useAdvancedPhysics: boolean = true;
  private isFirstUpdate: boolean = true;

  // Trail for comet/willow effects
  public trail: Vector3[] = [];
  public maxTrailLength: number = 10;

  constructor() {
    this.position = new Vector3();
    this.velocity = new Vector3();
    this.previousPosition = new Vector3();
    this.origin = new Vector3();
  }

  init(options: ParticleOptions3D): void {
    this.position = new Vector3(options.x, options.y, options.z);
    this.previousPosition = this.position.clone();  // Verlet 积分器初始化
    this.origin = new Vector3(
      options.originX ?? options.x,
      options.originY ?? options.y,
      options.originZ ?? options.z
    );
    this.hue = options.hue;
    this.behavior = options.behavior ?? 'default';
    this.life = 1;
    this.alpha = 1;
    this.timeOffset = Math.random() * 100;
    this.twinkleFactor = Math.random();
    this.trail = [];
    this.isFirstUpdate = true;

    // Calculate velocity from spherical coordinates
    const theta = options.theta ?? Math.random() * Math.PI * 2;
    const phi = options.phi ?? Math.random() * Math.PI;
    const speed = options.speed ?? Math.random() * 10 + 2;

    this.velocity = new Vector3(
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.cos(phi),
      speed * Math.sin(phi) * Math.sin(theta)
    );

    // Apply behavior-specific settings with PBR properties
    if (this.behavior === 'willow') {
      this.friction = options.friction ?? 0.99;
      this.gravity = options.gravity ?? 0.02;   // 降低重力
      this.decay = options.decay ?? 0.003;      // 降低衰减
      this.size = options.size ?? 1.5;
      this.maxTrailLength = 15;
      // PBR: 柳叶烟花 - 柔和、低金属度
      this.roughness = 0.7;
      this.metalness = 0.2;
      this.emissiveIntensity = 1.5;
      this.temperature = 3500;
    } else if (this.behavior === 'glitter') {
      this.friction = options.friction ?? 0.96;
      this.gravity = options.gravity ?? 0.05;   // 降低重力
      this.decay = options.decay ?? 0.01;       // 降低衰减
      this.size = options.size ?? Math.random() * 2 + 1;
      // PBR: 闪粉 - 高金属度、低粗糙度，强反射
      this.roughness = 0.1;
      this.metalness = 1.0;
      this.emissiveIntensity = 4.0 + Math.random() * 2;
      this.temperature = 6500;
    } else if (this.behavior === 'firefly') {
      this.friction = 0.94;
      this.gravity = -0.01;
      this.decay = 0.005;
      this.size = 1.2;
      // PBR: 萤火虫 - 强发光、有机质感
      this.roughness = 0.4;
      this.metalness = 0.1;
      this.emissiveIntensity = 3.0;
      this.temperature = 4500;
    } else if (this.behavior === 'comet') {
      this.friction = 0.995;
      this.gravity = 0.01;
      this.decay = options.decay ?? 0.006;
      this.size = 3;
      this.resistance = 0.0001;
      this.maxTrailLength = 20;
      // PBR: 彗星 - 超强发光、等离子质感
      this.roughness = 0.05;
      this.metalness = 0.7;
      this.emissiveIntensity = 6.0;
      this.temperature = 8000;
    } else if (this.behavior === 'galaxy') {
      this.friction = 0.98;
      this.gravity = 0;
      this.decay = options.decay ?? 0.008;
      this.size = Math.random() * 1.5 + 0.5;
      this.rotationSpeed = (Math.random() - 0.5) * 0.05;
      // PBR: 星系 - 中等发光、星尘质感
      this.roughness = 0.5;
      this.metalness = 0.6;
      this.emissiveIntensity = 2.5;
      this.temperature = 5500 + Math.random() * 3000;
    } else {
      this.friction = options.friction ?? 0.92;  // High friction (drag)
      this.gravity = options.gravity ?? 0.005;   // HOVER EFFECT: Near zero gravity
      this.decay = options.decay ?? Math.random() * 0.008 + 0.004;
      this.size = options.size ?? Math.random() * 2 + 1;
      // PBR: 默认火花 - 标准烟花效果
      this.roughness = 0.3;
      this.metalness = 0.5;
      this.emissiveIntensity = 2.0 + this.life;
      this.temperature = 3000 + Math.random() * 4000;
    }

    this.resistance = options.resistance ?? 0.002;  // 降低空气阻力
  }

  update(deltaTime: number): void {
    // Skip update if effectively paused
    if (deltaTime <= 0) return;
    
    // Use a minimum dt to prevent division by zero and ensure smooth updates
    const dt = Math.max(deltaTime * 60, 0.001); // Normalize to 60fps with minimum

    // Store trail position (before position update)
    if (this.behavior === 'comet' || this.behavior === 'willow') {
      this.trail.push(this.position.clone());
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }

    // Behavior-specific velocity modifiers
    if (this.behavior === 'firefly') {
      const now = performance.now() * 0.005 + this.timeOffset;
      this.velocity.x += Math.sin(now) * 0.05 * dt;
      this.velocity.y += Math.cos(now * 0.7) * 0.05 * dt;
      this.velocity.z += Math.sin(now * 1.3) * 0.05 * dt;
    } else if (this.behavior === 'galaxy') {
      const dx = this.position.x - this.origin.x;
      const dz = this.position.z - this.origin.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx) + this.rotationSpeed * dt;

      const targetX = this.origin.x + Math.cos(angle) * (dist + this.velocity.x * dt);
      const targetZ = this.origin.z + Math.sin(angle) * (dist + this.velocity.z * dt);

      if (dt > 0.001) {
        this.velocity.x = (targetX - this.position.x) / dt;
        this.velocity.z = (targetZ - this.position.z) / dt;
      }
    }

    // === 高级物理计算 (Verlet 积分器) ===
    if (this.useAdvancedPhysics && !this.isFirstUpdate) {
      // Verlet 积分: x(t+dt) = 2*x(t) - x(t-dt) + a*dt^2
      // 加速度 = 重力 + 空气阻力
      
      // 计算空气阻力加速度
      const speedSq = this.velocity.x * this.velocity.x +
                      this.velocity.y * this.velocity.y +
                      this.velocity.z * this.velocity.z;
      
      let dragAx = 0, dragAy = 0, dragAz = 0;
      if (speedSq > 0.001) {
        const speed = Math.sqrt(speedSq);
        const dragMag = speedSq * this.resistance;
        dragAx = -(this.velocity.x / speed) * dragMag;
        dragAy = -(this.velocity.y / speed) * dragMag;
        dragAz = -(this.velocity.z / speed) * dragMag;
      }
      
      // 总加速度
      const ax = dragAx;
      const ay = -this.gravity + dragAy;
      const az = dragAz;
      
      // Verlet 积分公式
      const newX = 2 * this.position.x - this.previousPosition.x + ax * deltaTime * deltaTime * 3600;
      const newY = 2 * this.position.y - this.previousPosition.y + ay * deltaTime * deltaTime * 3600;
      const newZ = 2 * this.position.z - this.previousPosition.z + az * deltaTime * deltaTime * 3600;
      
      // 从位置差推导新速度
      this.velocity.x = (newX - this.position.x) / dt;
      this.velocity.y = (newY - this.position.y) / dt;
      this.velocity.z = (newZ - this.position.z) / dt;
      
      // 应用摩擦力
      const frictionPower = Math.pow(this.friction, dt);
      this.velocity.x *= frictionPower;
      this.velocity.y *= frictionPower;
      this.velocity.z *= frictionPower;
      
      // 更新位置
      this.previousPosition.x = this.position.x;
      this.previousPosition.y = this.position.y;
      this.previousPosition.z = this.position.z;
      
      this.position.x = newX;
      this.position.y = newY;
      this.position.z = newZ;
    } else {
      // === 标准欧拉积分 (兼容模式或首帧) ===
      
      // Apply air resistance
      const speedSq = this.velocity.x * this.velocity.x +
                      this.velocity.y * this.velocity.y +
                      this.velocity.z * this.velocity.z;
      if (speedSq > 0.001) {
        const speed = Math.sqrt(speedSq);
        const drag = speedSq * this.resistance * dt;
        this.velocity.x -= (this.velocity.x / speed) * drag;
        this.velocity.y -= (this.velocity.y / speed) * drag;
        this.velocity.z -= (this.velocity.z / speed) * drag;
      }

      // Apply friction
      const frictionPower = Math.pow(this.friction, dt);
      this.velocity.x *= frictionPower;
      this.velocity.y *= frictionPower;
      this.velocity.z *= frictionPower;

      // Apply gravity (Y-up in Three.js)
      this.velocity.y -= this.gravity * dt;

      // Store previous position for Verlet
      this.previousPosition.x = this.position.x;
      this.previousPosition.y = this.position.y;
      this.previousPosition.z = this.position.z;

      // Update position
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      
      this.isFirstUpdate = false;
    }

    // Update life
    this.life -= this.decay * dt;

    // Update alpha based on behavior
    if (this.behavior === 'ghost') {
      this.alpha = (Math.sin(this.life * 20) * 0.5 + 0.5) * this.life;
    } else if (this.behavior === 'firefly') {
      this.alpha = (Math.sin(performance.now() * 0.01 + this.timeOffset) * 0.4 + 0.6) * this.life;
    } else {
      this.alpha = this.life;
    }

    // Glitter twinkle
    if (this.behavior === 'glitter') {
      this.twinkleFactor = (this.twinkleFactor + 0.15 * dt) % 1;
      // 闪粉动态发光强度
      this.emissiveIntensity = 3.0 + Math.sin(this.twinkleFactor * Math.PI * 2) * 2.0;
    }
    
    // 动态更新 PBR 发光强度 (随生命值衰减)
    if (this.behavior !== 'glitter') {
      this.emissiveIntensity = this.emissiveIntensity * (0.5 + this.life * 0.5);
    }
  }

  isDead(): boolean {
    return this.life <= 0;
  }

  getColor(): { r: number; g: number; b: number } {
    // HSL to RGB conversion
    const h = this.hue / 360;
    const s = 1;
    const l = 0.75;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;

    return {
      r: hue2rgb(p, q, h + 1/3),
      g: hue2rgb(p, q, h),
      b: hue2rgb(p, q, h - 1/3)
    };
  }
}
