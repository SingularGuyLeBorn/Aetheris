/**
 * ParticleStream.ts - 粒子流管理器
 * 
 * 核心概念：粒子流是一个时间轴上的粒子集合
 * 
 * 职责：
 * - 管理粒子生命周期
 * - 处理阶段过渡 (State Mutations)
 * - 协调物理引擎和变形引擎
 * - 实现粒子重用 (不销毁再生成，而是流动)
 */

import * as THREE from 'three';
import { Vector3 } from '../Vector3';
import { 
  PayloadStage, 
  TopologyConfig, 
  DynamicsConfig, 
  RenderingConfig,
  ForceField,
  evaluateCurve,
  evaluateGradient,
  Gradient,
  Curve,
  PRESET_CURVES
} from './types';
import { ForceFieldSystem } from './ForceFieldSystem';
import { MorphingEngine, MorphParticle, MorphConfig } from './MorphingEngine';
import { Shape3DGenerator, Shape3DType } from '../shapes/Shape3DFactory';

/**
 * 流粒子 - 扩展的粒子数据结构
 */
export interface StreamParticle {
  // === 基础物理属性 ===
  id: number;
  position: Vector3;
  velocity: Vector3;
  acceleration: Vector3;
  mass: number;
  
  // === 渲染属性 ===
  hue: number;
  saturation: number;
  lightness: number;
  alpha: number;
  size: number;
  temperature: number;  // 用于黑体辐射着色
  
  // === 生命周期 ===
  age: number;          // 已存活时间
  lifeTime: number;     // 总生命时间
  stageAge: number;     // 当前阶段已存活时间
  isDead: boolean;
  
  // === 变形属性 ===
  targetPosition: Vector3;
  originPosition: Vector3;
  morphProgress: number;
  isMorphing: boolean;
  
  // === 自定义属性 ===
  userData: Record<string, any>;
}

/**
 * 粒子流状态
 */
export enum StreamState {
  IDLE = 'idle',
  SPAWNING = 'spawning',
  ACTIVE = 'active',
  MORPHING = 'morphing',
  FADING = 'fading',
  EXTINCT = 'extinct'
}

/**
 * 粒子流配置
 */
export interface StreamConfig {
  /** 最大粒子数 */
  maxParticles: number;
  /** 初始粒子数 */
  initialParticles: number;
  /** 基础生命周期 (秒) */
  baseLifeTime: number;
  /** 生命周期变化范围 */
  lifeTimeVariance: number;
  /** 是否使用对象池 */
  usePool: boolean;
}

const DEFAULT_STREAM_CONFIG: StreamConfig = {
  maxParticles: 5000,
  initialParticles: 0,
  baseLifeTime: 5,
  lifeTimeVariance: 1,
  usePool: true
};

/**
 * 粒子流管理器
 */
export class ParticleStream {
  private config: StreamConfig;
  private particles: StreamParticle[] = [];
  private particlePool: StreamParticle[] = []; // 对象池
  private state: StreamState = StreamState.IDLE;
  
  private forceFieldSystem: ForceFieldSystem;
  private morphingEngine: MorphingEngine;
  
  private currentStage: PayloadStage | null = null;
  private stageIndex: number = 0;
  private stageElapsed: number = 0;
  private totalElapsed: number = 0;
  
  private nextParticleId: number = 0;
  private spawnCenter: Vector3 = new Vector3(0, 0, 0);
  
  // 过渡状态
  private currentRendering: RenderingConfig | null = null;
  private targetRendering: RenderingConfig | null = null;
  private transitionDuration: number = 1.0;
  private bloomFactor: number = 0; // 0 -> 1 的扩张因子
  private bloomDuration: number = 1.2; // 爆发到完全展开的时间
  
  // ★ 关键标记：是否是初始爆发阶段（只有初始阶段才会执行绽放动画）
  private isInitialStage: boolean = true;
  private sizeGrowthCompleted: boolean = false; // 大小生长是否已完成
  
  // 事件回调
  private onStageChangeCallbacks: Array<(stageIndex: number) => void> = [];
  private onParticleDeathCallbacks: Array<(particle: StreamParticle) => void> = [];

  constructor(config: Partial<StreamConfig> = {}) {
    this.config = { ...DEFAULT_STREAM_CONFIG, ...config };
    this.forceFieldSystem = new ForceFieldSystem();
    this.morphingEngine = new MorphingEngine();
    
    // 预分配粒子池
    if (this.config.usePool) {
      this.preallocatePool();
    }
  }

  /**
   * 预分配粒子对象池
   */
  private preallocatePool(): void {
    for (let i = 0; i < Math.min(this.config.maxParticles, 1000); i++) {
      this.particlePool.push(this.createEmptyParticle());
    }
  }

  /**
   * 创建空粒子
   */
  private createEmptyParticle(): StreamParticle {
    return {
      id: 0,
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      acceleration: new Vector3(0, 0, 0),
      mass: 1,
      hue: 0,
      saturation: 1,
      lightness: 0.5,
      alpha: 1,
      size: 1,
      temperature: 6000,
      age: 0,
      lifeTime: 5,
      stageAge: 0,
      isDead: true,
      targetPosition: new Vector3(0, 0, 0),
      originPosition: new Vector3(0, 0, 0),
      morphProgress: 0,
      isMorphing: false,
      userData: {}
    };
  }

  /**
   * 从池中获取或创建粒子
   */
  private acquireParticle(): StreamParticle {
    let particle: StreamParticle;
    
    if (this.config.usePool && this.particlePool.length > 0) {
      particle = this.particlePool.pop()!;
    } else {
      particle = this.createEmptyParticle();
    }
    
    particle.id = this.nextParticleId++;
    particle.isDead = false;
    return particle;
  }

  /**
   * 释放粒子回池
   */
  private releaseParticle(particle: StreamParticle): void {
    if (this.config.usePool && this.particlePool.length < this.config.maxParticles) {
      particle.isDead = true;
      this.particlePool.push(particle);
    }
  }

  /**
   * 设置生成中心点
   */
  setSpawnCenter(center: Vector3): void {
    this.spawnCenter = center;
  }

  /**
   * 在指定位置生成一批粒子
   * 根据拓扑配置生成目标点，根据动力学配置设置初始速度
   * 
   * 关键修复：增加 'structure_preserve' 模式，粒子直接出现在形状位置
   */
  spawn(
    count: number,
    topology: TopologyConfig,
    dynamics: DynamicsConfig,
    rendering: RenderingConfig
  ): void {
    this.state = StreamState.SPAWNING;
    
    // --- 自动注入形状颜色 (Auto-inject Color based on Shape) ---
    // 确保不同形状有独特的颜色，满足用户"一眼看出区别"的需求
    if (Object.values(Shape3DType).includes(topology.source as Shape3DType)) {
        const hex = Shape3DGenerator.getShapeColor(topology.source as Shape3DType);
        const color = new THREE.Color(hex);
        const hsl = { h: 0, s: 0, l: 0 };
        color.getHSL(hsl);
        
        // 覆盖渲染配置的颜色映射
        rendering = {
            ...rendering,
            colorMap: {
                stops: [
                    { position: 0, hue: hsl.h * 360, saturation: hsl.s, lightness: Math.min(1, hsl.l * 1.3), alpha: 1 },
                    { position: 0.5, hue: hsl.h * 360, saturation: hsl.s, lightness: hsl.l, alpha: 1 },
                    { position: 1, hue: hsl.h * 360, saturation: hsl.s, lightness: Math.max(0, hsl.l * 0.7), alpha: 1 }
                ]
            }
        };
    }
    // -----------------------------------------------------
    
    // 生成目标点分布
    const targetPoints = this.generateTargetPoints(topology);
    
    // 根据粒子数和目标点数决定生成策略
    const actualCount = Math.min(count, this.config.maxParticles - this.particles.length);
    
    // 检查是否使用结构保持模式
    const isStructurePreserve = dynamics.initialVelocity.mode === 'structure_preserve';
    
    for (let i = 0; i < actualCount; i++) {
      const particle = this.acquireParticle();
      const targetPoint = targetPoints[i % targetPoints.length];
      
      // 关键修复：结构保持模式下，粒子直接出现在目标位置！
      if (isStructurePreserve) {
        // 粒子直接出现在形状位置
        particle.position = new Vector3(
          targetPoint.x + this.spawnCenter.x,
          targetPoint.y + this.spawnCenter.y,
          targetPoint.z + this.spawnCenter.z
        );
        // 只有非常微小的随机扰动
        const jitter = 0.5;
        particle.velocity = new Vector3(
          (Math.random() - 0.5) * jitter,
          (Math.random() - 0.5) * jitter,
          (Math.random() - 0.5) * jitter
        );
      } else {
        // 传统模式：粒子从中心生成，飞向目标
        particle.position = new Vector3(
          this.spawnCenter.x,
          this.spawnCenter.y,
          this.spawnCenter.z
        );
        // 设置初始速度
        this.setInitialVelocity(particle, dynamics, targetPoint);
      }
      
      // 设置目标位置
      particle.targetPosition = new Vector3(
        targetPoint.x + this.spawnCenter.x,
        targetPoint.y + this.spawnCenter.y,
        targetPoint.z + this.spawnCenter.z
      );
      
      // 设置渲染属性
      this.setRenderingProperties(particle, rendering, i / actualCount);
      
      // 生命周期
      particle.age = 0;
      particle.stageAge = 0;
      particle.lifeTime = this.config.baseLifeTime + 
        (Math.random() - 0.5) * 2 * this.config.lifeTimeVariance;
      
      this.particles.push(particle);
    }
    
    // 设置力场
    this.forceFieldSystem.setForceFields(dynamics.forceFields);
    
    // ★ 初始化扩张和渲染过渡 - 只有初始阶段才执行绽放动画
    this.isInitialStage = true;
    this.sizeGrowthCompleted = false;
    this.bloomFactor = (rendering.enableBloom === false) ? 1 : 0;
    this.bloomDuration = rendering.bloomDuration ?? 1.2;
    this.targetRendering = rendering;
    if (!this.currentRendering) this.currentRendering = rendering;
    
    this.state = StreamState.ACTIVE;
    console.log(`[ParticleStream] Spawned ${actualCount} particles (mode: ${dynamics.initialVelocity.mode}), total: ${this.particles.length}`);
  }


  /**
   * 生成目标点分布
   */
  private generateTargetPoints(topology: TopologyConfig): Vector3[] {
    const type = topology.source as Shape3DType;
    const positions = Shape3DGenerator.generate(
      type,
      topology.resolution,
      topology.scale
    );
    
    // Float32Array 每 3 个值是一个点的 x, y, z
    const result: Vector3[] = [];
    for (let i = 0; i < positions.length; i += 3) {
      let x = positions[i];
      let y = positions[i + 1];
      let z = positions[i + 2];
      
      // 应用偏移
      if (topology.offset) {
        x += topology.offset.x;
        y += topology.offset.y;
        z += topology.offset.z;
      }
      
      result.push(new Vector3(x, y, z));
    }
    
    console.log(`[ParticleStream] Generated ${result.length} target points for shape: ${type}`);
    return result;
  }

  /**
   * 设置粒子初始速度
   */
  private setInitialVelocity(
    particle: StreamParticle,
    dynamics: DynamicsConfig,
    targetOffset: Vector3
  ): void {
    const vel = dynamics.initialVelocity;
    let speed: number;
    
    if (Array.isArray(vel.speed)) {
      // 范围速度
      speed = vel.speed[0] + Math.random() * (vel.speed[1] - vel.speed[0]);
    } else {
      speed = vel.speed;
    }
    
    switch (vel.mode) {
      case 'radial':
        // 径向爆炸
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        particle.velocity = new Vector3(
          Math.sin(phi) * Math.cos(theta) * speed,
          Math.sin(phi) * Math.sin(theta) * speed,
          Math.cos(phi) * speed
        );
        break;
      
      case 'directional':
        // 方向速度
        const dir = vel.direction || new Vector3(0, 1, 0);
        const len = Math.sqrt(dir.x ** 2 + dir.y ** 2 + dir.z ** 2);
        particle.velocity = new Vector3(
          (dir.x / len) * speed,
          (dir.y / len) * speed,
          (dir.z / len) * speed
        );
        break;
      
      case 'random':
        // 随机方向
        particle.velocity = new Vector3(
          (Math.random() - 0.5) * speed * 2,
          (Math.random() - 0.5) * speed * 2,
          (Math.random() - 0.5) * speed * 2
        );
        break;
      
      case 'target_seeking':
        // 指向目标的初始速度
        const dx = targetOffset.x;
        const dy = targetOffset.y;
        const dz = targetOffset.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist > 0) {
          particle.velocity = new Vector3(
            (dx / dist) * speed,
            (dy / dist) * speed,
            (dz / dist) * speed
          );
        }
        break;
    }
  }

  /**
   * 设置粒子渲染属性
   */
  private setRenderingProperties(
    particle: StreamParticle,
    rendering: RenderingConfig,
    normalizedIndex: number
  ): void {
    // 从颜色渐变获取颜色
    const color = evaluateGradient(rendering.colorMap, normalizedIndex);
    particle.hue = color.h;
    particle.saturation = color.s;
    particle.lightness = color.l;
    particle.alpha = color.a;
    
    // 大小
    particle.size = rendering.baseSize;
    
    // 温度 (用于黑体辐射)
    if (rendering.useBlackbodyRadiation) {
      particle.temperature = rendering.initialTemperature || 6000;
    }
  }

  /**
   * 开始形态变形
   */
  startMorph(
    targetTopology: TopologyConfig,
    targetRendering?: RenderingConfig,
    config?: Partial<MorphConfig>
  ): void {
    this.state = StreamState.MORPHING;
    this.stageElapsed = 0; 
    // ★ 关键修复：变形阶段不重新执行绽放动画！直接设置为完成状态
    this.bloomFactor = 1; // 已经绽放完成，不需要重新扩张
    this.isInitialStage = false; // 不再是初始阶段
    this.resetStageAge(); 
    
    // 生成新的目标点
    const targetPoints = this.generateTargetPoints(targetTopology);
    
    // 将粒子添加偏移到绝对位置
    const absoluteTargets = targetPoints.map(p => new Vector3(
      p.x + this.spawnCenter.x,
      p.y + this.spawnCenter.y,
      p.z + this.spawnCenter.z
    ));
    
    // 转换为变形引擎需要的格式
    const morphParticles: MorphParticle[] = this.particles.map(p => ({
      position: p.position,
      velocity: p.velocity,
      targetPosition: p.targetPosition,
      originPosition: new Vector3(p.position.x, p.position.y, p.position.z),
      morphProgress: 0,
      isMorphing: true,
      id: p.id
    }));
    
    this.morphingEngine.setParticles(morphParticles);
    this.morphingEngine.startMorph(absoluteTargets, config);
    
    // 进度和颜色过渡初始化
    if (targetRendering) {
      this.currentRendering = this.targetRendering || this.currentRendering;
      this.targetRendering = targetRendering;
    }
    
    console.log(`[ParticleStream] Started morphing to ${targetTopology.source}`);
  }

  /**
   * 开始消亡阶段
   * @param config 消亡配置 - 允许用户自定义而非硬编码
   */
  startExtinction(config?: {
    useGravity?: boolean;
    gravityStrength?: number;
    windStrength?: number;
    fadeMode?: 'fall' | 'float' | 'dissolve' | 'explode' | 'implode';
  }): void {
    this.state = StreamState.FADING;
    
    // 关闭变形吸引力
    this.morphingEngine.stopMorph();
    
    // 更新力场 - 根据配置而非硬编码!
    this.forceFieldSystem.clearForces();
    
    const useGravity = config?.useGravity ?? true;
    const gravityStrength = config?.gravityStrength ?? 15;
    const windStrength = config?.windStrength ?? 3;
    const fadeMode = config?.fadeMode ?? 'fall';
    
    switch (fadeMode) {
      case 'fall':
        // 正常坠落
        if (useGravity && gravityStrength > 0) {
          this.forceFieldSystem.addForceField({
            type: 'gravity',
            strength: gravityStrength,
            direction: new Vector3(0, -1, 0)
          });
        }
        this.forceFieldSystem.addForceField({
          type: 'drag',
          strength: 0.02
        });
        if (windStrength > 0) {
          this.forceFieldSystem.addForceField({
            type: 'wind',
            strength: windStrength,
            direction: new Vector3(1, 0, 0.5)
          });
        }
        break;
      
      case 'float':
        // 漂浮消失 - 无重力，只有轻微扰动
        this.forceFieldSystem.addForceField({
          type: 'drag',
          strength: 0.1
        });
        this.forceFieldSystem.addForceField({
          type: 'turbulence',
          strength: 2,
          noiseFrequency: 0.5,
          noiseAmplitude: 1
        });
        break;
      
      case 'dissolve':
        // 溶解消失 - 原地消失
        this.forceFieldSystem.addForceField({
          type: 'drag',
          strength: 0.5 // 高阻力让粒子几乎静止
        });
        break;
      
      case 'explode':
        // 二次爆炸消失
        for (const p of this.particles) {
          const speed = 20 + Math.random() * 30;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          p.velocity = new Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed,
            Math.cos(phi) * speed
          );
        }
        this.forceFieldSystem.addForceField({
          type: 'drag',
          strength: 0.05
        });
        break;
      
      case 'implode':
        // 向中心收缩消失
        this.forceFieldSystem.addForceField({
          type: 'attraction',
          strength: 30,
          center: this.spawnCenter,
          radius: 200
        });
        break;
    }
    
    console.log(`[ParticleStream] Started extinction phase (mode: ${fadeMode})`);
  }

  /**
   * 更新粒子流
   */
  update(deltaTime: number): void {
    if (this.state === StreamState.IDLE || this.state === StreamState.EXTINCT) {
      return;
    }
    
    this.totalElapsed += deltaTime;
    this.stageElapsed += deltaTime;
    this.forceFieldSystem.updateTime(deltaTime);
    
    // 更新扩张因子 (Bloom Process)
    if (this.bloomFactor < 1) {
      this.bloomFactor = Math.min(1, this.bloomFactor + deltaTime / this.bloomDuration);
    }
    
    // 更新渲染过渡 (Color Transition)
    if (this.targetRendering && this.currentRendering !== this.targetRendering) {
      // 颜色过渡逻辑在 updateRenderingProperties 中逐粒子处理
    }
    
    // 更新变形引擎
    if (this.state === StreamState.MORPHING && this.morphingEngine.isAnimating()) {
      this.morphingEngine.update(deltaTime);
      
      // 同步变形引擎的粒子位置到主粒子数组
      const morphParticles = this.morphingEngine.getParticles();
      for (let i = 0; i < morphParticles.length && i < this.particles.length; i++) {
        const mp = morphParticles[i];
        const p = this.particles[i];
        p.position = mp.position;
        p.velocity = mp.velocity;
        p.morphProgress = mp.morphProgress;
        p.isMorphing = mp.isMorphing;
      }
      
      // 变形完成后切换状态
      if (!this.morphingEngine.isAnimating()) {
        this.state = StreamState.ACTIVE;
      }
    }
    
    // 更新每个粒子
    const deadIndices: number[] = [];
    
    for (let i = 0; i < this.particles.length; i++) {
      const particle = this.particles[i];
      
      if (particle.isDead) {
        deadIndices.push(i);
        continue;
      }
      
      // 更新年龄
      particle.age += deltaTime;
      particle.stageAge += deltaTime;
      
      // 物理更新 (除非在变形模式)
      if (this.state !== StreamState.MORPHING || !particle.isMorphing) {
        this.updatePhysics(particle, deltaTime);
      }
      
      // 渲染属性更新
      this.updateRenderingProperties(particle, deltaTime);
      
      // 检查死亡条件
      if (this.shouldParticleDie(particle)) {
        particle.isDead = true;
        deadIndices.push(i);
        this.onParticleDeathCallbacks.forEach(cb => cb(particle));
      }
    }
    
    // 清理死亡粒子
    this.removeDead(deadIndices);
    
    // 检查是否全部消亡
    if (this.state === StreamState.FADING && this.particles.length === 0) {
      this.state = StreamState.EXTINCT;
      console.log('[ParticleStream] All particles extinct');
    }
  }

  /**
   * 更新粒子物理
   */
  private updatePhysics(particle: StreamParticle, deltaTime: number): void {
    // 计算加速度
    const accel = this.forceFieldSystem.calculateAcceleration(
      particle.position,
      particle.velocity,
      particle.mass
    );
    
    particle.acceleration = accel;
    
    // === 核心改进：绽放过渡动画 (Bloom Transition Animation) ===
    // 逻辑：粒子的物理目标位置随 bloomFactor 从中心向外扩散，产生“炸开并绽放”的视觉效果
    if (this.isInitialStage && this.bloomFactor < 1 && particle.targetPosition) {
        // 计算从中心到目标的向量
        const dx = particle.targetPosition.x - this.spawnCenter.x;
        const dy = particle.targetPosition.y - this.spawnCenter.y;
        const dz = particle.targetPosition.z - this.spawnCenter.z;
        
        // 动态计算当前这一帧，由于“绽放”导致的虚拟目标位置
        // 使用 easeOut 效果让绽放开始快，结束平滑
        const t = this.bloomFactor;
        const easeT = 1 - Math.pow(1 - t, 3); 
        
        const currentTargetPos = new Vector3(
            this.spawnCenter.x + dx * easeT,
            this.spawnCenter.y + dy * easeT,
            this.spawnCenter.z + dz * easeT
        );
        
        // 施加一个引导力，将粒子轻柔地推向这个动态目标
        // 这个力与 bloomFactor 相关，初期大，后期小，确保护航完整性
        const weight = (1 - easeT) * 5.0; // 引导权重
        particle.velocity.x += (currentTargetPos.x - particle.position.x) * weight * deltaTime;
        particle.velocity.y += (currentTargetPos.y - particle.position.y) * weight * deltaTime;
        particle.velocity.z += (currentTargetPos.z - particle.position.z) * weight * deltaTime;
    }

    // Verlet 积分
    particle.velocity.x += accel.x * deltaTime;
    particle.velocity.y += accel.y * deltaTime;
    particle.velocity.z += accel.z * deltaTime;
    
    particle.position.x += particle.velocity.x * deltaTime;
    particle.position.y += particle.velocity.y * deltaTime;
    particle.position.z += particle.velocity.z * deltaTime;
  }

  /**
   * 更新粒子渲染属性
   */
  private updateRenderingProperties(particle: StreamParticle, deltaTime: number): void {
    const lifeProgress = particle.age / particle.lifeTime;
    const stageProgress = Math.min(1, particle.stageAge / 1.5); // 1.5s 核心过渡期
    
    // 循序渐进的颜色过渡
    if (this.targetRendering && this.currentRendering) {
      const startColor = evaluateGradient(this.currentRendering.colorMap, particle.id % 100 / 100);
      const endColor = evaluateGradient(this.targetRendering.colorMap, particle.id % 100 / 100);
      
      // 插值计算
      particle.hue = this.lerpHue(startColor.h, endColor.h, stageProgress);
      particle.saturation = this.lerp(startColor.s, endColor.s, stageProgress);
      particle.lightness = this.lerp(startColor.l, endColor.l, stageProgress);
      particle.alpha = this.lerp(startColor.a, endColor.a, stageProgress) * (1 - lifeProgress * 0.5);
    }

    // 黑体辐射: 温度随时间降低 (作为附加效果叠加在基础颜色上)
    if (particle.temperature > 0) {
      particle.temperature -= 400 * deltaTime; 
      particle.temperature = Math.max(particle.temperature, 500); 
      // 只有在特定模式下启用黑体辐射覆盖
      if (this.targetRendering?.useBlackbodyRadiation) {
          this.applyBlackbodyColor(particle);
      }
    }
    
    // 透明度渐变 (消亡期)
    if (this.state === StreamState.FADING) {
      particle.alpha *= Math.max(0, 1 - deltaTime * 2);
    }
    
    // 大小变化 - 只在初始阶段执行生长动画，后续阶段保持目标大小
    if (this.targetRendering) {
       const targetSize = this.targetRendering.baseSize;
       
       // ★ 关键修复：只有初始阶段才执行生长动画
       if (this.isInitialStage && !this.sizeGrowthCompleted) {
           const initialSize = 0.1;
           const growDuration = this.targetRendering.growDuration ?? 0.5;
           const growProgress = growDuration > 0 ? Math.min(1, particle.stageAge / growDuration) : 1;
           particle.size = this.lerp(initialSize, targetSize, growProgress);
           
           // 标记生长完成
           if (growProgress >= 1) {
               this.sizeGrowthCompleted = true;
           }
       } else {
           // 后续阶段直接使用目标大小
           particle.size = targetSize;
       }
    }
    
    if (lifeProgress > 0.8) {
      particle.size *= 0.98; // 后期缩小
    }
  }

  /**
   * 简单的插值函数
   */
  private lerp(a: number, b: number, t: number): number {
    const res = a + (b - a) * t;
    return res;
  }

  /**
   * 处理色相环绕的插值
   */
  private lerpHue(a: number, b: number, t: number): number {
    let diff = b - a;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return (a + diff * t + 360) % 360;
  }

  /**
   * 获取粒子数据 (用于渲染器)
   */
  getParticleData(): StreamParticle[] {
    // 只返回活着的粒子
    const activeParticles: StreamParticle[] = [];
    for (let i = 0; i < this.particles.length; i++) {
        if (!this.particles[i].isDead) {
            activeParticles.push(this.particles[i]);
        }
    }
    return activeParticles;
  }

  /**
   * 应用黑体辐射颜色
   * 温度从高到低: 白 → 蓝白 → 白 → 黄 → 橙 → 红 → 暗红
   */
  private applyBlackbodyColor(particle: StreamParticle): void {
    const temp = particle.temperature;
    
    if (temp > 7000) {
      // 极高温: 蓝白
      particle.hue = 200 + (temp - 7000) / 100;
      particle.lightness = 0.9;
    } else if (temp > 5500) {
      // 高温: 白到黄白
      particle.hue = 50 + (7000 - temp) / 50;
      particle.lightness = 0.85;
    } else if (temp > 4000) {
      // 中温: 黄到橙
      particle.hue = 30 + (5500 - temp) / 75;
      particle.lightness = 0.65;
    } else if (temp > 2500) {
      // 低温: 橙到红
      particle.hue = 10 + (4000 - temp) / 150;
      particle.lightness = 0.5;
    } else {
      // 极低温: 暗红 (灰烬)
      particle.hue = 0;
      particle.saturation = 0.3;
      particle.lightness = 0.2 + (temp - 800) / 5000;
    }
  }

  /**
   * 判断粒子是否应该死亡
   */
  private shouldParticleDie(particle: StreamParticle): boolean {
    // 生命周期结束
    if (particle.age > particle.lifeTime) return true;
    
    // 透明度归零
    if (particle.alpha <= 0) return true;
    
    // 落到地面以下 (增加容差，防止某些形状底部被切掉)
    if (particle.position.y < -200) return true;
    
    // 飞太远 (增加到 50000，支持大规模延展的 3D 形状)
    const distFromCenter = Math.sqrt(
      particle.position.x ** 2 +
      particle.position.y ** 2 +
      particle.position.z ** 2
    );
    if (distFromCenter > 50000) return true;
    
    return false;
  }

  /**
   * 移除死亡粒子
   */
  private removeDead(indices: number[]): void {
    // 从后往前移除，避免索引偏移
    const sorted = indices.sort((a, b) => b - a);
    for (const i of sorted) {
      const particle = this.particles[i];
      this.particles.splice(i, 1);
      this.releaseParticle(particle);
    }
  }

  /**
   * 获取活跃粒子数据 (用于渲染)
   */
  getParticleData(): StreamParticle[] {
    return this.particles.filter(p => !p.isDead);
  }

  /**
   * 获取粒子数量
   */
  getParticleCount(): number {
    return this.particles.filter(p => !p.isDead).length;
  }

  /**
   * 获取当前状态
   */
  getState(): StreamState {
    return this.state;
  }

  /**
   * 获取力场系统
   */
  getForceFieldSystem(): ForceFieldSystem {
    return this.forceFieldSystem;
  }

  /**
   * 获取变形引擎
   */
  getMorphingEngine(): MorphingEngine {
    return this.morphingEngine;
  }

  /**
   * 注册阶段变化回调
   */
  onStageChange(callback: (stageIndex: number) => void): () => void {
    this.onStageChangeCallbacks.push(callback);
    return () => {
      this.onStageChangeCallbacks = this.onStageChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 注册粒子死亡回调
   */
  onParticleDeath(callback: (particle: StreamParticle) => void): () => void {
    this.onParticleDeathCallbacks.push(callback);
    return () => {
      this.onParticleDeathCallbacks = this.onParticleDeathCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * 重置所有粒子的阶段年龄 (用于触发新阶段的平滑渲染过渡)
   */
  resetStageAge(): void {
    for (const p of this.particles) {
      p.stageAge = 0;
    }
    this.stageElapsed = 0;
  }

  /**
   * 完全重置
   */
  reset(): void {
    // 释放所有粒子回池
    for (const particle of this.particles) {
      this.releaseParticle(particle);
    }
    this.particles = [];
    
    this.state = StreamState.IDLE;
    this.stageIndex = 0;
    this.stageElapsed = 0;
    this.totalElapsed = 0;
    this.currentStage = null;
    
    this.forceFieldSystem.clearForces();
    this.morphingEngine.reset();
    
    console.log('[ParticleStream] Reset complete');
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.reset();
    this.particlePool = [];
  }
}

// END OF FILE: src/core/stream/ParticleStream.ts
