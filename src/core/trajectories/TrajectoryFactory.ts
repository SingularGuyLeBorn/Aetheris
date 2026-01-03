// FILE: src/core/trajectories/TrajectoryFactory.ts
// 轨迹工厂：定义10+种烟花上升轨迹

import { Vector3 } from '../Vector3';

/**
 * 轨迹类型枚举
 * 定义各种上升方式
 */
export enum TrajectoryType {
  // === 基础轨迹 ===
  LINEAR = 'linear',                     // 直线上升
  SPIRAL = 'spiral',                     // 螺旋盘旋
  ZIGZAG = 'zigzag',                     // S型摇摆
  
  // === 加速类 ===
  ACCELERATE = 'accelerate',             // 单次加速
  DOUBLE_ACCELERATE = 'double_accelerate', // 二次加速
  TRIPLE_ACCELERATE = 'triple_accelerate', // 三次加速
  DECELERATE = 'decelerate',             // 减速
  MIXED_SPEED = 'mixed_speed',           // 混合变速
  
  // === 曲线类 ===
  BEZIER_CURVE = 'bezier_curve',         // 贝塞尔曲线
  PARABOLA = 'parabola',                 // 抛物线
  SINE_WAVE = 'sine_wave',               // 正弦波
  HELIX = 'helix',                       // 螺旋线
  
  // === 组合类 ===
  LINEAR_TO_CURVE = 'linear_to_curve',   // 直线变曲线
  CURVE_TO_LINEAR = 'curve_to_linear',   // 曲线变直线
  MULTI_SEGMENT = 'multi_segment',       // 多段轨迹
  
  // === 特殊类 ===
  WOBBLE = 'wobble',                     // 随机扰动
  FALL_RISE = 'fall_rise',               // 先落后升
  ORBIT = 'orbit',                       // 绕圈上升
}

/**
 * 轨迹显示信息
 */
export const TRAJECTORY_INFO: Record<TrajectoryType, { name: string; icon: string; description: string }> = {
  [TrajectoryType.LINEAR]: { name: '直线升空', icon: '⬆️', description: '笔直向上飞行' },
  [TrajectoryType.SPIRAL]: { name: '螺旋盘旋', icon: '🌀', description: '旋转上升如龙卷风' },
  [TrajectoryType.ZIGZAG]: { name: 'S型摇摆', icon: '〰️', description: '左右摆动上升' },
  
  [TrajectoryType.ACCELERATE]: { name: '极速推进', icon: '🚀', description: '中途突然加速' },
  [TrajectoryType.DOUBLE_ACCELERATE]: { name: '二次加速', icon: '⚡⚡', description: '两次爆发加速' },
  [TrajectoryType.TRIPLE_ACCELERATE]: { name: '三次加速', icon: '⚡⚡⚡', description: '三级火箭推进' },
  [TrajectoryType.DECELERATE]: { name: '渐行渐缓', icon: '🐢', description: '越来越慢然后爆炸' },
  [TrajectoryType.MIXED_SPEED]: { name: '混合变速', icon: '🎢', description: '加速减速交替' },
  
  [TrajectoryType.BEZIER_CURVE]: { name: '贝塞尔曲线', icon: '📐', description: '平滑弧线轨迹' },
  [TrajectoryType.PARABOLA]: { name: '抛物线', icon: '🏹', description: '斜抛+上升' },
  [TrajectoryType.SINE_WAVE]: { name: '正弦波', icon: '📊', description: '正弦波动上升' },
  [TrajectoryType.HELIX]: { name: '3D螺旋', icon: '🧬', description: 'DNA双螺旋上升' },
  
  [TrajectoryType.LINEAR_TO_CURVE]: { name: '直后弯', icon: '↗️', description: '直线后转弯' },
  [TrajectoryType.CURVE_TO_LINEAR]: { name: '弯后直', icon: '↖️', description: '弯曲后变直' },
  [TrajectoryType.MULTI_SEGMENT]: { name: '多段折线', icon: '📈', description: '多点转折' },
  
  [TrajectoryType.WOBBLE]: { name: '随机扰动', icon: '🫨', description: '不规则抖动' },
  [TrajectoryType.FALL_RISE]: { name: '先落后起', icon: '⤵️', description: '先下坠再急升' },
  [TrajectoryType.ORBIT]: { name: '绕圈上升', icon: '🔄', description: '围绕中心螺旋' },
};

/**
 * 轨迹状态
 */
export interface TrajectoryState {
  lifeTime: number;
  phase: number;        // 当前阶段(0-1)
  segmentIndex: number; // 多段轨迹段索引
}

/**
 * 轨迹计算器
 * 根据轨迹类型计算速度修正
 */
export class TrajectoryCalculator {
  private type: TrajectoryType;
  private state: TrajectoryState;
  
  // 轨迹参数
  private spiralFrequency: number = 10;
  private spiralAmplitude: number = 0.6;
  private waveFrequency: number = 8;
  private waveAmplitude: number = 0.8;
  
  constructor(type: TrajectoryType) {
    this.type = type;
    this.state = {
      lifeTime: 0,
      phase: 0,
      segmentIndex: 0
    };
  }
  
  /**
   * 计算当前帧的速度修正
   * @param velocity 当前速度
   * @param gravity 重力系数
   * @param deltaTime 时间增量
   * @returns 修正后的速度
   */
  calculate(
    velocity: Vector3,
    gravity: number,
    deltaTime: number
  ): Vector3 {
    const dt = deltaTime * 60;
    this.state.lifeTime += deltaTime;
    const t = this.state.lifeTime;
    
    const result = velocity.clone();
    
    // 缩放系数：防止水平力过大导致无法升空
    // 原来的系数 (0.3-0.6) 太大，相当于每帧增加巨大速度，导致瞬间平移
    // 调整为 0.02 - 0.05 级别，配合 gravity (~0.005)
    
    switch (this.type) {
      // === 基础轨迹 ===
      case TrajectoryType.LINEAR:
        result.y -= gravity * 1.5 * dt;
        break;
        
      case TrajectoryType.SPIRAL: {
        const angle = t * this.spiralFrequency;
        // 修正：增加 * dt，且大幅减小幅度
        result.x += Math.cos(angle) * 0.04 * dt;
        result.z += Math.sin(angle) * 0.04 * dt;
        result.y -= gravity * 1.5 * dt;
        break;
      }
      
      case TrajectoryType.ZIGZAG: {
        result.x += Math.cos(t * this.waveFrequency) * 0.05 * dt;
        result.y -= gravity * 1.5 * dt;
        break;
      }
      
      // === 加速类 ===
      case TrajectoryType.ACCELERATE:
        // 减小加速幅度，更符合物理惯性
        if (t < 0.5) result.y -= gravity * 1.5 * dt;
        else if (t < 1.0) result.y += 0.08 * dt; // 原 0.3
        else result.y -= gravity * 2.0 * dt;
        break;
        
      case TrajectoryType.DOUBLE_ACCELERATE:
        if (t < 0.3) result.y -= gravity * 1.2 * dt;
        else if (t < 0.5) result.y += 0.1 * dt;  
        else if (t < 0.8) result.y -= gravity * 1.0 * dt;
        else if (t < 1.0) result.y += 0.15 * dt;  
        else result.y -= gravity * 2.0 * dt;
        break;
        
      case TrajectoryType.TRIPLE_ACCELERATE:
        if (t < 0.2) result.y -= gravity * 1.0 * dt;
        else if (t < 0.3) result.y += 0.1 * dt;  
        else if (t < 0.5) result.y -= gravity * 0.8 * dt;
        else if (t < 0.6) result.y += 0.12 * dt; 
        else if (t < 0.8) result.y -= gravity * 0.6 * dt;
        else if (t < 0.9) result.y += 0.15 * dt; 
        else result.y -= gravity * 2.0 * dt;
        break;
        
      case TrajectoryType.DECELERATE: {
        const decel = Math.max(0.9, 1 - t * 0.1); // 减缓阻尼
        result.y -= gravity * 1.5 * dt;
        result.x *= decel;
        result.z *= decel;
        break;
      }
      
      case TrajectoryType.MIXED_SPEED: {
        const cycle = Math.sin(t * 4) * 0.5 + 0.5;
        result.y -= gravity * (0.8 + cycle * 0.8) * dt;
        if (cycle > 0.7) result.y += 0.05 * dt;
        break;
      }
      
      // === 曲线类 ===
      case TrajectoryType.BEZIER_CURVE: {
        const bezierT = Math.min(1, t / 2);
        const curveOffset = Math.sin(bezierT * Math.PI) * 2;
        result.x += curveOffset * 0.02 * dt; 
        result.y -= gravity * 1.5 * dt;
        break;
      }
      
      case TrajectoryType.PARABOLA: {
        const paraT = Math.min(1, t / 1.5);
        result.x += (1 - paraT) * 0.05 * dt;
        result.y -= gravity * 1.5 * dt;
        break;
      }
      
      case TrajectoryType.SINE_WAVE: {
        const sinOffset = Math.sin(t * 6) * 1.5;
        result.x += sinOffset * 0.03 * dt;
        result.z += Math.cos(t * 6) * 0.8 * 0.03 * dt;
        result.y -= gravity * 1.5 * dt;
        break;
      }
      
      case TrajectoryType.HELIX: {
        const helixAngle = t * 8;
        const helixRadius = 0.4 + t * 0.1;
        result.x += Math.cos(helixAngle) * helixRadius * 0.1 * dt; // 原乘数 implicit 1.0
        result.z += Math.sin(helixAngle) * helixRadius * 0.1 * dt;
        result.y -= gravity * 1.2 * dt;
        break;
      }
      
      // === 组合类 ===
      case TrajectoryType.LINEAR_TO_CURVE:
        if (t < 1.0) {
          result.y -= gravity * 1.5 * dt;
        } else {
          const curveAngle = (t - 1.0) * 5;
          result.x += Math.sin(curveAngle) * 0.06 * dt;
          result.z += Math.cos(curveAngle) * 0.04 * dt;
          result.y -= gravity * 1.8 * dt;
        }
        break;
        
      case TrajectoryType.CURVE_TO_LINEAR:
        if (t < 1.0) {
          const curveAngle = t * 5;
          result.x += Math.sin(curveAngle) * 0.06 * dt;
          result.z += Math.cos(curveAngle) * 0.04 * dt;
          result.y -= gravity * 1.2 * dt;
        } else {
          result.y -= gravity * 1.5 * dt;
        }
        break;
        
      case TrajectoryType.MULTI_SEGMENT: {
        const segment = Math.floor(t / 0.5);
        const angles = [0, Math.PI/4, -Math.PI/4, Math.PI/2, 0];
        const idx = Math.min(segment, angles.length - 1);
        result.x += Math.sin(angles[idx]) * 0.06 * dt; // 原 0.3
        result.z += Math.cos(angles[idx]) * 0.04 * dt;
        result.y -= gravity * 1.5 * dt;
        break;
      }
      
      // === 特殊类 ===
      case TrajectoryType.WOBBLE:
        result.x += (Math.random() - 0.5) * 0.1 * dt; // 原 1.0
        result.z += (Math.random() - 0.5) * 0.1 * dt;
        result.y -= gravity * 1.5 * dt;
        break;
        
      case TrajectoryType.FALL_RISE:
        if (t < 0.3) {
          result.y -= gravity * 2.5 * dt; 
        } else if (t < 0.6) {
          result.y += 0.2 * dt; // 原 0.8
        } else {
          result.y -= gravity * 1.5 * dt;
        }
        break;
        
      case TrajectoryType.ORBIT: {
        const orbitAngle = t * 6;
        const orbitRadius = 0.6;
        result.x = Math.cos(orbitAngle) * orbitRadius * 0.05 * dt;
        result.z = Math.sin(orbitAngle) * orbitRadius * 0.05 * dt;
        result.y -= gravity * 1.3 * dt;
        break;
      }
      
      default:
        result.y -= gravity * 1.5 * dt;
    }
    
    return result;
  }
  
  /**
   * 获取轨迹类型
   */
  getType(): TrajectoryType {
    return this.type;
  }
  
  /**
   * 获取当前运行时间
   */
  getLifeTime(): number {
    return this.state.lifeTime;
  }
}

/**
 * 轨迹工厂
 * 创建和管理轨迹计算器
 */
export class TrajectoryFactory {
  private static allTypes: TrajectoryType[] = Object.values(TrajectoryType);
  
  /**
   * 创建指定类型的轨迹计算器
   */
  static create(type: TrajectoryType): TrajectoryCalculator {
    return new TrajectoryCalculator(type);
  }
  
  /**
   * 创建随机类型的轨迹计算器
   */
  static createRandom(): TrajectoryCalculator {
    const randomType = this.allTypes[Math.floor(Math.random() * this.allTypes.length)];
    return new TrajectoryCalculator(randomType);
  }
  
  /**
   * 从给定列表中随机创建
   */
  static createFromList(types: TrajectoryType[]): TrajectoryCalculator {
    if (types.length === 0) return this.create(TrajectoryType.LINEAR);
    const randomType = types[Math.floor(Math.random() * types.length)];
    return new TrajectoryCalculator(randomType);
  }
  
  /**
   * 获取所有轨迹类型
   */
  static getAllTypes(): TrajectoryType[] {
    return [...this.allTypes];
  }
  
  /**
   * 获取轨迹信息
   */
  static getInfo(type: TrajectoryType): { name: string; icon: string; description: string } {
    return TRAJECTORY_INFO[type];
  }
}

// END OF FILE: src/core/trajectories/TrajectoryFactory.ts
