// FILE: src/types/index.ts

export enum ExplosionType {
  // === 基础形态 ===
  SPHERE = '标准球形',
  RING = '行星环',
  BURST = '高能爆发',

  // === 艺术形态 ===
  WILLOW = '金丝垂柳',
  STROBE = '闪烁爆裂',  // 新增：带闪烁效果
  GHOST = '幽灵火',     // 新增：渐显效果

  // === 复杂组合技 (Combo) ===
  PISTIL = '双层花蕊',  // 新增：内芯+外壳
  CROSSETTE = '十字分裂', // 新增：分裂效果

  // === 3D 造型 ===
  HEART_BEAT = '跳动之心',
  BUTTERFLY = '幻蝶',
  DRAGON = '游龙',
  GREAT_WALL = '长城',
  ZODIAC = '生肖(蛇)',

  // === 宇宙特效 ===
  HELIX = 'DNA双螺旋',
  SATURN = '土星',
  GALAXY = '旋涡星系'
}

export type ParticleBehavior = 'default' | 'willow' | 'glitter' | 'ghost' | 'firefly' | 'comet' | 'galaxy' | 'stationary' | 'strobe';

export type CameraMode = 'orbit' | 'firstPerson';

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

export interface ParticleOptions3D {
  x: number;
  y: number;
  z: number;
  hue: number;
  speed?: number;
  theta?: number;  // Horizontal angle
  phi?: number;    // Vertical angle
  friction?: number;
  gravity?: number;
  resistance?: number;
  size?: number;
  decay?: number;
  behavior?: ParticleBehavior;
  originX?: number;
  originY?: number;
  originZ?: number;
  targetX?: number;
  targetY?: number;
  targetZ?: number;
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
  friction: 0.96, // 稍微增加阻力，让烟花在空中停留更久
  autoLaunchDelay: 2500,
  particleCountMultiplier: 1.0,
  explosionSizeMultiplier: 1.0,
  starBlinkSpeed: 0.001,
  trailLength: 15
};

// END OF FILE: src/types/index.ts