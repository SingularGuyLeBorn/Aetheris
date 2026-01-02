
export enum ExplosionType {
  RING = '环形',
  BURST = '爆发',
  DOUBLE_LAYER = '双层',
  WILLOW = '垂柳',
  HEART = '心形',
  GLITTER = '闪烁',
  SPIRAL = '螺旋',
  CROSS = '十字',
  RAINBOW = '彩虹',
  STAR = '星芒',
  WAVE = '波浪',
  CROWN = '皇冠',
  PLANET = '行星',
  DANDELION = '蒲公英',
  FIREFLY = '萤火虫',
  SATURN = '土星环',
  BUTTERFLY = '幻蝶',
  JELLYFISH = '水母',
  GALAXY = '星系',
  COMET = '彗星',
  SNOWFLAKE = '雪花',
  FOUNTAIN = '喷泉',
  GHOST = '幽灵',
  DOUBLE_RING = '双环'
}

export type ParticleBehavior = 'default' | 'willow' | 'glitter' | 'ghost' | 'firefly' | 'comet' | 'galaxy';

export interface ParticleOptions {
  x: number;
  y: number;
  hue: number;
  speed?: number;
  angle?: number;
  friction?: number;
  gravity?: number;
  resistance?: number;
  size?: number;
  decay?: number;
  behavior?: ParticleBehavior;
  originX?: number;
  originY?: number;
}

export interface FireworkOptions {
  startX: number;
  targetX: number;
  targetY: number;
  hue: number;
  charge: number; 
}

export interface AppSettings {
  gravity: number;
  friction: number;
  autoLaunchDelay: number;
  particleCountMultiplier: number;
  explosionSizeMultiplier: number;
  starBlinkSpeed: number;
  trailLength: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  gravity: 0.12,
  friction: 0.95,
  autoLaunchDelay: 4000,
  particleCountMultiplier: 1.2,
  explosionSizeMultiplier: 1.2,
  starBlinkSpeed: 0.0008, 
  trailLength: 15
};
