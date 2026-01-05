/**
 * MorphingEngine.ts - 形态变形引擎
 * 
 * 核心功能：
 * - 粒子到目标点的最优匹配 (基于最小总距离)
 * - 平滑的形态过渡动画
 * - 处理粒子数量不匹配的情况 (自动标记多余粒子)
 */

import { Vector3 } from '../Vector3';
import { Curve, evaluateCurve, PRESET_CURVES } from './types';

/**
 * 粒子状态
 */
export interface MorphParticle {
  /** 当前位置 */
  position: Vector3;
  /** 当前速度 */
  velocity: Vector3;
  /** 目标位置 (来自形状) */
  targetPosition: Vector3;
  /** 原始位置 (变形开始时的位置) */
  originPosition: Vector3;
  /** 变形进度 (0-1) */
  morphProgress: number;
  /** 是否正在变形 */
  isMorphing: boolean;
  /** 粒子唯一ID */
  id: number;
  /** 是否为多余粒子 (需要消散) */
  isExcess?: boolean;
}

/**
 * 变形配置
 */
export interface MorphConfig {
  /** 变形持续时间 (秒) */
  duration: number;
  /** 过渡曲线 */
  easingCurve: Curve;
  /** 吸引力强度 */
  attractionStrength: number;
  /** 阻尼系数 */
  damping: number;
  /** 变形模式 */
  mode: 'smooth' | 'snap' | 'physics';
  /** 最大速度限制 */
  maxSpeed: number;
  /** 到位阈值 (距离目标多近算到位) */
  arrivalThreshold: number;
}

/**
 * 默认变形配置
 */
export const DEFAULT_MORPH_CONFIG: MorphConfig = {
  duration: 1.5,
  easingCurve: PRESET_CURVES.EASE_IN_OUT,
  attractionStrength: 6000, 
  damping: 0.95,
  mode: 'physics',
  maxSpeed: 8000,           
  arrivalThreshold: 1.0
};

/**
 * 形态变形引擎
 */
export class MorphingEngine {
  private config: MorphConfig;
  private particles: MorphParticle[] = [];
  private targetPoints: Vector3[] = [];
  private morphStartTime: number = 0;
  private morphElapsed: number = 0;
  private isMorphingActive: boolean = false;

  constructor(config: Partial<MorphConfig> = {}) {
    this.config = { ...DEFAULT_MORPH_CONFIG, ...config };
  }

  /**
   * 设置粒子数组
   */
  setParticles(particles: MorphParticle[]): void {
    this.particles = particles;
  }

  /**
   * 获取粒子数组
   */
  getParticles(): MorphParticle[] {
    return this.particles;
  }

  /**
   * 设置目标形状点
   */
  setTargetPoints(points: Vector3[]): void {
    this.targetPoints = points;
  }

  /**
   * 开始变形
   * 将当前粒子位置作为起点，变形到目标形状
   * 
   * @param targetPoints 目标形状的点集
   * @param config 可选的变形配置覆盖
   */
  startMorph(targetPoints: Vector3[], config?: Partial<MorphConfig>): void {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.targetPoints = targetPoints;
    this.morphStartTime = Date.now();
    this.morphElapsed = 0;
    this.isMorphingActive = true;

    // 匹配粒子到目标点
    this.matchParticlesToTargets();

    // 记录每个粒子的起始位置
    for (const particle of this.particles) {
      particle.originPosition = new Vector3(
        particle.position.x,
        particle.position.y,
        particle.position.z
      );
      particle.morphProgress = 0;
      particle.isMorphing = true;
    }

    console.log(`[MorphingEngine] Started morph: ${this.particles.length} particles → ${targetPoints.length} targets`);
  }

  /**
   * 粒子到目标点的最优匹配
   */
  private matchParticlesToTargets(): void {
    const numParticles = this.particles.length;
    const numTargets = this.targetPoints.length;

    if (numParticles === 0) return;

    // 如果粒子数多于目标数，优先保留中心区域的粒子，丢弃边缘粒子
    if (numParticles > numTargets) {
      this.handleDecreasingParticles();
    } else {
      // 粒子数增加或相等：贪心匹配或直接索引匹配
      if (numParticles <= 2000) {
        this.greedyMatch();
      } else {
        this.directMatch();
      }
    }
  }

  /**
   * 处理粒子数量减少的情况：优先保留质心附近的粒子
   */
  private handleDecreasingParticles(): void {
    const numParticles = this.particles.length;
    const numTargets = this.targetPoints.length;

    // 1. 计算所有粒子的质心
    let cx = 0, cy = 0, cz = 0;
    for (const p of this.particles) {
      cx += p.position.x;
      cy += p.position.y;
      cz += p.position.z;
    }
    cx /= numParticles;
    cy /= numParticles;
    cz /= numParticles;

    // 2. 计算每个粒子到质心的距离，保留最近的 numTargets 个
    const distIndices = this.particles.map((p, i) => {
      const dx = p.position.x - cx;
      const dy = p.position.y - cy;
      const dz = p.position.z - cz;
      return { index: i, distSq: dx * dx + dy * dy + dz * dz };
    });

    distIndices.sort((a, b) => a.distSq - b.distSq);

    const activeIndices = new Set<number>();
    for (let i = 0; i < numTargets; i++) {
      activeIndices.add(distIndices[i].index);
    }

    // 3. 标记 Excess
    for (let i = 0; i < numParticles; i++) {
      this.particles[i].isExcess = !activeIndices.has(i);
    }

    // 4. 对 Active 粒子进行 Greedy 匹配
    this.greedyMatch(true);
  }

  /**
   * 贪心匹配算法
   * @param onlyActive 是否只匹配非多余粒子
   */
  private greedyMatch(onlyActive: boolean = false): void {
    const numParticles = this.particles.length;
    const numTargets = this.targetPoints.length;
    const usedTargets = new Set<number>();

    // 候选列表
    const candidates: number[] = [];
    for (let i = 0; i < numParticles; i++) {
      if (!onlyActive || !this.particles[i].isExcess) {
        candidates.push(i);
      }
    }

    // 性能兜底：大数据量下直接分配
    if (candidates.length * numTargets > 1000000) {
      this.directMatch(onlyActive);
      return;
    }

    // 计算距离列表
    const distList: { pIdx: number, tIdx: number, dSq: number }[] = [];
    for (const pIdx of candidates) {
      const p = this.particles[pIdx].position;
      for (let tIdx = 0; tIdx < numTargets; tIdx++) {
        const t = this.targetPoints[tIdx];
        const dSq = (p.x - t.x) ** 2 + (p.y - t.y) ** 2 + (p.z - t.z) ** 2;
        distList.push({ pIdx, tIdx, dSq });
      }
    }

    distList.sort((a, b) => a.dSq - b.dSq);

    const assigned = new Set<number>();
    for (const item of distList) {
      if (assigned.has(item.pIdx) || usedTargets.has(item.tIdx)) continue;
      
      const t = this.targetPoints[item.tIdx];
      this.particles[item.pIdx].targetPosition = new Vector3(t.x, t.y, t.z);
      this.particles[item.pIdx].isExcess = false;
      
      assigned.add(item.pIdx);
      usedTargets.add(item.tIdx);
      
      if (assigned.size >= candidates.length || usedTargets.size >= numTargets) break;
    }

    // 兜底补全
    for (const pIdx of candidates) {
      if (!assigned.has(pIdx)) {
        this.particles[pIdx].isExcess = true;
      }
    }
  }

  /**
   * 直接索引匹配 (高性能但视觉效果可能一般)
   */
  private directMatch(onlyActive: boolean = false): void {
    const numTargets = this.targetPoints.length;
    let targetIdx = 0;
    
    for (let i = 0; i < this.particles.length; i++) {
        if (onlyActive && this.particles[i].isExcess) continue;
        
        if (targetIdx < numTargets) {
            const t = this.targetPoints[targetIdx++];
            this.particles[i].targetPosition = new Vector3(t.x, t.y, t.z);
            this.particles[i].isExcess = false;
        } else {
            this.particles[i].isExcess = true;
        }
    }
  }

  /**
   * 更新变形动画
   */
  update(deltaTime: number): void {
    if (!this.isMorphingActive) return;

    this.morphElapsed += deltaTime;
    const progress = Math.min(1, this.morphElapsed / this.config.duration);

    for (const particle of this.particles) {
      if (!particle.isMorphing) continue;

      if (particle.isExcess) {
          this.updateExcessParticle(particle, deltaTime);
      } else {
          this.updateParticle(particle, deltaTime, progress);
      }
    }

    // 检查是否所有粒子都到达目标或时间耗尽
    if (progress >= 1) {
      this.completeMorph();
    }
  }

  private updateParticle(particle: MorphParticle, deltaTime: number, globalProgress: number): void {
    switch (this.config.mode) {
      case 'smooth':
        this.updateSmooth(particle, globalProgress);
        break;
      case 'snap':
        this.updateSnap(particle, globalProgress);
        break;
      case 'physics':
      default:
        this.updatePhysics(particle, deltaTime);
        break;
    }
  }

  private updateExcessParticle(particle: MorphParticle, deltaTime: number): void {
      // 多余粒子：向外随机漂移
      const driftSpeed = 15;
      particle.velocity.x += (Math.random() - 0.5) * driftSpeed * deltaTime;
      particle.velocity.y += (Math.random() - 0.5) * driftSpeed * deltaTime;
      particle.velocity.z += (Math.random() - 0.5) * driftSpeed * deltaTime;
      
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      
      particle.velocity.x *= 0.98;
      particle.velocity.y *= 0.98;
      particle.velocity.z *= 0.98;
      
      particle.morphProgress = 1;
  }

  private updateSmooth(particle: MorphParticle, progress: number): void {
    const easedProgress = evaluateCurve(this.config.easingCurve, progress);
    particle.position.x = this.lerp(particle.originPosition.x, particle.targetPosition.x, easedProgress);
    particle.position.y = this.lerp(particle.originPosition.y, particle.targetPosition.y, easedProgress);
    particle.position.z = this.lerp(particle.originPosition.z, particle.targetPosition.z, easedProgress);
    particle.morphProgress = progress;
  }

  private updateSnap(particle: MorphParticle, progress: number): void {
    if (progress >= 0.5) {
      particle.position.x = particle.targetPosition.x;
      particle.position.y = particle.targetPosition.y;
      particle.position.z = particle.targetPosition.z;
    }
    particle.morphProgress = 1;
  }

  private updatePhysics(particle: MorphParticle, deltaTime: number): void {
    const target = particle.targetPosition;
    const pos = particle.position;
    const vel = particle.velocity;

    const dx = target.x - pos.x;
    const dy = target.y - pos.y;
    const dz = target.z - pos.z;
    const distSq = dx * dx + dy * dy + dz * dz;

    if (distSq < this.config.arrivalThreshold) {
      particle.position.x = target.x;
      particle.position.y = target.y;
      particle.position.z = target.z;
      particle.velocity.x *= 0.1;
      particle.velocity.y *= 0.1;
      particle.velocity.z *= 0.1;
      particle.morphProgress = 1;
      return;
    }

    const dist = Math.sqrt(distSq);
    const forceMagnitude = this.config.attractionStrength;
    
    vel.x += (dx / dist) * forceMagnitude * deltaTime;
    vel.y += (dy / dist) * forceMagnitude * deltaTime;
    vel.z += (dz / dist) * forceMagnitude * deltaTime;

    vel.x *= this.config.damping;
    vel.y *= this.config.damping;
    vel.z *= this.config.damping;

    const speed = Math.sqrt(vel.x * vel.x + vel.y * vel.y + vel.z * vel.z);
    if (speed > this.config.maxSpeed) {
      const scale = this.config.maxSpeed / speed;
      vel.x *= scale; vel.y *= scale; vel.z *= scale;
    }

    pos.x += vel.x * deltaTime;
    pos.y += vel.y * deltaTime;
    pos.z += vel.z * deltaTime;

    const initialDist = Math.sqrt(
      (target.x - particle.originPosition.x) ** 2 +
      (target.y - particle.originPosition.y) ** 2 +
      (target.z - particle.originPosition.z) ** 2
    );
    particle.morphProgress = initialDist > 0 ? 1 - (dist / initialDist) : 1;
  }

  private completeMorph(): void {
    this.isMorphingActive = false;
    for (const particle of this.particles) {
      particle.isMorphing = false;
      particle.morphProgress = 1;
    }
    console.log('[MorphingEngine] Morph completed');
  }

  stopMorph(): void {
    this.isMorphingActive = false;
    for (const particle of this.particles) {
      particle.isMorphing = false;
    }
  }

  isAnimating(): boolean { return this.isMorphingActive; }
  reset(): void {
    this.particles = [];
    this.targetPoints = [];
    this.isMorphingActive = false;
  }
  private lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
}

export const globalMorphingEngine = new MorphingEngine();
