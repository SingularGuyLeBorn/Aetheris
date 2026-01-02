
import { Particle } from './Particle';
import { ParticleOptions } from '../types';

/**
 * Performance-optimized Particle Pool
 */
export class ParticlePool {
  private pool: Particle[] = [];
  private active: Particle[] = [];
  private maxActive: number;

  constructor(maxActive: number) {
    this.maxActive = maxActive;
    // Warm up the pool
    for (let i = 0; i < 2000; i++) {
      this.pool.push(new Particle());
    }
  }

  /**
   * Get a particle: recycle the oldest active one if limit reached.
   */
  get(options: ParticleOptions): Particle {
    let p: Particle;
    
    if (this.active.length >= this.maxActive) {
      p = this.active.shift()!;
    } else {
      p = this.pool.pop() || new Particle();
    }
    
    p.init(options);
    this.active.push(p);
    return p;
  }

  updateAndDraw(ctx: CanvasRenderingContext2D): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const p = this.active[i];
      p.update();
      p.draw(ctx);
      if (p.isDead()) {
        this.active.splice(i, 1);
        this.pool.push(p);
      }
    }
  }

  get activeCount() { return this.active.length; }
}
