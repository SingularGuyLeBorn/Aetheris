/**
 * Director.ts - 烟花总导演
 * 
 * 核心职责：
 * 1. 管理所有烟花实例的生命周期
 * 2. 维护全局时钟
 * 3. 将 FireworkManifest (JSON配置) 转换为运行时实例
 * 4. 协调各子系统 (Carrier, ParticleStream, Morphing)
 * 
 * 这是"一切皆流"架构的总调度中心
 */

import { Vector3 } from '../Vector3';
import { 
  FireworkManifest, 
  FireworkInstance, 
  PayloadStage,
  CarrierConfig,
  TopologyConfig,
  DynamicsConfig,
  RenderingConfig,
  PRESET_CURVES,
  PRESET_GRADIENTS,
  PRESET_FORCE_FIELDS
} from './types';
import { CarrierSystem, CarrierInstance, TrailParticle } from './CarrierSystem';
import { ParticleStream, StreamParticle, StreamState } from './ParticleStream';
import { Shape3DType } from '../shapes/Shape3DFactory';

/**
 * 烟花运行时实例 (扩展)
 */
interface RuntimeFirework {
  /** 实例ID */
  id: string;
  /** 配置清单 */
  manifest: FireworkManifest;
  /** 发射位置 */
  launchPosition: Vector3;
  /** 目标位置 */
  targetPosition: Vector3;
  /** 运载器ID */
  carrierId: string | null;
  /** 粒子流 */
  particleStream: ParticleStream | null;
  /** 当前阶段索引 */
  currentStageIndex: number;
  /** 当前阶段开始时间 */
  stageStartTime: number;
  /** 总运行时间 */
  elapsed: number;
  /** 状态 */
  state: 'carrier' | 'payload' | 'extinct';
  /** 色相覆盖 */
  hueOverride: number;
}

/**
 * 导演配置
 */
export interface DirectorConfig {
  /** 最大同时活跃烟花数 */
  maxActiveFireworks: number;
  /** 每个烟花的最大粒子数 */
  maxParticlesPerFirework: number;
  /** 是否启用调试日志 */
  debug: boolean;
}

const DEFAULT_DIRECTOR_CONFIG: DirectorConfig = {
  maxActiveFireworks: 50,
  maxParticlesPerFirework: 5000,
  debug: false
};

/**
 * 烟花总导演
 */
export class Director {
  private config: DirectorConfig;
  private carrierSystem: CarrierSystem;
  private fireworks: Map<string, RuntimeFirework> = new Map();
  private manifests: Map<string, FireworkManifest> = new Map();
  
  private globalTime: number = 0;
  private isPaused: boolean = false;
  private timeScale: number = 1;
  private nextFireworkId: number = 0;

  // 统计
  private stats = {
    totalLaunched: 0,
    totalExtinct: 0,
    peakParticles: 0
  };

  constructor(config: Partial<DirectorConfig> = {}) {
    this.config = { ...DEFAULT_DIRECTOR_CONFIG, ...config };
    this.carrierSystem = new CarrierSystem();
    
    // 注册内置预设
    this.registerBuiltinManifests();
  }

  /**
   * 注册内置烟花清单
   */
  private registerBuiltinManifests(): void {
    // 凤凰涅槃
    this.registerManifest(this.createPhoenixRebirthManifest());
    
    // 简单球形爆炸
    this.registerManifest(this.createSimpleSphereManifest());
    
    // 心形变换
    this.registerManifest(this.createHeartMorphManifest());
    
    // 银河螺旋
    this.registerManifest(this.createGalaxyManifest());
  }

  /**
   * 创建"凤凰涅槃"清单
   */
  private createPhoenixRebirthManifest(): FireworkManifest {
    return {
      id: 'phoenix_rebirth',
      name: '凤凰涅槃',
      description: '先炸成火球，再变形为凤凰，最后化作灰烬',
      tags: ['经典', '变形', '高级'],
      duration: 8,
      
      carrier: {
        type: 'comet',
        path: {
          type: 'spiral',
          points: [],
          speedCurve: PRESET_CURVES.EASE_OUT,
          spiralRadius: 5,
          spiralFrequency: 2
        },
        duration: 2,
        trail: {
          emissionRate: 100,
          lifeTime: 0.5,
          colorGradient: PRESET_GRADIENTS.GOLD,
          texture: 'spark',
          size: 0.3
        }
      },
      
      payload: {
        stages: [
          // 阶段 A: 火球爆发 (0s - 1s)
          {
            id: 'fireball',
            name: '火球爆发',
            timeOffset: 0,
            duration: 1,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.SPHERE,
              resolution: 3000,
              scale: 50
            },
            dynamics: {
              transitionMode: 'explode',
              initialVelocity: {
                mode: 'radial',
                speed: [80, 120]
              },
              forceFields: [
                { ...PRESET_FORCE_FIELDS.HEAVY_DRAG },
                { ...PRESET_FORCE_FIELDS.LIGHT_GRAVITY }
              ],
              velocityProfile: PRESET_CURVES.EASE_OUT
            },
            rendering: {
              colorMap: PRESET_GRADIENTS.FIRE,
              sizeCurve: PRESET_CURVES.EASE_OUT,
              baseSize: 1.5,
              blending: 'additive',
              useBlackbodyRadiation: true,
              initialTemperature: 7000,
              coolingRate: 500,
              glowIntensity: 2
            }
          },
          
          // 阶段 B: 凤凰聚形 (1s - 3s)
          {
            id: 'phoenix_form',
            name: '凤凰聚形',
            timeOffset: 1,
            duration: 2,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.PHOENIX,
              resolution: 3000,
              scale: 40,
              rotation: new Vector3(0, 0, 0)
            },
            dynamics: {
              transitionMode: 'morph',
              initialVelocity: {
                mode: 'target_seeking',
                speed: 30
              },
              forceFields: [
                { ...PRESET_FORCE_FIELDS.AIR_DRAG }
              ],
              velocityProfile: PRESET_CURVES.EASE_IN_OUT,
              morphAttractionStrength: 80,
              morphDamping: 0.92
            },
            rendering: {
              colorMap: PRESET_GRADIENTS.PHOENIX,
              sizeCurve: PRESET_CURVES.LINEAR,
              baseSize: 1.2,
              blending: 'additive',
              glowIntensity: 1.5
            },
            reuseParticles: true
          },
          
          // 阶段 C: 凤凰展翅 (3s - 5s)
          {
            id: 'phoenix_wings',
            name: '凤凰展翅',
            timeOffset: 3,
            duration: 2,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.PHOENIX,
              resolution: 3000,
              scale: 45
            },
            dynamics: {
              transitionMode: 'maintain',
              initialVelocity: {
                mode: 'target_seeking',
                speed: 5
              },
              forceFields: [
                { type: 'turbulence', strength: 3, noiseFrequency: 0.3, noiseAmplitude: 1 }
              ],
              velocityProfile: PRESET_CURVES.LINEAR
            },
            rendering: {
              colorMap: PRESET_GRADIENTS.PHOENIX,
              sizeCurve: PRESET_CURVES.LINEAR,
              baseSize: 1.3,
              blending: 'additive',
              glowIntensity: 1.8
            },
            reuseParticles: true,
            shaderAnimation: {
              vertexModifier: 'wing_flap',
              parameters: { frequency: 2, amplitude: 5 }
            }
          },
          
          // 阶段 D: 灰烬飘落 (5s - 8s)
          {
            id: 'ashes',
            name: '灰烬飘落',
            timeOffset: 5,
            duration: 3,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.CHAOS_SCATTER,
              resolution: 3000,
              scale: 80
            },
            dynamics: {
              transitionMode: 'scatter',
              initialVelocity: {
                mode: 'random',
                speed: [5, 15]
              },
              forceFields: [
                { ...PRESET_FORCE_FIELDS.EARTH_GRAVITY },
                { type: 'wind', strength: 5, direction: new Vector3(1, -0.3, 0.5) },
                { type: 'turbulence', strength: 8, noiseFrequency: 0.5, noiseAmplitude: 3 }
              ],
              velocityProfile: PRESET_CURVES.LINEAR
            },
            rendering: {
              colorMap: {
                stops: [
                  { position: 0, hue: 30, saturation: 0.8, lightness: 0.5 },
                  { position: 0.5, hue: 20, saturation: 0.5, lightness: 0.3 },
                  { position: 1, hue: 0, saturation: 0.2, lightness: 0.15, alpha: 0 }
                ]
              },
              sizeCurve: PRESET_CURVES.EASE_OUT,
              baseSize: 0.8,
              blending: 'normal',
              useBlackbodyRadiation: true,
              initialTemperature: 2500,
              coolingRate: 300
            },
            reuseParticles: true
          }
        ]
      }
    };
  }

  /**
   * 创建简单球形爆炸清单
   */
  private createSimpleSphereManifest(): FireworkManifest {
    return {
      id: 'simple_sphere',
      name: '经典球形',
      description: '经典的球形烟花爆炸',
      tags: ['经典', '基础'],
      duration: 4,
      
      carrier: {
        type: 'projectile',
        path: {
          type: 'linear',
          points: [],
          speedCurve: PRESET_CURVES.EASE_OUT
        },
        duration: 1.5,
        trail: {
          emissionRate: 60,
          lifeTime: 0.4,
          colorGradient: PRESET_GRADIENTS.GOLD,
          texture: 'spark',
          size: 0.2
        }
      },
      
      payload: {
        stages: [
          {
            id: 'explosion',
            name: '球形爆炸',
            timeOffset: 0,
            duration: 3,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.SPHERE,
              resolution: 2000,
              scale: 40
            },
            dynamics: {
              transitionMode: 'explode',
              initialVelocity: {
                mode: 'radial',
                speed: [60, 100]
              },
              forceFields: [
                { ...PRESET_FORCE_FIELDS.LIGHT_GRAVITY },
                { ...PRESET_FORCE_FIELDS.AIR_DRAG }
              ],
              velocityProfile: PRESET_CURVES.EASE_OUT
            },
            rendering: {
              colorMap: PRESET_GRADIENTS.RAINBOW,
              sizeCurve: PRESET_CURVES.EASE_OUT,
              baseSize: 1,
              blending: 'additive',
              glowIntensity: 1.5
            }
          }
        ]
      }
    };
  }

  /**
   * 创建心形变换清单
   */
  private createHeartMorphManifest(): FireworkManifest {
    return {
      id: 'heart_morph',
      name: '心心相印',
      description: '从爆炸变形为心形',
      tags: ['浪漫', '变形'],
      duration: 6,
      
      carrier: {
        type: 'projectile',
        path: {
          type: 'arc',
          points: [],
          speedCurve: PRESET_CURVES.EASE_OUT
        },
        duration: 1.5,
        trail: {
          emissionRate: 80,
          lifeTime: 0.5,
          colorGradient: {
            stops: [
              { position: 0, hue: 350, saturation: 1, lightness: 0.7 },
              { position: 1, hue: 340, saturation: 0.8, lightness: 0.4 }
            ]
          },
          texture: 'spark',
          size: 0.25
        }
      },
      
      payload: {
        stages: [
          {
            id: 'burst',
            name: '初始爆发',
            timeOffset: 0,
            duration: 1.5,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.EXPLOSION_BURST,
              resolution: 2500,
              scale: 35
            },
            dynamics: {
              transitionMode: 'explode',
              initialVelocity: { mode: 'radial', speed: [50, 80] },
              forceFields: [{ ...PRESET_FORCE_FIELDS.HEAVY_DRAG }],
              velocityProfile: PRESET_CURVES.EASE_OUT
            },
            rendering: {
              colorMap: {
                stops: [
                  { position: 0, hue: 350, saturation: 1, lightness: 0.8 },
                  { position: 1, hue: 340, saturation: 1, lightness: 0.5 }
                ]
              },
              sizeCurve: PRESET_CURVES.LINEAR,
              baseSize: 1.2,
              blending: 'additive',
              glowIntensity: 2
            }
          },
          {
            id: 'heart',
            name: '心形聚合',
            timeOffset: 1.5,
            duration: 3,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.HEART_3D,
              resolution: 2500,
              scale: 30
            },
            dynamics: {
              transitionMode: 'morph',
              initialVelocity: { mode: 'target_seeking', speed: 20 },
              forceFields: [{ ...PRESET_FORCE_FIELDS.AIR_DRAG }],
              velocityProfile: PRESET_CURVES.EASE_IN_OUT,
              morphAttractionStrength: 60,
              morphDamping: 0.9
            },
            rendering: {
              colorMap: {
                stops: [
                  { position: 0, hue: 355, saturation: 1, lightness: 0.6 },
                  { position: 0.5, hue: 350, saturation: 1, lightness: 0.5 },
                  { position: 1, hue: 345, saturation: 0.9, lightness: 0.45 }
                ]
              },
              sizeCurve: PRESET_CURVES.LINEAR,
              baseSize: 1,
              blending: 'additive',
              glowIntensity: 1.5
            },
            reuseParticles: true
          }
        ]
      }
    };
  }

  /**
   * 创建银河清单
   */
  private createGalaxyManifest(): FireworkManifest {
    return {
      id: 'galaxy_spiral',
      name: '银河诞生',
      description: '壮观的银河螺旋效果',
      tags: ['宏大', '宇宙'],
      duration: 7,
      
      carrier: {
        type: 'invisible',
        path: { type: 'linear', points: [], speedCurve: PRESET_CURVES.LINEAR },
        duration: 0.5
      },
      
      payload: {
        stages: [
          {
            id: 'galaxy',
            name: '银河绽放',
            timeOffset: 0,
            duration: 6,
            topology: {
              type: 'mathematical_shape',
              source: Shape3DType.GALAXY_SPIRAL,
              resolution: 4000,
              scale: 60
            },
            dynamics: {
              transitionMode: 'accumulate',
              initialVelocity: { mode: 'random', speed: [10, 30] },
              forceFields: [
                { type: 'vortex', strength: 20, center: new Vector3(0, 0, 0), radius: 100 },
                { ...PRESET_FORCE_FIELDS.AIR_DRAG },
                { type: 'turbulence', strength: 5, noiseFrequency: 0.2, noiseAmplitude: 2 }
              ],
              velocityProfile: PRESET_CURVES.EASE_IN_OUT
            },
            rendering: {
              colorMap: {
                stops: [
                  { position: 0, hue: 200, saturation: 0.8, lightness: 0.9 },
                  { position: 0.3, hue: 220, saturation: 0.9, lightness: 0.7 },
                  { position: 0.6, hue: 280, saturation: 1, lightness: 0.6 },
                  { position: 1, hue: 320, saturation: 0.8, lightness: 0.5 }
                ]
              },
              sizeCurve: PRESET_CURVES.LINEAR,
              baseSize: 0.8,
              blending: 'additive',
              glowIntensity: 2
            }
          }
        ]
      }
    };
  }

  /**
   * 注册烟花清单
   */
  registerManifest(manifest: FireworkManifest): void {
    this.manifests.set(manifest.id, manifest);
    if (this.config.debug) {
      console.log(`[Director] Registered manifest: ${manifest.name} (${manifest.id})`);
    }
  }

  /**
   * 获取清单
   */
  getManifest(id: string): FireworkManifest | undefined {
    return this.manifests.get(id);
  }

  /**
   * 获取所有清单
   */
  getAllManifests(): FireworkManifest[] {
    return Array.from(this.manifests.values());
  }

  /**
   * 发射烟花
   */
  launch(
    manifestId: string,
    launchPosition: Vector3,
    targetPosition: Vector3,
    hueOverride?: number
  ): string | null {
    const manifest = this.manifests.get(manifestId);
    if (!manifest) {
      console.error(`[Director] Manifest not found: ${manifestId}`);
      return null;
    }

    // 移除活跃烟花数限制，按用户要求取消强制限制
    /*
    if (this.fireworks.size >= this.config.maxActiveFireworks) {
      console.warn('[Director] Max active fireworks reached');
      return null;
    }
    */

    const id = `fw_${this.nextFireworkId++}`;
    
    const firework: RuntimeFirework = {
      id,
      manifest,
      launchPosition: new Vector3(launchPosition.x, launchPosition.y, launchPosition.z),
      targetPosition: new Vector3(targetPosition.x, targetPosition.y, targetPosition.z),
      carrierId: null,
      particleStream: null,
      currentStageIndex: -1,
      stageStartTime: 0,
      elapsed: 0,
      state: 'carrier',
      hueOverride: hueOverride ?? Math.random() * 360
    };

    // 创建运载器
    if (manifest.carrier.type !== 'invisible') {
      firework.carrierId = this.carrierSystem.createCarrier(
        manifest.carrier,
        launchPosition,
        targetPosition,
        firework.hueOverride, // 传递颜色
        () => this.onCarrierArrive(id)
      );
    } else {
      // 隐形运载器直接触发载荷
      setTimeout(() => {
        this.onCarrierArrive(id);
      }, manifest.carrier.duration * 1000);
    }

    this.fireworks.set(id, firework);
    this.stats.totalLaunched++;

    if (this.config.debug) {
      console.log(`[Director] Launched ${manifest.name} at (${targetPosition.x.toFixed(1)}, ${targetPosition.y.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
    }

    return id;
  }

  /**
   * 运载器到达回调
   */
  private onCarrierArrive(fireworkId: string): void {
    const firework = this.fireworks.get(fireworkId);
    if (!firework) return;

    if (this.config.debug) {
      console.log(`[Director] Carrier arrived for ${firework.manifest.name}`);
    }

    // 切换到载荷阶段
    firework.state = 'payload';
    
    // 创建粒子流
    firework.particleStream = new ParticleStream({
      maxParticles: this.config.maxParticlesPerFirework,
      baseLifeTime: firework.manifest.duration
    });
    firework.particleStream.setSpawnCenter(firework.targetPosition);

    // 开始第一个阶段
    this.startStage(firework, 0);
  }

  /**
   * 开始指定阶段
   */
  private startStage(firework: RuntimeFirework, stageIndex: number): void {
    const stages = firework.manifest.payload.stages;
    if (stageIndex >= stages.length) {
      // 所有阶段完成，开始消亡
      this.startExtinction(firework);
      return;
    }

    const stage = stages[stageIndex];
    const stream = firework.particleStream!;

    firework.currentStageIndex = stageIndex;
    firework.stageStartTime = this.globalTime;
    
    // 关键修复：重置粒子流的阶段时间，确保渲染过渡从 0 开始
    stream.resetStageAge();

    if (this.config.debug) {
      console.log(`[Director] Starting stage ${stageIndex}: ${stage.name || stage.id}`);
      console.log(`[Director] Topology source: ${stage.topology?.source}, resolution: ${stage.topology?.resolution}, scale: ${stage.topology?.scale}`);
    }

    // 根据过渡模式执行
  const topology = stage.topology;
  
  switch (stage.dynamics.transitionMode) {
    case 'explode':
    case 'accumulate':
    case 'scatter':
      // 生成新粒子 (增加安全检查)
      if (topology) {
        stream.spawn(
          topology.resolution || 1000,
          topology,
          stage.dynamics,
          stage.rendering
        );
      } else {
        console.warn(`[Director] Stage ${stage.id} requested spawn but has no topology.`);
      }
      break;
      
      case 'morph':
        // 变形到新形状
        if (stage.topology) {
          if (stream.getParticleCount() > 0) {
            stream.startMorph(stage.topology, stage.rendering, {
              duration: Math.min(stage.duration, 2),
              attractionStrength: stage.dynamics.morphAttractionStrength || 50,
              damping: stage.dynamics.morphDamping || 0.9
            });
          } else {
            // 如果没有粒子，先生成再变形
            stream.spawn(
              stage.topology.resolution || 1000,
              stage.topology,
              stage.dynamics,
              stage.rendering
            );
          }
        } else {
          console.warn(`[Director] Stage ${stage.id} requested morph but has no topology.`);
        }
        break;
      
      case 'maintain':
        // 维持当前状态，只更新力场
        stream.getForceFieldSystem().setForceFields(stage.dynamics.forceFields);
        break;
    }
  }

  /**
   * 开始消亡阶段
   */
  private startExtinction(firework: RuntimeFirework): void {
    if (firework.particleStream) {
      firework.particleStream.startExtinction();
    }
    firework.state = 'extinct';
    
    if (this.config.debug) {
      console.log(`[Director] ${firework.manifest.name} entering extinction phase`);
    }
  }

  /**
   * 更新 (每帧调用)
   */
  update(deltaTime: number): void {
    if (this.isPaused) return;

    const scaledDelta = deltaTime * this.timeScale;
    this.globalTime += scaledDelta;

    // 更新运载系统
    this.carrierSystem.update(scaledDelta);

    // 更新每个烟花
    for (const [id, firework] of this.fireworks.entries()) {
      firework.elapsed += scaledDelta;

      if (firework.state === 'payload' && firework.particleStream) {
        // 更新粒子流
        firework.particleStream.update(scaledDelta);

        // 检查是否需要切换阶段
        this.checkStageTransition(firework);

        // 检查是否全部消亡
        if (firework.particleStream.getState() === StreamState.EXTINCT) {
          this.removeFirework(id);
        }
      }
    }

    // 清理已完成的运载器
    this.carrierSystem.cleanupArrived();

    // 更新统计
    this.updateStats();
  }

  /**
   * 检查阶段过渡
   */
  private checkStageTransition(firework: RuntimeFirework): void {
    const stages = firework.manifest.payload.stages;
    const currentIndex = firework.currentStageIndex;
    
    if (currentIndex < 0 || currentIndex >= stages.length - 1) return;

    const currentStage = stages[currentIndex];
    const nextStage = stages[currentIndex + 1];
    const stageElapsed = this.globalTime - firework.stageStartTime;

    // 检查是否到达下一阶段的触发时间
    if (stageElapsed >= currentStage.duration) {
      // 如果下一阶段重用粒子，直接开始变形
      if (nextStage.reuseParticles) {
        this.startStage(firework, currentIndex + 1);
      } else {
        // 否则开始消亡，然后开始新阶段
        this.startStage(firework, currentIndex + 1);
      }
    }
  }

  /**
   * 移除烟花
   */
  private removeFirework(id: string): void {
    const firework = this.fireworks.get(id);
    if (firework) {
      if (firework.carrierId) {
        this.carrierSystem.removeCarrier(firework.carrierId);
      }
      if (firework.particleStream) {
        firework.particleStream.destroy();
      }
      this.fireworks.delete(id);
      this.stats.totalExtinct++;

      if (this.config.debug) {
        console.log(`[Director] Removed firework ${id}`);
      }
    }
  }

  /**
   * 更新统计信息
   */
  private updateStats(): void {
    let totalParticles = 0;
    for (const firework of this.fireworks.values()) {
      if (firework.particleStream) {
        totalParticles += firework.particleStream.getParticleCount();
      }
    }
    totalParticles += this.carrierSystem.getStats().trailParticles;
    
    if (totalParticles > this.stats.peakParticles) {
      this.stats.peakParticles = totalParticles;
    }
  }

  // ============================================================================
  // 渲染数据获取接口
  // ============================================================================

  /**
   * 获取所有粒子数据 (用于渲染)
   */
  getAllParticles(): StreamParticle[] {
    const allParticles: StreamParticle[] = [];
    for (const firework of this.fireworks.values()) {
      if (firework.particleStream) {
        allParticles.push(...firework.particleStream.getParticleData());
      }
    }
    return allParticles;
  }

  /**
   * 获取所有尾焰粒子
   */
  getAllTrailParticles(): TrailParticle[] {
    return this.carrierSystem.getAllTrailParticles();
  }

  /**
   * 获取所有运载器
   */
  getAllCarriers(): CarrierInstance[] {
    return this.carrierSystem.getActiveCarriers();
  }

  // ============================================================================
  // 控制接口
  // ============================================================================

  /**
   * 暂停
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复
   */
  resume(): void {
    this.isPaused = false;
  }

  /**
   * 切换暂停状态
   */
  togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * 设置时间缩放
   */
  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(5, scale));
  }

  /**
   * 获取时间缩放
   */
  getTimeScale(): number {
    return this.timeScale;
  }

  /**
   * 获取全局时间
   */
  getGlobalTime(): number {
    return this.globalTime;
  }

  /**
   * 获取统计信息
   */
  getStats(): {
    activeFireworks: number;
    totalParticles: number;
    trailParticles: number;
    totalLaunched: number;
    totalExtinct: number;
    peakParticles: number;
  } {
    let totalParticles = 0;
    for (const firework of this.fireworks.values()) {
      if (firework.particleStream) {
        totalParticles += firework.particleStream.getParticleCount();
      }
    }
    const carrierStats = this.carrierSystem.getStats();

    return {
      activeFireworks: this.fireworks.size,
      totalParticles,
      trailParticles: carrierStats.trailParticles,
      ...this.stats
    };
  }

  /**
   * 重置系统
   */
  reset(): void {
    for (const firework of this.fireworks.values()) {
      if (firework.particleStream) {
        firework.particleStream.destroy();
      }
    }
    this.fireworks.clear();
    this.carrierSystem.reset();
    this.globalTime = 0;
    this.stats = {
      totalLaunched: 0,
      totalExtinct: 0,
      peakParticles: 0
    };
  }
}

// 导出全局实例
export const globalDirector = new Director({ debug: true });

// END OF FILE: src/core/stream/Director.ts
