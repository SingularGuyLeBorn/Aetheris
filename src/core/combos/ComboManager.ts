// FILE: src/core/combos/ComboManager.ts
// 组合技系统：定义多阶段爆炸和复杂特效组合

import { Shape3DType } from '../shapes/Shape3DFactory';
import { TrajectoryType } from '../trajectories/TrajectoryFactory';

/**
 * 组合技类型
 */
export enum ComboType {
  // === 经典组合 ===
  SINGLE = 'single',                    // 单次爆炸（默认）
  STAGED = 'staged',                    // 子母连爆（2-3阶段）
  DELAYED_BURST = 'delayed_burst',      // 延迟爆发
  MULTI_WAVE = 'multi_wave',            // 多波次扩散
  
  // === 形变组合 ===
  MORPH = 'morph',                      // 形态变化（球->心等）
  SPLIT = 'split',                      // 分裂效果
  CONVERGE = 'converge',                // 汇聚效果
  EXPAND_CONTRACT = 'expand_contract',  // 扩张收缩
  
  // === 特效组合 ===
  TRAIL_EXPLOSION = 'trail_explosion',  // 尾迹爆炸
  RAIN_DOWN = 'rain_down',              // 雨落效果
  SPIRAL_SCATTER = 'spiral_scatter',    // 螺旋散射
  PHOENIX_RISE = 'phoenix_rise',        // 凤凰重生
  
  // === 高级组合 ===
  CASCADE_CHAIN = 'cascade_chain',      // 连锁瀑布
  GALAXY_BIRTH = 'galaxy_birth',        // 银河诞生
  SUPERNOVA_COLLAPSE = 'supernova_collapse', // 超新星塌缩
  FIREWORK_SYMPHONY = 'firework_symphony', // 烟花交响曲
}

/**
 * 组合技信息
 */
export interface ComboInfo {
  name: string;
  icon: string;
  description: string;
  stages: number;
  duration: number; // 总持续时间(秒)
}

/**
 * 组合技信息映射
 */
export const COMBO_INFO: Record<ComboType, ComboInfo> = {
  [ComboType.SINGLE]: { name: '单次爆炸', icon: '💥', description: '经典单次炸开', stages: 1, duration: 0 },
  [ComboType.STAGED]: { name: '子母连爆', icon: '🎆', description: '先炸开再二次爆炸', stages: 2, duration: 0.8 },
  [ComboType.DELAYED_BURST]: { name: '延迟爆发', icon: '⏱️', description: '悬停后突然炸开', stages: 2, duration: 1.2 },
  [ComboType.MULTI_WAVE]: { name: '多波扩散', icon: '〰️', description: '三波依次扩散', stages: 3, duration: 1.5 },
  
  [ComboType.MORPH]: { name: '形态变化', icon: '🔄', description: '球形变心形', stages: 2, duration: 1.0 },
  [ComboType.SPLIT]: { name: '分裂效果', icon: '✂️', description: '一分为多', stages: 2, duration: 0.6 },
  [ComboType.CONVERGE]: { name: '汇聚效果', icon: '🎯', description: '四散后汇聚', stages: 2, duration: 1.5 },
  [ComboType.EXPAND_CONTRACT]: { name: '呼吸脉动', icon: '💓', description: '扩张再收缩', stages: 3, duration: 2.0 },
  
  [ComboType.TRAIL_EXPLOSION]: { name: '尾迹爆炸', icon: '☄️', description: '轨迹上连续小爆炸', stages: 5, duration: 1.0 },
  [ComboType.RAIN_DOWN]: { name: '雨落效果', icon: '🌧️', description: '炸开后如雨下落', stages: 2, duration: 2.0 },
  [ComboType.SPIRAL_SCATTER]: { name: '螺旋散射', icon: '🌀', description: '螺旋飞出', stages: 1, duration: 0.5 },
  [ComboType.PHOENIX_RISE]: { name: '凤凰涅槃', icon: '🔥', description: '下落后重新升起', stages: 3, duration: 3.0 },
  
  [ComboType.CASCADE_CHAIN]: { name: '连锁瀑布', icon: '🌊', description: '层层下落', stages: 5, duration: 2.5 },
  [ComboType.GALAXY_BIRTH]: { name: '银河诞生', icon: '🌌', description: '从点到银河', stages: 4, duration: 3.0 },
  [ComboType.SUPERNOVA_COLLAPSE]: { name: '超新星塌缩', icon: '💫', description: '爆炸后塌缩', stages: 3, duration: 2.0 },
  [ComboType.FIREWORK_SYMPHONY]: { name: '烟花交响', icon: '🎵', description: '多种效果协奏', stages: 6, duration: 4.0 },
};

/**
 * 阶段配置
 */
export interface StageConfig {
  delay: number;          // 延迟时间(秒)
  shape: Shape3DType;     // 形状
  scale: number;          // 缩放
  particleCount: number;  // 粒子数量倍率
  hueShift: number;       // 色相偏移
  behavior?: string;      // 粒子行为
  velocityScale?: number; // 速度缩放
  gravity?: number;       // 重力覆盖
  decay?: number;         // 衰减覆盖
  spawnOffset?: { x: number; y: number; z: number }; // 生成位置偏移
}

/**
 * 组合技配置
 */
export interface ComboConfig {
  type: ComboType;
  trajectory: TrajectoryType;
  stages: StageConfig[];
}

/**
 * 组合技生成器
 */
export class ComboGenerator {
  /**
   * 生成组合技配置
   */
  static generate(type: ComboType, baseShape: Shape3DType = Shape3DType.SPHERE): ComboConfig {
    const stages: StageConfig[] = [];
    let trajectory = TrajectoryType.LINEAR;
    
    switch (type) {
      case ComboType.SINGLE:
        stages.push({
          delay: 0,
          shape: baseShape,
          scale: 1,
          particleCount: 1,
          hueShift: 0
        });
        break;
        
      case ComboType.STAGED:
        // 第一阶段：小爆炸
        stages.push({
          delay: 0,
          shape: Shape3DType.SPHERE,
          scale: 0.5,
          particleCount: 0.3,
          hueShift: 0,
          decay: 0.05
        });
        // 第二阶段：主爆炸
        stages.push({
          delay: 0.8,
          shape: baseShape,
          scale: 1.2,
          particleCount: 1,
          hueShift: 60
        });
        break;
        
      case ComboType.DELAYED_BURST:
        // 第一阶段：悬停闪烁
        stages.push({
          delay: 0,
          shape: Shape3DType.SPARKLE_CLOUD,
          scale: 0.3,
          particleCount: 0.2,
          hueShift: 0,
          behavior: 'glitter',
          velocityScale: 0.1
        });
        // 第二阶段：突然爆发
        stages.push({
          delay: 1.2,
          shape: baseShape,
          scale: 1.5,
          particleCount: 1.2,
          hueShift: 0,
          velocityScale: 1.4 // 增加爆发力
        });
        break;
        
      case ComboType.MULTI_WAVE:
        // 三波扩散
        for (let i = 0; i < 3; i++) {
          stages.push({
            delay: i * 0.5,
            shape: Shape3DType.RING_WAVE,
            scale: 0.8 + i * 0.3,
            particleCount: 0.5,
            hueShift: i * 40
          });
        }
        break;
        
      case ComboType.MORPH:
        // 球形
        stages.push({
          delay: 0,
          shape: Shape3DType.SPHERE,
          scale: 0.8,
          particleCount: 0.5,
          hueShift: 0,
          decay: 0.03
        });
        // 变心形
        stages.push({
          delay: 1.0,
          shape: Shape3DType.HEART_3D,
          scale: 1.2,
          particleCount: 1,
          hueShift: 330 // 粉红
        });
        break;
        
      case ComboType.SPLIT:
        // 主体
        stages.push({
          delay: 0,
          shape: Shape3DType.SPHERE,
          scale: 0.6,
          particleCount: 0.3,
          hueShift: 0
        });
        // 四个分裂点
        const splitOffsets = [
          { x: 40, y: 0, z: 0 },
          { x: -40, y: 0, z: 0 },
          { x: 0, y: 0, z: 40 },
          { x: 0, y: 0, z: -40 }
        ];
        for (const offset of splitOffsets) {
          stages.push({
            delay: 0.6,
            shape: baseShape,
            scale: 0.5,
            particleCount: 0.3,
            hueShift: Math.random() * 60,
            spawnOffset: offset
          });
        }
        break;
        
      case ComboType.TRAIL_EXPLOSION:
        // 沿轨迹的小爆炸
        for (let i = 0; i < 5; i++) {
          stages.push({
            delay: i * 0.2,
            shape: Shape3DType.EXPLOSION_BURST,
            scale: 0.4,
            particleCount: 0.2,
            hueShift: i * 30,
            spawnOffset: { x: 0, y: -i * 30, z: 0 }
          });
        }
        trajectory = TrajectoryType.LINEAR;
        break;
        
      case ComboType.RAIN_DOWN:
        // 爆炸
        stages.push({
          delay: 0,
          shape: baseShape,
          scale: 1,
          particleCount: 1,
          hueShift: 0
        });
        // 雨落
        stages.push({
          delay: 0.8,
          shape: Shape3DType.CASCADE,
          scale: 1.5,
          particleCount: 0.8,
          hueShift: 30,
          behavior: 'falling',
          gravity: 0.15
        });
        break;
        
      case ComboType.SPIRAL_SCATTER:
        stages.push({
          delay: 0,
          shape: Shape3DType.VORTEX,
          scale: 1.2,
          particleCount: 1,
          hueShift: 0
        });
        trajectory = TrajectoryType.SPIRAL;
        break;
        
      case ComboType.PHOENIX_RISE:
        // 下落火焰
        stages.push({
          delay: 0,
          shape: Shape3DType.FIREWORK_WILLOW,
          scale: 0.8,
          particleCount: 0.5,
          hueShift: 30,
          gravity: 0.2
        });
        // 底部汇聚
        stages.push({
          delay: 1.5,
          shape: Shape3DType.VORTEX,
          scale: 0.5,
          particleCount: 0.3,
          hueShift: 15,
          spawnOffset: { x: 0, y: -80, z: 0 }
        });
        // 凤凰升起
        stages.push({
          delay: 3.0,
          shape: Shape3DType.PHOENIX,
          scale: 1.5,
          particleCount: 1.2,
          hueShift: 0,
          velocityScale: 1.8, // 进一步增加升腾动力
          spawnOffset: { x: 0, y: -80, z: 0 }
        });
        trajectory = TrajectoryType.FALL_RISE;
        break;
        
      case ComboType.CASCADE_CHAIN:
        for (let i = 0; i < 5; i++) {
          stages.push({
            delay: i * 0.5,
            shape: Shape3DType.RING_WAVE,
            scale: 1 - i * 0.15,
            particleCount: 0.4,
            hueShift: i * 20,
            spawnOffset: { x: 0, y: -i * 25, z: 0 }
          });
        }
        break;
        
      case ComboType.GALAXY_BIRTH:
        // 中心闪光
        stages.push({
          delay: 0,
          shape: Shape3DType.EXPLOSION_BURST,
          scale: 0.3,
          particleCount: 0.2,
          hueShift: 0,
          behavior: 'glitter'
        });
        // 扩散
        stages.push({
          delay: 0.8,
          shape: Shape3DType.NEBULA,
          scale: 0.6,
          particleCount: 0.4,
          hueShift: 200
        });
        // 旋臂形成
        stages.push({
          delay: 1.8,
          shape: Shape3DType.GALAXY_SPIRAL,
          scale: 1,
          particleCount: 0.8,
          hueShift: 240
        });
        // 完整银河
        stages.push({
          delay: 3.0,
          shape: Shape3DType.GALAXY_SPIRAL,
          scale: 1.5,
          particleCount: 1,
          hueShift: 260,
          velocityScale: 1.2 // 增加过渡动感
        });
        break;
        
      case ComboType.SUPERNOVA_COLLAPSE:
        // 爆发
        stages.push({
          delay: 0,
          shape: Shape3DType.SUPERNOVA,
          scale: 1.5,
          particleCount: 1.2,
          hueShift: 30
        });
        // 扩散
        stages.push({
          delay: 0.8,
          shape: Shape3DType.SHOCKWAVE,
          scale: 2,
          particleCount: 0.5,
          hueShift: 200
        });
        // 塌缩成点
        stages.push({
          delay: 2.0,
          shape: Shape3DType.BLACK_HOLE,
          scale: 0.3,
          particleCount: 0.3,
          hueShift: 270,
          velocityScale: -0.5 // 向内
        });
        break;
        
      case ComboType.FIREWORK_SYMPHONY:
        const symphonyShapes = [
          Shape3DType.SPHERE,
          Shape3DType.RING_WAVE,
          Shape3DType.HEART_3D,
          Shape3DType.STAR_3D,
          Shape3DType.FLOWER_3D,
          Shape3DType.EXPLOSION_BURST
        ];
        for (let i = 0; i < symphonyShapes.length; i++) {
          stages.push({
            delay: i * 0.6,
            shape: symphonyShapes[i],
            scale: 0.7 + Math.random() * 0.4,
            particleCount: 0.5,
            hueShift: (i / symphonyShapes.length) * 360
          });
        }
        trajectory = TrajectoryType.SPIRAL;
        break;
        
      default:
        stages.push({
          delay: 0,
          shape: baseShape,
          scale: 1,
          particleCount: 1,
          hueShift: 0
        });
    }
    
    return { type, trajectory, stages };
  }
}

/**
 * 组合技管理器
 */
export class ComboManager {
  private static allTypes: ComboType[] = Object.values(ComboType);
  
  /**
   * 获取所有组合技类型
   */
  static getAllTypes(): ComboType[] {
    return [...this.allTypes];
  }
  
  /**
   * 随机获取一个组合技类型
   */
  static getRandomType(): ComboType {
    return this.allTypes[Math.floor(Math.random() * this.allTypes.length)];
  }
  
  /**
   * 获取组合技信息
   */
  static getInfo(type: ComboType): ComboInfo {
    return COMBO_INFO[type];
  }
  
  /**
   * 生成组合技配置
   */
  static generateConfig(type: ComboType, baseShape?: Shape3DType): ComboConfig {
    return ComboGenerator.generate(type, baseShape);
  }
  
  /**
   * 获取简单组合技（适合自动发射）
   */
  static getSimpleTypes(): ComboType[] {
    return [
      ComboType.SINGLE,
      ComboType.STAGED,
      ComboType.MULTI_WAVE,
      ComboType.SPLIT
    ];
  }
  
  /**
   * 获取高级组合技（适合手动触发）
   */
  static getAdvancedTypes(): ComboType[] {
    return [
      ComboType.PHOENIX_RISE,
      ComboType.GALAXY_BIRTH,
      ComboType.SUPERNOVA_COLLAPSE,
      ComboType.FIREWORK_SYMPHONY
    ];
  }
}

// END OF FILE: src/core/combos/ComboManager.ts
