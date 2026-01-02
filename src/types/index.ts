// FILE: src/types/index.ts

export enum ExplosionType {
  // === 经典 ===
  SPHERE = '标准球形',
  BURST = '高亮爆发',
  RING = '星环',
  DOUBLE_RING = '双层环',
  WILLOW = '金柳垂丝',
  STAGED = '子母连爆',
  FLASH = '雷霆闪光',
  GLITTER = '璀璨星尘',

  // === 自然 ===
  FLOWER = '盛世牡丹',
  BUTTERFLY = '幻彩蝴蝶',
  FALLING_LEAVES = '漫天落叶',
  SNOWFLAKE = '六角雪花',
  FISH = '锦鲤游动',
  CAT_FACE = '猫咪笑脸',

  // === 几何/抽象 ===
  CUBE = '量子立方',
  PYRAMID = '金字塔',
  STAR = '五角星',
  HEART = '爱心',
  HEART_BEAT = '跳动之心',
  SMILE = '笑脸',
  SPIRAL = '阿基米德',

  // === 宏大 ===
  GALAXY = '银河系',
  SATURN = '土星环',
  HELIX = 'DNA双螺旋',
  DRAGON = '游龙戏珠',
  GREAT_WALL = '万里长城',
  ZODIAC = '灵蛇狂舞',
  GHOST = '幽灵魅影',
  CROSS_STEP = '十字变色',

  // === 创意 ===
  ATOM = '原子结构',
  FAN = '孔雀开屏',
  WATERFALL = '九天瀑布',
  CHAOS = '混沌理论',
  TEXT_HI = '字形:Hi',
  CROWN = '皇冠'
}

// 图标映射：实现"图文并茂"
export const SHAPE_ICONS: Record<ExplosionType, string> = {
  [ExplosionType.SPHERE]: '💥', [ExplosionType.BURST]: '✨',
  [ExplosionType.RING]: '⭕', [ExplosionType.DOUBLE_RING]: '◎',
  [ExplosionType.WILLOW]: '🎋', [ExplosionType.STAGED]: '🎆',
  [ExplosionType.FLASH]: '⚡', [ExplosionType.GLITTER]: '✨', [ExplosionType.FLOWER]: '🌺',
  [ExplosionType.BUTTERFLY]: '🦋', [ExplosionType.FALLING_LEAVES]: '🍂',
  [ExplosionType.SNOWFLAKE]: '❄️', [ExplosionType.FISH]: '🐟',
  [ExplosionType.CAT_FACE]: '🐱', [ExplosionType.CUBE]: '🧊',
  [ExplosionType.PYRAMID]: '🔺', [ExplosionType.STAR]: '⭐',
  [ExplosionType.SMILE]: '🙂', [ExplosionType.SPIRAL]: '🍥',
  [ExplosionType.HEART]: '❤️', [ExplosionType.HEART_BEAT]: '💓',
  [ExplosionType.GALAXY]: '🌌', [ExplosionType.SATURN]: '🪐', [ExplosionType.HELIX]: '🧬',
  [ExplosionType.DRAGON]: '🐉', [ExplosionType.GREAT_WALL]: '🧱',
  [ExplosionType.ZODIAC]: '🐍', [ExplosionType.GHOST]: '👻',
  [ExplosionType.CROSS_STEP]: '✥', [ExplosionType.ATOM]: '⚛️',
  [ExplosionType.FAN]: '🪭', [ExplosionType.WATERFALL]: '🌊',
  [ExplosionType.CHAOS]: '🎲', [ExplosionType.TEXT_HI]: 'H',
  [ExplosionType.CROWN]: '👑'
};

export enum AscensionType {
  LINEAR = '直线升空',
  SPIRAL = '螺旋盘旋',
  ZIGZAG = 'S型摇摆',
  ACCELERATE = '极速推进',
  DRAWING = '空中绘图',
  WOBBLE = '随机扰动'
}

export const ASCENSION_ICONS: Record<AscensionType, string> = {
  [AscensionType.LINEAR]: '⬆️',
  [AscensionType.SPIRAL]: '🌀',
  [AscensionType.ZIGZAG]: '〰️',
  [AscensionType.ACCELERATE]: '🚀',
  [AscensionType.DRAWING]: '🖌️',
  [AscensionType.WOBBLE]: '🫨'
};

export enum ColorStyle {
  SINGLE = '纯净单色',
  DUAL = '双色互补',
  RAINBOW = '七彩虹光',
  GRADIENT = '同系渐变',
  GOLDEN = '流金岁月',
  PASTEL = '马卡龙色'
}

export const COLOR_ICONS: Record<ColorStyle, string> = {
  [ColorStyle.SINGLE]: '🔴',
  [ColorStyle.DUAL]: '🌗',
  [ColorStyle.RAINBOW]: '🌈',
  [ColorStyle.GRADIENT]: '🍧',
  [ColorStyle.GOLDEN]: '🏆',
  [ColorStyle.PASTEL]: '🍬'
};

export type ParticleBehavior = 'default' | 'willow' | 'glitter' | 'ghost' | 'firefly' | 'comet' | 'galaxy' | 'stationary' | 'falling';

export type CameraMode = 'orbit' | 'firstPerson';

// 2D Particle Options (for legacy 2D canvas version)
export interface ParticleOptions {
  x: number;
  y: number;
  hue: number;
  angle?: number;
  speed?: number;
  friction?: number;
  gravity?: number;
  resistance?: number;
  size?: number;
  decay?: number;
  behavior?: ParticleBehavior;
  originX?: number;
  originY?: number;
}

// 2D Firework Options (for legacy 2D canvas version)
export interface FireworkOptions {
  startX: number;
  targetX: number;
  targetY: number;
  hue: number;
  charge: number;
}

// 3D Particle Options
export interface ParticleOptions3D {
  x: number; y: number; z: number;
  hue: number; speed?: number;
  theta?: number; phi?: number;
  friction?: number; gravity?: number;
  resistance?: number; size?: number;
  decay?: number; behavior?: ParticleBehavior;
  originX?: number; originY?: number; originZ?: number;
}

export interface AppSettings {
  gravity: number;
  friction: number;
  autoLaunchDelay: number; // 基础随机间隔
  particleCountMultiplier: number;
  explosionSizeMultiplier: number;
  starBlinkSpeed: number;
  trailLength: number;
  // 新增：嘉年华控制
  enableAutoCarnival: boolean; // 是否开启自动循环
  carnivalInterval: number;    // 自动循环间隔(秒)
}

// 嘉年华配置 (白名单)
import { Shape3DType } from '../core/shapes/Shape3DFactory';
import { TrajectoryType } from '../core/trajectories/TrajectoryFactory';
import { ComboType } from '../core/combos/ComboManager';

export enum LaunchFormation {
  SINGLE = '单点发射',
  RANDOM = '随机散布',
  CIRCLE = '圆形齐射',
  LINE = '一字排开',
  CROSS = '十字交叉',
  V_SHAPE = 'V字编队'
}

export interface CarnivalStage {
  id: string;
  name: string;
  count: number;
  trajectory: TrajectoryType | 'RANDOM';
  shape: Shape3DType | ExplosionType | 'RANDOM';
  combo: ComboType | 'RANDOM';
  delay: number; // 距离上一阶段的延迟(ms)
  
  // 新增高级参数
  formation?: LaunchFormation;
  interval?: number; // 该波次内每发烟花的间隔 (ms), 0表示完全同时
  duration?: number; // 烟花停留时间 (s), 0表示默认
}

export interface FireworkConfig {
  enabledShapes: ExplosionType[];
  enabledAscensions: AscensionType[];
  enabledColors: ColorStyle[];
  // 新架构支持
  enabledShape3Ds?: Shape3DType[];
  enabledTrajectories?: TrajectoryType[];
  enabledCombos?: ComboType[];
  carnivalSequence?: CarnivalStage[];
  manualSequence?: CarnivalStage[]; // 手动交互剧本清单 (保留用于复杂交互)
}

// 单发配置 (指定样式)
export interface ManualConfig {
  lockedShape: ExplosionType | Shape3DType | 'RANDOM';
  lockedColor: ColorStyle | 'RANDOM';
  lockedTrajectory?: TrajectoryType | 'RANDOM';
  lockedCombo?: ComboType | 'RANDOM';
  
  // 新增手动参数
  lockedFormation: LaunchFormation; // 发射队形
  lockedCount: number; // 每次点击发射数量
  lockedDuration: number; // 烟花存续时间 (s)
  lockedInterval: number; // 发射间隔 (ms)

  currentStepIndex?: number; // 当前手动剧本进度
}

export const DEFAULT_SETTINGS: AppSettings = {
  gravity: 0.12,
  friction: 0.96,
  autoLaunchDelay: 2000,
  particleCountMultiplier: 1.0,
  explosionSizeMultiplier: 1.0,
  starBlinkSpeed: 0.001,
  trailLength: 15,
  enableAutoCarnival: false,
  carnivalInterval: 5
};

export const DEFAULT_CONFIG: FireworkConfig = {
  enabledShapes: Object.values(ExplosionType),
  enabledAscensions: Object.values(AscensionType),
  enabledColors: Object.values(ColorStyle),
  enabledShape3Ds: Object.values(Shape3DType),
  enabledTrajectories: Object.values(TrajectoryType),
  enabledCombos: Object.values(ComboType),
  carnivalSequence: [
    { id: '1', name: '序幕: 繁星点点', count: 5, trajectory: TrajectoryType.LINEAR, shape: Shape3DType.SPARKLE_CLOUD, combo: ComboType.SINGLE, delay: 0, formation: LaunchFormation.RANDOM, interval: 300, duration: 3 },
    { id: '2', name: '过渡: 螺旋升华', count: 8, trajectory: TrajectoryType.SPIRAL, shape: Shape3DType.RING_WAVE, combo: ComboType.STAGED, delay: 2000, formation: LaunchFormation.CIRCLE, interval: 100, duration: 4 },
    { id: '3', name: '高潮: 银河诞生', count: 1, trajectory: TrajectoryType.ACCELERATE, shape: Shape3DType.GALAXY_SPIRAL, combo: ComboType.GALAXY_BIRTH, delay: 3000, formation: LaunchFormation.SINGLE, interval: 0, duration: 8 }
  ],
  manualSequence: []
};

export const DEFAULT_MANUAL_CONFIG: ManualConfig = {
  lockedShape: 'RANDOM',
  lockedColor: 'RANDOM',
  lockedTrajectory: 'RANDOM',
  lockedCombo: 'RANDOM',
  lockedFormation: LaunchFormation.SINGLE,
  lockedCount: 1,
  lockedDuration: 0,
  lockedInterval: 100,
  currentStepIndex: 0
};

// END OF FILE: src/types/index.ts