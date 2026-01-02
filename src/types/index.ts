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
  [ExplosionType.FLASH]: '⚡', [ExplosionType.FLOWER]: '🌺',
  [ExplosionType.BUTTERFLY]: '🦋', [ExplosionType.FALLING_LEAVES]: '🍂',
  [ExplosionType.SNOWFLAKE]: '❄️', [ExplosionType.FISH]: '🐟',
  [ExplosionType.CAT_FACE]: '🐱', [ExplosionType.CUBE]: '🧊',
  [ExplosionType.PYRAMID]: '🔺', [ExplosionType.STAR]: '⭐',
  [ExplosionType.HEART_BEAT]: '❤️', [ExplosionType.SMILE]: '🙂',
  [ExplosionType.SPIRAL]: '🍥', [ExplosionType.GALAXY]: '🌌',
  [ExplosionType.SATURN]: '🪐', [ExplosionType.HELIX]: '🧬',
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
export interface FireworkConfig {
  enabledShapes: ExplosionType[];
  enabledAscensions: AscensionType[];
  enabledColors: ColorStyle[];
}

// 单发配置 (指定样式)
export interface ManualConfig {
  lockedShape: ExplosionType | 'RANDOM';
  lockedColor: ColorStyle | 'RANDOM';
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
  enabledColors: Object.values(ColorStyle)
};

export const DEFAULT_MANUAL_CONFIG: ManualConfig = {
  lockedShape: 'RANDOM',
  lockedColor: 'RANDOM'
};

// END OF FILE: src/types/index.ts