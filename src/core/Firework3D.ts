import { Vector3 } from './Vector3';
import { ExplosionType, AscensionType, ColorStyle, AppSettings, ParticleOptions3D, FireworkConfig } from '../types';
import { Particle3D } from './Particle3D';
import { TrajectoryFactory, TrajectoryCalculator, TrajectoryType } from './trajectories/TrajectoryFactory';
import { Shape3DGenerator, Shape3DType } from './shapes/Shape3DFactory';
import { ComboManager, ComboConfig, ComboType } from './combos/ComboManager';

export interface Firework3DOptions {
  startX: number;
  startZ: number;
  targetX: number;
  targetY: number;
  targetZ: number;
  hue: number;
  charge: number;
  // 新向后兼容字段
  trajectoryType?: TrajectoryType;
  comboType?: ComboType;
  customShape?: Shape3DType;
  lifeTimeOverride?: number; // 覆盖持续时间 (秒)
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
  
  public lifeTimeOverride: number = 0;

  public type: ExplosionType;
  public ascension: AscensionType;
  public colorStyle: ColorStyle;
  public lifeTime: number = 0;

  private trajectoryCalculator: TrajectoryCalculator;
  private comboConfig: ComboConfig;
  private currentStageIndex: number = 0;
  private lastStageTime: number = 0;

  constructor(options: Firework3DOptions, settings: AppSettings, config: FireworkConfig) {
    this.position = new Vector3(options.startX, 0, options.startZ);
    this.target = new Vector3(options.targetX, options.targetY, options.targetZ);
    this.hue = options.hue;
    this.charge = options.charge;
    this.trailLength = settings.trailLength;
    this.lifeTimeOverride = options.lifeTimeOverride || 0;

    // ... (rest of constructor logic) ... 
    // I need to be careful with replace_file_content to not delete the logic I'm not showing.
    // The replace tool requires REPLACEMENT of the block.
    
    // 1. 确定组合技和轨迹
    const cType = options.comboType || ComboType.SINGLE;
    
    // 修复样式应用问题：处理 legacy ExplosionType 的转换
    const rawShape = options.customShape as any;
    const baseShape = this.mapToShape3D(rawShape);
    
    this.comboConfig = ComboManager.generateConfig(cType, baseShape);

    const tType = options.trajectoryType || this.comboConfig.trajectory;
    this.trajectoryCalculator = TrajectoryFactory.create(tType);

    // 2. 保持对旧有类型的兼容性（用于 UI 显示等）
    const ascList = config.enabledAscensions.length > 0 ? config.enabledAscensions : [AscensionType.LINEAR];
    this.ascension = ascList[Math.floor(Math.random() * ascList.length)];
    this.colorStyle = config.enabledColors[Math.floor(Math.random() * config.enabledColors.length)] || ColorStyle.SINGLE;
    this.type = rawShape in ExplosionType ? (rawShape as ExplosionType) : ExplosionType.SPHERE;
    // 3. 计算初始速度
    const distanceY = this.target.y - this.position.y;
    const gravity = settings.gravity * 1.5;
    const timeToApex = Math.sqrt(2 * Math.max(10, distanceY) / gravity);
    const initialVelY = gravity * timeToApex;
    const initialVelX = (this.target.x - this.position.x) / timeToApex;
    const initialVelZ = (this.target.z - this.position.z) / timeToApex;

    this.velocity = new Vector3(initialVelX, initialVelY, initialVelZ);
  }

  private mapToShape3D(shape: any): Shape3DType {
    if (!shape) return Shape3DType.SPHERE;
    if (Object.values(Shape3DType).includes(shape as Shape3DType)) return shape as Shape3DType;
    
    // 映射旧版到新版
    const mapping: Record<string, Shape3DType> = {
      [ExplosionType.SPHERE]: Shape3DType.SPHERE,
      [ExplosionType.BURST]: Shape3DType.EXPLOSION_BURST,
      [ExplosionType.RING]: Shape3DType.RING_WAVE,
      [ExplosionType.DOUBLE_RING]: Shape3DType.DOUBLE_RING,
      [ExplosionType.WILLOW]: Shape3DType.FIREWORK_WILLOW,
      [ExplosionType.CUBE]: Shape3DType.CUBE,
      [ExplosionType.PYRAMID]: Shape3DType.PYRAMID,
      [ExplosionType.STAR]: Shape3DType.STAR_3D,
      [ExplosionType.GALAXY]: Shape3DType.GALAXY_SPIRAL,
      [ExplosionType.HEART]: Shape3DType.HEART_3D,
      [ExplosionType.HEART_BEAT]: Shape3DType.HEART_3D,
      [ExplosionType.SNOWFLAKE]: Shape3DType.SNOWFLAKE_3D,
      [ExplosionType.BUTTERFLY]: Shape3DType.BUTTERFLY_3D,
      [ExplosionType.FLOWER]: Shape3DType.FLOWER_3D,
      [ExplosionType.FISH]: Shape3DType.FISH_3D,
      [ExplosionType.SATURN]: Shape3DType.PLANET_RINGS,
      [ExplosionType.HELIX]: Shape3DType.GALAXY_SPIRAL, // 映射到螺旋星系
      [ExplosionType.WATERFALL]: Shape3DType.CASCADE, // 映射到瀑布级联
    };
    
    return mapping[shape] || Shape3DType.SPHERE;
  }


  update(settings: AppSettings, deltaTime: number): void {
    if (deltaTime <= 0) return;

    const dt = deltaTime * 60;
    
    // 使用新的轨迹计算器更新物理
    if (!this.exploded) {
      this.velocity = this.trajectoryCalculator.calculate(this.velocity, settings.gravity, deltaTime);
      this.position.x += this.velocity.x * dt;
      this.position.y += this.velocity.y * dt;
      this.position.z += this.velocity.z * dt;
      this.lifeTime = this.trajectoryCalculator.getLifeTime();

      if (this.velocity.y <= -2.5) {
        this.exploded = true;
        this.lastStageTime = this.lifeTime;
      }
    } else {
      // 爆炸后的逻辑：处理多阶段组合技
      this.handleComboStages(settings, (opts) => this.spawnParticleCallback?.(opts) as any);
    }
  }

  // 临时存储回调，以便在 update 中调用
  private spawnParticleCallback: ((opts: ParticleOptions3D) => Particle3D) | null = null;

  createExplosion(
    settings: AppSettings,
    spawnParticle: (opts: ParticleOptions3D) => Particle3D
  ): void {
    this.spawnParticleCallback = spawnParticle;
    // 立即触发第一阶段（如果有延迟为0的阶段）
    this.handleComboStages(settings, spawnParticle);
  }

  private handleComboStages(
    settings: AppSettings,
    spawnParticle: (opts: ParticleOptions3D) => Particle3D
  ): void {
    if (!this.comboConfig || this.currentStageIndex >= this.comboConfig.stages.length) return;

    const timeSinceExplosion = this.lifeTime - this.lastStageTime;
    const currentStage = this.comboConfig.stages[this.currentStageIndex];

    if (timeSinceExplosion >= currentStage.delay) {
      this.executeStage(currentStage, settings, spawnParticle);
      this.currentStageIndex++;
    }
  }

  private executeStage(
    stage: any,
    settings: AppSettings,
    spawnParticle: (opts: ParticleOptions3D) => Particle3D
  ): void {
    const baseCount = Math.floor((200 + this.charge * 400) * settings.particleCountMultiplier * stage.particleCount);
    const scale = settings.explosionSizeMultiplier * stage.scale;
    const hue = (this.hue + stage.hueShift) % 360;

    // 获取真3D形状点分布
    const resultPoints = Shape3DGenerator.generate(stage.shape, baseCount, scale);
    
    // 构造带属性的点数组
    const points: any[] = [];
    for (let i = 0; i < resultPoints.length; i += 3) {
      points.push({
        position: new Vector3(resultPoints[i], resultPoints[i+1], resultPoints[i+2]),
        hue: hue,
        size: stage.particleSize || 2
      });
    }
    
    // 计算 decay: 如果有 override，反推 decay
    let finalDecay = stage.decay ?? (0.01 + Math.random() * 0.015);
    if (this.lifeTimeOverride > 0) {
      finalDecay = 1 / (this.lifeTimeOverride * 60);
    }

    points.forEach(p => {
      const pos = p.position.clone();
      if (stage.spawnOffset) {
        pos.x += stage.spawnOffset.x;
        pos.y += stage.spawnOffset.y;
        pos.z += stage.spawnOffset.z;
      }

      const particle = spawnParticle({
        x: this.position.x + pos.x,
        y: this.position.y + pos.y,
        z: this.position.z + pos.z,
        originX: this.position.x,
        originY: this.position.y,
        originZ: this.position.z,
        hue: p.hue,
        // 初始动量不再是随机乱跳，而是继承一部分形状动量
        speed: (stage.velocityScale || 1.0) * (1 + Math.random() * 2), 
        gravity: stage.gravity ?? settings.gravity,
        friction: settings.friction,
        behavior: (p.behavior || stage.behavior || 'default') as any,
        size: p.size || 5,
        decay: finalDecay
      });

      // 核心修复：基于距离的扩张速度 (Spherical Expansion)
      // 只有这样，复杂的 3D 形状才能在膨胀时保持“形状”，而不是迅速变成一个球壳
      if (particle) {
        const dist = p.position.length();
        if (dist > 0) {
          const dir = p.position.clone().normalize();
          // 强化爆发动画效果：
          // 1. 增加基础爆发初速度 (0.15)，确保接近中心的点也能“弹”射出去
          // 2. 将扩张系数从 0.08 提升至 0.12，模拟几何体那种强力炸开的感觉
          const boost = 0.15;
          const expandSpeed = (stage.velocityScale || 1.0) * (dist * 0.12 + boost); 
          particle.velocity.x = dir.x * expandSpeed;
          particle.velocity.y = dir.y * expandSpeed;
          particle.velocity.z = dir.z * expandSpeed;
        }
      }
    });
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