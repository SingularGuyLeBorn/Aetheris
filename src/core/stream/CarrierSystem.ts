/**
 * CarrierSystem.ts - 运载系统
 * 
 * 负责管理烟花从发射到到达目标位置的"运载"阶段
 * 
 * 功能：
 * - 3D贝塞尔曲线路径计算
 * - 尾焰粒子发射
 * - 运载体位置更新
 * - 到达检测与事件触发
 */

import { Vector3 } from '../Vector3';
import { 
  CarrierConfig, 
  Path3D, 
  PathType, 
  TrailConfig,
  Curve,
  evaluateCurve 
} from './types';
import { Shape3DGenerator, Shape3DType } from '../shapes/Shape3DFactory';

/**
 * 运载体状态
 */
export interface CarrierState {
  /** 当前位置 */
  position: Vector3;
  /** 当前速度 (方向向量) */
  velocity: Vector3;
  /** 路径进度 (0-1) */
  progress: number;
  /** 已运行时间 */
  elapsed: number;
  /** 是否已到达 */
  arrived: boolean;
  /** 是否活跃 */
  active: boolean;
}

/**
 * 尾焰粒子
 */
export interface TrailParticle {
  position: Vector3;
  velocity: Vector3;
  age: number;
  lifeTime: number;
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  size: number;
  isDead: boolean;
}

/**
 * 运载器实例
 */
export interface CarrierInstance {
  id: string;
  config: CarrierConfig;
  state: CarrierState;
  startPosition: Vector3;
  targetPosition: Vector3;
  trailParticles: TrailParticle[];
  /** 颜色主相 (用于渲染上升图案) */
  hue: number;
  /** 尾焰发射累加器 (修复低 deltaTime 漏发问题) */
  emissionAccumulator: number;
  /** 上升时的形状点集 (相对坐标) */
  shapePoints?: Vector3[];
  onArrive?: () => void;
}

/**
 * 运载系统
 */
export class CarrierSystem {
  private carriers: Map<string, CarrierInstance> = new Map();
  private nextCarrierId: number = 0;
  private maxTrailParticles: number = 1000; // 增加上限

  /**
   * 创建新的运载器
   */
  createCarrier(
    config: CarrierConfig,
    startPosition: Vector3,
    targetPosition: Vector3,
    hue: number = 40,
    onArrive?: () => void
  ): string {
    const id = `carrier_${this.nextCarrierId++}`;
    
    const carrier: CarrierInstance = {
      id,
      config,
      state: {
        position: new Vector3(startPosition.x, startPosition.y, startPosition.z),
        velocity: new Vector3(0, 0, 0),
        progress: 0,
        elapsed: 0,
        arrived: false,
        active: true
      },
      startPosition: new Vector3(startPosition.x, startPosition.y, startPosition.z),
      targetPosition: new Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
      trailParticles: [],
      hue,
      emissionAccumulator: 0,
      onArrive
    };

    // 如果配置了形状，生成精细形状点阵
    if (config.shape) {
      try {
        // 增加点数到 400，缩放增加到 1.5，使其在空中巨大且清晰
        const rawPoints = Shape3DGenerator.generate(config.shape as Shape3DType, 400, 1.5); 
        const shapePoints: Vector3[] = [];
        for (let i = 0; i < rawPoints.length; i += 3) {
          shapePoints.push(new Vector3(rawPoints[i], rawPoints[i+1], rawPoints[i+2]));
        }
        carrier.shapePoints = shapePoints;
      } catch (e) {
        console.warn(`[CarrierSystem] Failed to generate shape for carrier: ${config.shape}`, e);
      }
    }

    this.carriers.set(id, carrier);
    
    console.log(`[CarrierSystem] Created carrier ${id}: ${startPosition.y.toFixed(1)} → ${targetPosition.y.toFixed(1)}`);
    
    return id;
  }

  /**
   * 更新所有运载器
   */
  update(deltaTime: number): void {
    for (const carrier of this.carriers.values()) {
      if (!carrier.state.active) continue;
      
      this.updateCarrier(carrier, deltaTime);
      this.updateTrailParticles(carrier, deltaTime);
    }
  }

  /**
   * 更新单个运载器
   */
  private updateCarrier(carrier: CarrierInstance, deltaTime: number): void {
    const state = carrier.state;
    const config = carrier.config;
    
    // 更新时间和进度
    state.elapsed += deltaTime;
    const rawProgress = state.elapsed / config.duration;
    
    // 应用速度曲线
    state.progress = evaluateCurve(config.path.speedCurve, Math.min(rawProgress, 1));
    
    // 计算新位置
    const prevPosition = new Vector3(state.position.x, state.position.y, state.position.z);
    state.position = this.evaluatePath(carrier, state.progress);
    
    // 计算速度向量 (用于尾焰方向)
    if (deltaTime > 0) {
      state.velocity = new Vector3(
        (state.position.x - prevPosition.x) / deltaTime,
        (state.position.y - prevPosition.y) / deltaTime,
        (state.position.z - prevPosition.z) / deltaTime
      );
    }
    
    // 发射尾焰粒子
    if (config.trail && !state.arrived) {
      this.emitTrailParticles(carrier, deltaTime);
    }
    
    // 检查是否到达
    if (rawProgress >= 1 && !state.arrived) {
      state.arrived = true;
      state.position = carrier.targetPosition;
      
      console.log(`[CarrierSystem] Carrier ${carrier.id} arrived at target`);
      
      if (carrier.onArrive) {
        carrier.onArrive();
      }
    }
  }

  /**
   * 评估路径位置
   */
  private evaluatePath(carrier: CarrierInstance, t: number): Vector3 {
    const path = carrier.config.path;
    const start = carrier.startPosition;
    const end = carrier.targetPosition;
    
    switch (path.type) {
      case 'linear':
        return this.evaluateLinearPath(start, end, t);
      
      case 'bezier_3d':
        return this.evaluateBezierPath(path, start, end, t);
      
      case 'spiral':
        return this.evaluateSpiralPath(path, start, end, t);
      
      case 'helix':
        return this.evaluateHelixPath(path, start, end, t);
      
      case 'arc':
        return this.evaluateArcPath(start, end, t);
      
      default:
        return this.evaluateLinearPath(start, end, t);
    }
  }

  /**
   * 线性路径
   */
  private evaluateLinearPath(start: Vector3, end: Vector3, t: number): Vector3 {
    return new Vector3(
      start.x + (end.x - start.x) * t,
      start.y + (end.y - start.y) * t,
      start.z + (end.z - start.z) * t
    );
  }

  /**
   * 3D贝塞尔曲线路径
   */
  private evaluateBezierPath(path: Path3D, start: Vector3, end: Vector3, t: number): Vector3 {
    const points = path.points || [];
    
    if (points.length === 0) {
      // 自动生成控制点
      const midY = (start.y + end.y) / 2 + 20;
      const cp1 = new Vector3(start.x, midY, start.z);
      const cp2 = new Vector3(end.x, midY + 10, end.z);
      return this.cubicBezier3D(start, cp1, cp2, end, t);
    }
    
    if (points.length === 1) {
      // 二次贝塞尔
      return this.quadraticBezier3D(start, points[0], end, t);
    }
    
    if (points.length >= 2) {
      // 三次贝塞尔
      return this.cubicBezier3D(start, points[0], points[1], end, t);
    }
    
    return this.evaluateLinearPath(start, end, t);
  }

  /**
   * 二次贝塞尔曲线
   */
  private quadraticBezier3D(p0: Vector3, p1: Vector3, p2: Vector3, t: number): Vector3 {
    const u = 1 - t;
    return new Vector3(
      u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
      u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
      u * u * p0.z + 2 * u * t * p1.z + t * t * p2.z
    );
  }

  /**
   * 三次贝塞尔曲线
   */
  private cubicBezier3D(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, t: number): Vector3 {
    const u = 1 - t;
    const u2 = u * u;
    const u3 = u2 * u;
    const t2 = t * t;
    const t3 = t2 * t;
    
    return new Vector3(
      u3 * p0.x + 3 * u2 * t * p1.x + 3 * u * t2 * p2.x + t3 * p3.x,
      u3 * p0.y + 3 * u2 * t * p1.y + 3 * u * t2 * p2.y + t3 * p3.y,
      u3 * p0.z + 3 * u2 * t * p1.z + 3 * u * t2 * p2.z + t3 * p3.z
    );
  }

  /**
   * 螺旋路径 (锥形螺旋)
   */
  private evaluateSpiralPath(path: Path3D, start: Vector3, end: Vector3, t: number): Vector3 {
    const radius = path.spiralRadius || 10; // 默认大一点
    const freq = path.spiralFrequency || 4;
    
    // 基础线性插值
    const baseX = start.x + (end.x - start.x) * t;
    const baseY = start.y + (end.y - start.y) * t;
    const baseZ = start.z + (end.z - start.z) * t;
    
    // 螺旋：半径随进度扩大再缩小 (梭形)
    const currentRadius = Math.sin(t * Math.PI) * radius;
    const angle = t * freq * Math.PI * 2;
    
    return new Vector3(
      baseX + Math.cos(angle) * currentRadius,
      baseY,
      baseZ + Math.sin(angle) * currentRadius
    );
  }

  /**
   * S形路径 (蛇行或DNA)
   */
  private evaluateHelixPath(path: Path3D, start: Vector3, end: Vector3, t: number): Vector3 {
    const radius = path.spiralRadius || 8;
    const freq = path.spiralFrequency || 3;
    
    const baseX = start.x + (end.x - start.x) * t;
    const baseY = start.y + (end.y - start.y) * t;
    const baseZ = start.z + (end.z - start.z) * t;
    
    // 正弦波震荡
    const offset = Math.sin(t * freq * Math.PI * 2) * radius;
    
    // 简单的平面震荡比 3D 螺旋更像 S 形
    return new Vector3(
      baseX + offset,
      baseY,
      baseZ + (Math.cos(t * freq * Math.PI * 2) * radius * 0.3) // 稍微带一点 3D 感
    );
  }

  /**
   * 弧形路径
   */
  private evaluateArcPath(start: Vector3, end: Vector3, t: number): Vector3 {
    const baseX = start.x + (end.x - start.x) * t;
    const baseY = start.y + (end.y - start.y) * t;
    const baseZ = start.z + (end.z - start.z) * t;
    
    // 添加抛物线弧度
    const arcHeight = 30;
    const arc = Math.sin(t * Math.PI) * arcHeight;
    
    return new Vector3(baseX, baseY + arc, baseZ);
  }

  /**
   * 发射尾焰粒子
   */
  private emitTrailParticles(carrier: CarrierInstance, deltaTime: number): void {
    const trail = carrier.config.trail!;
    
    // 使用累加器处理非整数发射
    carrier.emissionAccumulator += trail.emissionRate * deltaTime;
    const emitCount = Math.floor(carrier.emissionAccumulator);
    carrier.emissionAccumulator -= emitCount;
    
    if (emitCount <= 0) return;

    const state = carrier.state;
    // 限制最大尾焰粒子数
    const currentCount = carrier.trailParticles.filter(p => !p.isDead).length;
    if (currentCount >= this.maxTrailParticles) return;
    
    for (let i = 0; i < emitCount; i++) {
      // 这里的逻辑保持不变，但发射次数更精准
      const offsetX = (Math.random() - 0.5) * 0.8;
      const offsetY = (Math.random() - 0.5) * 0.8;
      const offsetZ = (Math.random() - 0.5) * 0.8;
      
      const speedScale = 0.4; 
      const spread = 8;
      
      const particle: TrailParticle = {
        position: new Vector3(
          state.position.x + offsetX,
          state.position.y + offsetY,
          state.position.z + offsetZ
        ),
        velocity: new Vector3(
          -state.velocity.x * speedScale + (Math.random() - 0.5) * spread,
          -state.velocity.y * speedScale - 5 - Math.random() * 15, // 向上喷射感的反方向，带重力感
          -state.velocity.z * speedScale + (Math.random() - 0.5) * spread
        ),
        age: 0,
        lifeTime: trail.lifeTime * (0.8 + Math.random() * 0.6),
        hue: 35 + Math.random() * 25, 
        saturation: 1,
        lightness: 0.7 + Math.random() * 0.3, // 稍微亮一点
        alpha: 1,
        size: trail.size * (0.8 + Math.random() * 1.2), // 稍微大一点
        isDead: false
      };
      
      carrier.trailParticles.push(particle);
    }
  }

  /**
   * 更新尾焰粒子
   */
  private updateTrailParticles(carrier: CarrierInstance, deltaTime: number): void {
    const gravity = -30;
    const drag = 0.98;
    
    for (const particle of carrier.trailParticles) {
      if (particle.isDead) continue;
      
      // 更新年龄
      particle.age += deltaTime;
      
      // 应用物理
      particle.velocity.y += gravity * deltaTime;
      particle.velocity.x *= drag;
      particle.velocity.y *= drag;
      particle.velocity.z *= drag;
      
      particle.position.x += particle.velocity.x * deltaTime;
      particle.position.y += particle.velocity.y * deltaTime;
      particle.position.z += particle.velocity.z * deltaTime;
      
      // 更新透明度和颜色
      const lifeProgress = particle.age / particle.lifeTime;
      particle.alpha = Math.max(0, 1 - lifeProgress);
      particle.lightness = 0.6 - lifeProgress * 0.4;
      
      // 检查死亡
      if (particle.age > particle.lifeTime || particle.alpha <= 0) {
        particle.isDead = true;
      }
    }
    
    // 清理死亡粒子 (每秒清理一次以减少GC压力)
    if (Math.random() < deltaTime) {
      carrier.trailParticles = carrier.trailParticles.filter(p => !p.isDead);
    }
  }

  /**
   * 获取运载器状态
   */
  getCarrier(id: string): CarrierInstance | undefined {
    return this.carriers.get(id);
  }

  /**
   * 获取所有活跃运载器
   */
  getActiveCarriers(): CarrierInstance[] {
    return Array.from(this.carriers.values()).filter(c => c.state.active);
  }

  /**
   * 获取所有尾焰粒子 (用于渲染)
   */
  getAllTrailParticles(): TrailParticle[] {
    const allParticles: TrailParticle[] = [];
    for (const carrier of this.carriers.values()) {
      if (carrier.state.active) {
        allParticles.push(...carrier.trailParticles.filter(p => !p.isDead));
      }
    }
    return allParticles;
  }

  /**
   * 移除运载器
   */
  removeCarrier(id: string): void {
    this.carriers.delete(id);
  }

  /**
   * 清理已完成的运载器
   */
  cleanupArrived(): void {
    for (const [id, carrier] of this.carriers.entries()) {
      if (carrier.state.arrived) {
        // 检查尾焰粒子是否都消失了
        const activeTrail = carrier.trailParticles.filter(p => !p.isDead).length;
        if (activeTrail === 0) {
          this.carriers.delete(id);
        }
      }
    }
  }

  /**
   * 重置系统
   */
  reset(): void {
    this.carriers.clear();
    this.nextCarrierId = 0;
  }

  /**
   * 获取统计信息
   */
  getStats(): { carriers: number; trailParticles: number } {
    let trailParticles = 0;
    for (const carrier of this.carriers.values()) {
      trailParticles += carrier.trailParticles.filter(p => !p.isDead).length;
    }
    return {
      carriers: this.carriers.size,
      trailParticles
    };
  }
}

// 导出全局实例
export const globalCarrierSystem = new CarrierSystem();

// END OF FILE: src/core/stream/CarrierSystem.ts
