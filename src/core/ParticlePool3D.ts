import { Particle3D } from './Particle3D';
import { ParticleOptions3D } from '../types';

/**
 * Performance-optimized 3D Particle Pool
 * Manages particle lifecycle with object pooling to minimize GC
 */
export class ParticlePool3D {
  private pool: Particle3D[] = [];
  private active: Particle3D[] = [];
  private maxActive: number;

  constructor(maxActive: number) {
    this.maxActive = maxActive;
    // Warm up the pool
    for (let i = 0; i < 2000; i++) {
      this.pool.push(new Particle3D());
    }
  }

  /**
   * Get a particle from the pool
   * Recycles the oldest active particle if limit is reached
   */
  get(options: ParticleOptions3D): Particle3D {
    let p: Particle3D;

    if (this.active.length >= this.maxActive) {
      p = this.active.shift()!;
    } else {
      p = this.pool.pop() || new Particle3D();
    }

    p.init(options);
    this.active.push(p);
    return p;
  }

  /**
   * Update all active particles
   */
  update(deltaTime: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.update(deltaTime);
      if (p.isDead()) {
        this.active.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  /**
   * Get all active particles for rendering
   */
  getActiveParticles(): Particle3D[] {
    return this.active;
  }

  /**
   * Get the count of active particles
   */
  get activeCount(): number {
    return this.active.length;
  }

  /**
   * Clear all active particles
   */
  clear(): void {
    while (this.active.length > 0) {
      const p = this.active.pop()!;
      this.pool.push(p);
    }
  }
}
