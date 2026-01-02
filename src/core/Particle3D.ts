import { Vector3 } from './Vector3';
import { ParticleBehavior, ParticleOptions3D } from '../types';

/**
 * 3D Particle class for the firework system
 * Uses Three.js coordinate system (Y-up)
 */
export class Particle3D {
  public position: Vector3;
  public velocity: Vector3;
  public origin: Vector3;
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
  public rotationSpeed: number = 0;

  // Trail for comet/willow effects
  public trail: Vector3[] = [];
  public maxTrailLength: number = 10;

  constructor() {
    this.position = new Vector3();
    this.velocity = new Vector3();
    this.origin = new Vector3();
  }

  init(options: ParticleOptions3D): void {
    this.position = new Vector3(options.x, options.y, options.z);
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

    // Calculate velocity from spherical coordinates
    const theta = options.theta ?? Math.random() * Math.PI * 2;
    const phi = options.phi ?? Math.random() * Math.PI;
    const speed = options.speed ?? Math.random() * 10 + 2;

    this.velocity = new Vector3(
      speed * Math.sin(phi) * Math.cos(theta),
      speed * Math.cos(phi),
      speed * Math.sin(phi) * Math.sin(theta)
    );

    // Apply behavior-specific settings
    if (this.behavior === 'willow') {
      this.friction = options.friction ?? 0.98;
      this.gravity = options.gravity ?? 0.04;
      this.decay = options.decay ?? 0.006;
      this.size = options.size ?? 1.5;
      this.maxTrailLength = 15;
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
      this.maxTrailLength = 20;
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
  }

  update(deltaTime: number): void {
    // Use a minimum dt to prevent division by zero and ensure smooth updates
    const dt = Math.max(deltaTime * 60, 0.001); // Normalize to 60fps with minimum
    
    // Skip update if effectively paused
    if (deltaTime <= 0) return;

    // Store trail position
    if (this.behavior === 'comet' || this.behavior === 'willow') {
      this.trail.push(this.position.clone());
      if (this.trail.length > this.maxTrailLength) {
        this.trail.shift();
      }
    }

    // Behavior-specific updates
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

      // Safe division
      if (dt > 0.001) {
        this.velocity.x = (targetX - this.position.x) / dt;
        this.velocity.z = (targetZ - this.position.z) / dt;
      }
    }

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

    // Update position
    this.position.x += this.velocity.x * dt;
    this.position.y += this.velocity.y * dt;
    this.position.z += this.velocity.z * dt;

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
