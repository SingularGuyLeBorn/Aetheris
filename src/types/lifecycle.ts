/**
 * Lifecycle Configuration Types
 * 
 * Defines the user-facing configuration for the 5-stage firework lifecycle.
 */

// ============================================================================
// 1. Core Types
// ============================================================================

export type LifecyclePhase = 'ascent' | 'explosion' | 'action' | 'hover' | 'fade';

export type VelocityCurve = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';
export type PathCategory = 'straight' | 's_shape' | 'spiral';
export type TrailEffect = string;
export type AscentPattern = string;
export type ExplosionShape = string;
export type ActionCategory = 'normal';
export type ActionType = string;
export type HoverCategory = 'normal';
export type HoverMode = string;
export type FadeCategory = 'normal';
export type FadeEffect = string;

// ============================================================================
// 2. Phase Configs
// ============================================================================

export interface AscentConfig {
  duration: number;
  velocityCurve: VelocityCurve;
  pathCategory: PathCategory;
  trailEffect: TrailEffect;
  ascentPattern: AscentPattern;
  trailDensity: number;
  trailSize: number;
  spiralRadius: number;
  style: 'comet' | 'sparkle' | 'vortex' | 'stealth';
}

export interface ExplosionConfig {
  shape: ExplosionShape;
  particleCount: number;
  launchScale: number;
  primaryHue: number;
  secondaryHue: number;
  bloomDuration: number;
  growDuration: number;
  power: number;
}

export interface ActionConfig {
  actionType: ActionType;
  duration: number;
  intensity: number;
  frequency: number;
}

export interface HoverConfig {
  hoverMode: HoverMode;
  hoverBeforeAction: number;
  hoverAfterAction: number;
  gravityResistance: number;
  stability: number;
}

export interface FadeConfig {
  fadeEffect: FadeEffect;
  duration: number;
  gravityStrength: number;
  windStrength: number;
}

export interface RenderingConfig {
  exposure: number;
  bloomStrength: number;
  enableDOF: boolean;
  enableMotionBlur: boolean;
}

// ============================================================================
// 3. Complete Lifecycle Config
// ============================================================================

export interface FireworkLifecycleConfig {
  id: string; // Preset ID
  name: string;
  ascent: AscentConfig;
  explosion: ExplosionConfig;
  action: ActionConfig;
  hover: HoverConfig;
  fade: FadeConfig;
  rendering: RenderingConfig;
}

// ============================================================================
// 4. Constants & Categories
// ============================================================================

export const TRAIL_CATEGORIES = {
  straight: { 
    label: '直线上升', 
    icon: '⬆️', 
    items: ['simple_trail', 'fast_beam', 'comet_tail', 'rocket_thrust'] 
  },
  s_shape: { 
    label: 'S 形游动', 
    icon: '〰️', 
    items: ['gentle_snake', 'sine_wave', 'dna_helix', 'zigzag_climb'] 
  },
  spiral: { 
    label: '螺旋盘旋', 
    icon: '🌀', 
    items: ['tight_spiral', 'double_helix', 'tornado_spin', 'random_wander'] 
  }
} as const;

export const SHAPE_CATEGORIES = {
    // Basic
    GEOMETRY: { label: '基础几何', items: ['sphere', 'cube', 'pyramid', 'star_3d', 'heart_3d'] },
    // Nature
    NATURE: { label: '自然生态', items: ['flower_3d', 'butterfly_3d', 'tree', 'leaf'] },
    // Cosmos
    COSMOS: { label: '浩瀚宇宙', items: ['galaxy_spiral', 'black_hole', 'comet', 'planet_rings'] },
    // Effect
    EFFECTS: { label: '特殊效果', items: ['explosion_burst', 'ring_wave', 'fountain', 'cascade'] }
};

export const ACTION_CATEGORIES = {
  normal: {
    label: '标准动作',
    items: ['expand', 'rotate', 'shimmer', 'pulse', 'orbit']
  }
};

export const HOVER_CATEGORIES = {
  normal: {
    label: '悬停模式',
    items: ['freeze', 'drift', 'levitate', 'wobble']
  }
};

export const FADE_CATEGORIES = {
  normal: {
    label: '消散模式',
    items: ['burnout', 'gravity_fall', 'wind_drift', 'dissolve']
  }
};

export const PHASE_MAP = {
    ascent: { label: '升空', icon: '🚀', color: '#f59e0b' },
    explosion: { label: '绽放', icon: '💥', color: '#ef4444' },
    action: { label: '演舞', icon: '💃', color: '#8b5cf6' },
    hover: { label: '悬停', icon: '⏳', color: '#06b6d4' },
    fade: { label: '归寂', icon: '🌑', color: '#64748b' },
};

// ============================================================================
// 5. Defaults
// ============================================================================

export const DEFAULT_LIFECYCLE_CONFIG: FireworkLifecycleConfig = {
  id: 'default',
  name: 'Default Firework',
  ascent: {
    duration: 1.5,
    velocityCurve: 'easeOut',
    pathCategory: 'straight',
    trailEffect: 'simple_trail',
    ascentPattern: 'cube',
    trailDensity: 0.5,
    trailSize: 1.0,
    spiralRadius: 5,
    style: 'comet'
  },
  explosion: {
    shape: 'sphere',
    particleCount: 2000,
    launchScale: 50,
    primaryHue: 200, // Blue-ish
    secondaryHue: 300,
    bloomDuration: 0.5,
    growDuration: 0.2,
    power: 1.0
  },
  action: {
    actionType: 'expand',
    duration: 2.0,
    intensity: 0.5,
    frequency: 1.0
  },
  hover: {
    hoverMode: 'drift',
    hoverBeforeAction: 0.2,
    hoverAfterAction: 0.5,
    gravityResistance: 0.8,
    stability: 0.9
  },
  fade: {
    fadeEffect: 'gravity_fall',
    duration: 2.0,
    gravityStrength: 0.5,
    windStrength: 0.2
  },
  rendering: {
    exposure: 1.2,
    bloomStrength: 1.5,
    enableDOF: false,
    enableMotionBlur: true
  }
};

export const LIFECYCLE_PRESETS: FireworkLifecycleConfig[] = [
  DEFAULT_LIFECYCLE_CONFIG,
  {
      ...DEFAULT_LIFECYCLE_CONFIG,
      id: 'phoenix_rebirth',
      name: 'Phoenix Rebirth',
      ascent: { ...DEFAULT_LIFECYCLE_CONFIG.ascent, ascentPattern: 'phoenix', pathCategory: 's_shape', trailEffect: 'comet_tail' },
      explosion: { ...DEFAULT_LIFECYCLE_CONFIG.explosion, shape: 'phoenix', primaryHue: 20, launchScale: 80 }
  },
  {
      ...DEFAULT_LIFECYCLE_CONFIG,
      id: 'galaxy_spiral',
      name: 'Galaxy Formation',
      ascent: { ...DEFAULT_LIFECYCLE_CONFIG.ascent, ascentPattern: 'sphere', pathCategory: 'spiral', trailEffect: 'dna_helix' },
      explosion: { ...DEFAULT_LIFECYCLE_CONFIG.explosion, shape: 'galaxy_spiral', primaryHue: 280, launchScale: 100 }
  }
];
