// FILE: src/core/trajectories/TrajectoryConfig.ts
// 轨迹配置系统 - 扩展参数和预设模板

import { TrajectoryType } from './TrajectoryFactory';

/**
 * 加速度模式
 */
export enum AccelerationMode {
  CONSTANT = 'constant',       // 恒定加速度
  INCREASING = 'increasing',   // 渐增
  DECREASING = 'decreasing',   // 渐减
  SINUSOIDAL = 'sinusoidal',   // 正弦变化
  RANDOM = 'random',           // 随机
}

/**
 * 颜色渐变模式
 */
export enum ColorGradientMode {
  NONE = 'none',               // 单色
  LINEAR = 'linear',           // 线性渐变
  RAINBOW = 'rainbow',         // 彩虹渐变
  FIRE = 'fire',               // 火焰色
  ICE = 'ice',                 // 冰蓝色
  GOLD = 'gold',               // 金色
  CUSTOM = 'custom',           // 自定义
}

/**
 * 轨迹完整配置
 */
export interface TrajectoryConfig {
  // 基础类型
  type: TrajectoryType;
  
  // === 发射控制 ===
  launchRadius: number;        // 发射范围半径 (0-100m)
  launchCount: number;         // 发射次数 (1-100)
  launchInterval: number;      // 发射间隔 (0.1-5s)
  
  // === 轨迹控制 ===
  accelerationMode: AccelerationMode;
  rotationAngle: number;       // 旋转角度 (0-360°)
  waveAmplitude: number;       // 波动幅度 (0-50m)
  waveFrequency: number;       // 波动频率 (0.1-10)
  spiralRadius: number;        // 螺旋半径 (0-30m)
  spiralSpeed: number;         // 螺旋速度 (0.1-20)
  
  // === 物理参数 ===
  initialSpeed: number;        // 初始速度 (1-50)
  maxSpeed: number;            // 最大速度 (1-100)
  gravityMultiplier: number;   // 重力系数 (0-3)
  dragCoefficient: number;     // 阻力系数 (0-1)
  
  // === 视觉参数 ===
  trailWidth: number;          // 轨迹宽度 (0.1-5m)
  trailLength: number;         // 拖尾长度 (1-50)
  colorGradient: ColorGradientMode;
  primaryHue: number;          // 主色调 (0-360)
  secondaryHue: number;        // 副色调 (0-360)
  glowIntensity: number;       // 发光强度 (0-5)
  particleDensity: number;     // 粒子密度 (0.1-3)
}

/**
 * 轨迹配置默认值
 */
export const DEFAULT_TRAJECTORY_CONFIG: TrajectoryConfig = {
  type: TrajectoryType.LINEAR,
  
  // 发射控制
  launchRadius: 10,
  launchCount: 1,
  launchInterval: 0.5,
  
  // 轨迹控制
  accelerationMode: AccelerationMode.CONSTANT,
  rotationAngle: 0,
  waveAmplitude: 0,
  waveFrequency: 1,
  spiralRadius: 5,
  spiralSpeed: 8,
  
  // 物理参数
  initialSpeed: 15,
  maxSpeed: 30,
  gravityMultiplier: 1,
  dragCoefficient: 0.02,
  
  // 视觉参数
  trailWidth: 1,
  trailLength: 20,
  colorGradient: ColorGradientMode.LINEAR,
  primaryHue: 45,
  secondaryHue: 60,
  glowIntensity: 1.5,
  particleDensity: 1,
};

/**
 * 预设模板
 */
export interface TrajectoryPreset {
  id: string;
  name: string;
  icon: string;
  description: string;
  config: Partial<TrajectoryConfig>;
}

/**
 * 内置预设模板
 */
export const TRAJECTORY_PRESETS: TrajectoryPreset[] = [
  // === 经典轨迹 ===
  {
    id: 'classic_straight',
    name: '经典直线',
    icon: '⬆️',
    description: '笔直向上的经典烟花',
    config: {
      type: TrajectoryType.LINEAR,
      accelerationMode: AccelerationMode.CONSTANT,
      colorGradient: ColorGradientMode.FIRE,
    }
  },
  {
    id: 'golden_spiral',
    name: '黄金螺旋',
    icon: '🌀',
    description: '优雅的螺旋上升',
    config: {
      type: TrajectoryType.SPIRAL,
      spiralRadius: 12,
      spiralSpeed: 10,
      colorGradient: ColorGradientMode.GOLD,
      primaryHue: 45,
    }
  },
  {
    id: 'dragon_wave',
    name: '龙舞波浪',
    icon: '🐉',
    description: '如龙蛇蜿蜒的S型轨迹',
    config: {
      type: TrajectoryType.ZIGZAG,
      waveAmplitude: 25,
      waveFrequency: 4,
      colorGradient: ColorGradientMode.RAINBOW,
    }
  },
  {
    id: 'rocket_boost',
    name: '火箭推进',
    icon: '🚀',
    description: '多级加速的火箭效果',
    config: {
      type: TrajectoryType.TRIPLE_ACCELERATE,
      accelerationMode: AccelerationMode.INCREASING,
      colorGradient: ColorGradientMode.FIRE,
      glowIntensity: 3,
      trailWidth: 2,
    }
  },
  {
    id: 'phoenix_rise',
    name: '凤凰涅槃',
    icon: '🔥',
    description: '先下坠后急升的戏剧性轨迹',
    config: {
      type: TrajectoryType.FALL_RISE,
      colorGradient: ColorGradientMode.FIRE,
      primaryHue: 15,
      secondaryHue: 45,
      glowIntensity: 4,
    }
  },
  {
    id: 'dna_helix',
    name: 'DNA双螺旋',
    icon: '🧬',
    description: '生命的密码',
    config: {
      type: TrajectoryType.HELIX,
      spiralRadius: 8,
      spiralSpeed: 12,
      colorGradient: ColorGradientMode.ICE,
      primaryHue: 180,
    }
  },
  
  // === 高级组合 ===
  {
    id: 'chaos_wobble',
    name: '混沌扰动',
    icon: '🌪️',
    description: '不可预测的随机路径',
    config: {
      type: TrajectoryType.WOBBLE,
      waveAmplitude: 15,
      colorGradient: ColorGradientMode.RAINBOW,
    }
  },
  {
    id: 'orbit_dance',
    name: '轨道之舞',
    icon: '🪐',
    description: '围绕中心旋转上升',
    config: {
      type: TrajectoryType.ORBIT,
      spiralRadius: 15,
      colorGradient: ColorGradientMode.ICE,
    }
  },
];

/**
 * 轨迹配置管理器
 */
export class TrajectoryConfigManager {
  private configs: Map<string, TrajectoryConfig> = new Map();
  private presets: TrajectoryPreset[] = [...TRAJECTORY_PRESETS];
  
  /**
   * 获取默认配置
   */
  static getDefaultConfig(): TrajectoryConfig {
    return { ...DEFAULT_TRAJECTORY_CONFIG };
  }
  
  /**
   * 应用预设
   */
  static applyPreset(preset: TrajectoryPreset): TrajectoryConfig {
    return {
      ...DEFAULT_TRAJECTORY_CONFIG,
      ...preset.config,
    };
  }
  
  /**
   * 保存自定义配置
   */
  saveConfig(id: string, config: TrajectoryConfig): void {
    this.configs.set(id, { ...config });
  }
  
  /**
   * 加载配置
   */
  loadConfig(id: string): TrajectoryConfig | null {
    return this.configs.get(id) || null;
  }
  
  /**
   * 获取所有预设
   */
  getPresets(): TrajectoryPreset[] {
    return [...this.presets];
  }
  
  /**
   * 添加自定义预设
   */
  addPreset(preset: TrajectoryPreset): void {
    this.presets.push(preset);
  }
  
  /**
   * 验证配置有效性
   */
  static validateConfig(config: Partial<TrajectoryConfig>): boolean {
    if (config.launchRadius !== undefined) {
      if (config.launchRadius < 0 || config.launchRadius > 100) return false;
    }
    if (config.launchCount !== undefined) {
      if (config.launchCount < 1 || config.launchCount > 100) return false;
    }
    if (config.waveAmplitude !== undefined) {
      if (config.waveAmplitude < 0 || config.waveAmplitude > 50) return false;
    }
    return true;
  }
  
  /**
   * 生成轨迹描述
   */
  static describeConfig(config: TrajectoryConfig): string {
    const parts: string[] = [];
    
    if (config.type) {
      parts.push(`轨迹: ${config.type}`);
    }
    if (config.waveAmplitude > 0) {
      parts.push(`波幅: ${config.waveAmplitude}m`);
    }
    if (config.spiralRadius > 0 && (config.type === TrajectoryType.SPIRAL || config.type === TrajectoryType.HELIX)) {
      parts.push(`螺旋: ${config.spiralRadius}m`);
    }
    if (config.colorGradient !== ColorGradientMode.NONE) {
      parts.push(`渐变: ${config.colorGradient}`);
    }
    
    return parts.join(' | ');
  }
}

// 单例
export const trajectoryConfigManager = new TrajectoryConfigManager();

// END OF FILE: src/core/trajectories/TrajectoryConfig.ts
