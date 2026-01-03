// FILE: src/core/carnival/RandomGenerator.ts
// 嘉年华真随机系统 - 加密级随机数生成 + 智能筛选

import { Shape3DType } from '../shapes/Shape3DFactory';
import { TrajectoryType } from '../trajectories/TrajectoryFactory';
import { ComboType } from '../combos/ComboManager';
import { CarnivalStage, LaunchFormation } from '../../types';

/**
 * 随机模式配置
 */
export interface RandomModeConfig {
  enabled: boolean;
  
  // 阶段数范围
  minStages: number;   // 2-8
  maxStages: number;
  
  // 时间间隔范围
  minDelay: number;    // 0.5-10s
  maxDelay: number;
  
  // 每阶段发射数量范围
  minCount: number;    // 1-20
  maxCount: number;
  
  // 权重配置 (可选)
  weights?: {
    shapes?: Record<Shape3DType, number>;
    trajectories?: Record<TrajectoryType, number>;
    combos?: Record<ComboType, number>;
    formations?: Record<LaunchFormation, number>;
  };
  
  // 排除列表
  excludedShapes?: Shape3DType[];
  excludedTrajectories?: TrajectoryType[];
  excludedCombos?: ComboType[];
}

/**
 * 默认随机配置
 */
export const DEFAULT_RANDOM_CONFIG: RandomModeConfig = {
  enabled: false,
  minStages: 3,
  maxStages: 6,
  minDelay: 500,  // ms
  maxDelay: 2000,
  minCount: 3,
  maxCount: 10,
};

/**
 * 真随机数生成器
 * 使用 Crypto API 提供加密级随机性
 */
export class CryptoRandomGenerator {
  
  /**
   * 生成加密级随机数 (0-1)
   */
  static random(): number {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint32Array(1);
      crypto.getRandomValues(array);
      return array[0] / 0xFFFFFFFF;
    }
    // 回退到 Math.random
    return Math.random();
  }
  
  /**
   * 生成指定范围的随机整数 [min, max]
   */
  static randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }
  
  /**
   * 生成指定范围的随机浮点数 [min, max)
   */
  static randomFloat(min: number, max: number): number {
    return this.random() * (max - min) + min;
  }
  
  /**
   * 从数组中随机选择一个元素
   */
  static randomPick<T>(array: T[]): T {
    if (array.length === 0) throw new Error('Cannot pick from empty array');
    return array[Math.floor(this.random() * array.length)];
  }
  
  /**
   * 带权重的随机选择
   * @param items 项目数组
   * @param weights 对应权重数组 (正数)
   */
  static weightedPick<T>(items: T[], weights: number[]): T {
    if (items.length !== weights.length) throw new Error('Items and weights must have same length');
    
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = this.random() * totalWeight;
    
    for (let i = 0; i < items.length; i++) {
      random -= weights[i];
      if (random <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }
  
  /**
   * 洗牌算法 (Fisher-Yates)
   */
  static shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  
  /**
   * 生成不重复的随机颜色 (HSL)
   */
  static randomHue(): number {
    return Math.floor(this.random() * 360);
  }
  
  /**
   * 生成渐变色相 (确保相邻不会太相似)
   */
  static generateDistinctHues(count: number): number[] {
    const baseHue = this.randomHue();
    const step = 360 / count;
    const hues: number[] = [];
    
    for (let i = 0; i < count; i++) {
      hues.push((baseHue + i * step + this.randomFloat(-10, 10)) % 360);
    }
    
    return this.shuffle(hues);
  }
}

/**
 * 嘉年华随机序列生成器
 */
export class CarnivalRandomSequenceGenerator {
  private config: RandomModeConfig;
  private enabledShapes: Shape3DType[] = [];
  private enabledTrajectories: TrajectoryType[] = [];
  private enabledCombos: ComboType[] = [];
  
  // 历史记录 (用于避免连续相似)
  private lastShape: Shape3DType | null = null;
  private lastTrajectory: TrajectoryType | null = null;
  
  constructor(config: RandomModeConfig) {
    this.config = config;
  }
  
  /**
   * 设置启用的池
   */
  setEnabledPools(
    shapes: Shape3DType[],
    trajectories: TrajectoryType[],
    combos: ComboType[]
  ): void {
    // 应用排除规则
    this.enabledShapes = shapes.filter(s => 
      !this.config.excludedShapes?.includes(s)
    );
    this.enabledTrajectories = trajectories.filter(t => 
      !this.config.excludedTrajectories?.includes(t)
    );
    this.enabledCombos = combos.filter(c => 
      !this.config.excludedCombos?.includes(c)
    );
  }
  
  /**
   * 生成完整的随机嘉年华序列
   */
  generateSequence(): CarnivalStage[] {
    if (!this.config.enabled) return [];
    
    const stageCount = CryptoRandomGenerator.randomInt(
      this.config.minStages,
      this.config.maxStages
    );
    
    const stages: CarnivalStage[] = [];
    
    for (let i = 0; i < stageCount; i++) {
      stages.push(this.generateStage(i, stageCount));
    }
    
    return stages;
  }
  
  /**
   * 生成单个阶段
   */
  private generateStage(index: number, total: number): CarnivalStage {
    const isOpeningOrFinale = index === 0 || index === total - 1;
    
    // 选择形状 (避免与上一个相同)
    let shape = this.pickShape();
    let attempts = 0;
    while (shape === this.lastShape && attempts < 3) {
      shape = this.pickShape();
      attempts++;
    }
    this.lastShape = shape;
    
    // 选择轨迹 (避免与上一个相同)
    let trajectory = this.pickTrajectory();
    attempts = 0;
    while (trajectory === this.lastTrajectory && attempts < 3) {
      trajectory = this.pickTrajectory();
      attempts++;
    }
    this.lastTrajectory = trajectory;
    
    // 选择组合技
    const combo = this.pickCombo();
    
    // 选择队形
    const formation = this.pickFormation();
    
    // 发射数量 (开场和结尾更多)
    let count = CryptoRandomGenerator.randomInt(
      this.config.minCount,
      this.config.maxCount
    );
    if (isOpeningOrFinale) {
      count = Math.min(count * 2, 20);
    }
    
    // 延迟
    const delay = index === 0 
      ? 0 
      : CryptoRandomGenerator.randomInt(this.config.minDelay, this.config.maxDelay);
    
    // 阶段名称
    const stageNames = [
      '序章', '启航', '绽放', '高潮', '涟漪', 
      '升华', '转折', '压轴', '终章'
    ];
    const name = index === 0 
      ? '序幕' 
      : index === total - 1 
        ? '终章' 
        : stageNames[CryptoRandomGenerator.randomInt(1, stageNames.length - 2)];
    
    return {
      id: `random_stage_${index}`,
      name: `${name} #${index + 1}`,
      shape,
      trajectory,
      combo,
      formation,
      count,
      delay,
      interval: CryptoRandomGenerator.randomInt(50, 200),
      duration: CryptoRandomGenerator.randomFloat(2, 5),
    };
  }
  
  private pickShape(): Shape3DType {
    if (this.enabledShapes.length === 0) return Shape3DType.SPHERE;
    
    if (this.config.weights?.shapes) {
      const shapes = this.enabledShapes;
      const weights = shapes.map(s => this.config.weights!.shapes![s] || 1);
      return CryptoRandomGenerator.weightedPick(shapes, weights);
    }
    
    return CryptoRandomGenerator.randomPick(this.enabledShapes);
  }
  
  private pickTrajectory(): TrajectoryType {
    if (this.enabledTrajectories.length === 0) return TrajectoryType.LINEAR;
    
    if (this.config.weights?.trajectories) {
      const trajs = this.enabledTrajectories;
      const weights = trajs.map(t => this.config.weights!.trajectories![t] || 1);
      return CryptoRandomGenerator.weightedPick(trajs, weights);
    }
    
    return CryptoRandomGenerator.randomPick(this.enabledTrajectories);
  }
  
  private pickCombo(): ComboType {
    if (this.enabledCombos.length === 0) return ComboType.SINGLE;
    return CryptoRandomGenerator.randomPick(this.enabledCombos);
  }
  
  private pickFormation(): LaunchFormation {
    const formations = Object.values(LaunchFormation);
    
    if (this.config.weights?.formations) {
      const weights = formations.map(f => this.config.weights!.formations![f] || 1);
      return CryptoRandomGenerator.weightedPick(formations, weights);
    }
    
    return CryptoRandomGenerator.randomPick(formations);
  }
  
  /**
   * 预览模式：生成但不显示具体内容
   */
  previewSequence(): { stageCount: number; estimatedDuration: number } {
    const seq = this.generateSequence();
    const totalDelay = seq.reduce((sum, s) => sum + s.delay, 0);
    const avgDuration = seq.reduce((sum, s) => sum + (s.duration || 3), 0) / seq.length;
    
    return {
      stageCount: seq.length,
      estimatedDuration: totalDelay + avgDuration * seq.length
    };
  }
}

// END OF FILE: src/core/carnival/RandomGenerator.ts
