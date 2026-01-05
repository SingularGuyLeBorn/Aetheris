/**
 * Engine Core Types - Stream Architecture ("一切皆流")
 * 
 * Defines the static configuration (Manifest) and runtime state (Instance)
 */

import { Vector3 } from '../Vector3';

// ============================================================================
// 1. Data Structures (DNA)
// ============================================================================

export interface FireworkManifest {
  id: string;
  name: string;
  description?: string;
  tags?: string[];
  duration: number;
  carrier: CarrierConfig;
  payload: {
    stages: PayloadStage[];
  };
}

export interface CarrierConfig {
  type: string;
  path: PathConfig;
  duration: number;
  trail: TrailConfig;
  shape?: string;
}

export type ForceFieldType = ForceField['type'];

export type PathType = PathConfig['type'];

export interface PathConfig {
  type: 'linear' | 'bezier' | 'bezier_3d' | 'spiral' | 'helix' | 'arc';
  points: Vector3[];
  speedCurve: number[];
  spiralRadius?: number;
  spiralFrequency?: number;
}

export interface TrailConfig {
  emissionRate: number;
  lifeTime: number;
  colorGradient: Gradient;
  texture: string;
  size: number;
}

export interface PayloadStage {
  id: string;
  name?: string;
  timeOffset: number;
  duration: number;
  topology: TopologyConfig;
  dynamics: DynamicsConfig;
  rendering: RenderingConfig;
  reuseParticles?: boolean;
  shaderAnimation?: {
    vertexModifier: string;
    parameters: Record<string, any>;
  };
}

export interface TopologyConfig {
  type: 'mathematical_shape' | 'point_cloud' | 'obj_model' | 'text';
  source: string; // Shape3DType name
  resolution: number;
  scale: number;
  offset?: Vector3;
  rotation?: Vector3;
}

export interface DynamicsConfig {
  transitionMode: 'explode' | 'morph' | 'accumulate' | 'scatter' | 'maintain';
  initialVelocity: {
    mode: 'radial' | 'directional' | 'random' | 'target_seeking' | 'structure_preserve';
    speed: number | [number, number];
    direction?: Vector3;
  };
  forceFields: ForceField[];
  velocityProfile: number[]; // Curve
  morphAttractionStrength?: number;
  morphDamping?: number;
}

export interface RenderingConfig {
  colorMap: Gradient;
  sizeCurve: number[];
  baseSize: number;
  blending: 'additive' | 'normal' | 'screen';
  useBlackbodyRadiation?: boolean;
  initialTemperature?: number;
  coolingRate?: number;
  glowIntensity?: number;
  enableBloom?: boolean;
  bloomDuration?: number;
  growDuration?: number;
}

export interface ForceField {
  type: 'gravity' | 'wind' | 'vortex' | 'attraction' | 'repulsion' | 'drag' | 'turbulence' | 'curl_noise' | 'breathe' | 'wing_flap' | 'noise';
  strength: number;
  direction?: Vector3;
  center?: Vector3;
  radius?: number;
  falloff?: number[];
  enabled?: boolean;
  noiseFrequency?: number;
  noiseAmplitude?: number;
}

export interface Gradient {
  stops: GradientStop[];
}

export interface GradientStop {
  position: number; // 0-1
  hue: number;
  saturation: number;
  lightness: number;
  alpha?: number;
}

export type Curve = number[]; // Simplified Spline [x1, y1, x2, y2...]

// ============================================================================
// 2. Helpers & Presets
// = ============================================================================

/**
 * 评估曲线值 (0-1)
 */
export function evaluateCurve(curve: number[], t: number): number {
  if (!curve || curve.length < 2) return t;
  // 简单线性插值实现
  const points = [];
  for (let i = 0; i < curve.length; i += 2) {
      points.push({ x: curve[i], y: curve[i+1] });
  }
  
  if (t <= points[0].x) return points[0].y;
  if (t >= points[points.length - 1].x) return points[points.length - 1].y;
  
  for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      if (t >= p1.x && t <= p2.x) {
          const localT = (t - p1.x) / (p2.x - p1.x);
          return p1.y + (p2.y - p1.y) * localT;
      }
  }
  return t;
}

/**
 * 评估渐变颜色
 */
export function evaluateGradient(gradient: Gradient, t: number): { h: number, s: number, l: number, a: number } {
  const stops = gradient.stops;
  if (stops.length === 0) return { h: 0, s: 0, l: 0, a: 1 };
  if (stops.length === 1 || t <= stops[0].position) {
      return { h: stops[0].hue, s: stops[0].saturation, l: stops[0].lightness, a: stops[0].alpha ?? 1 };
  }
  if (t >= stops[stops.length - 1].position) {
      const last = stops[stops.length - 1];
      return { h: last.hue, s: last.saturation, l: last.lightness, a: last.alpha ?? 1 };
  }
  
  for (let i = 0; i < stops.length - 1; i++) {
      const s1 = stops[i];
      const s2 = stops[i+1];
      if (t >= s1.position && t <= s2.position) {
          const localT = (t - s1.position) / (s2.position - s1.position);
          return {
              h: lerpHue(s1.hue, s2.hue, localT),
              s: s1.saturation + (s2.saturation - s1.saturation) * localT,
              l: s1.lightness + (s2.lightness - s1.lightness) * localT,
              a: (s1.alpha ?? 1) + ((s2.alpha ?? 1) - (s1.alpha ?? 1)) * localT
          };
      }
  }
  return { h: 0, s: 0, l: 0, a: 1 };
}

function lerpHue(h1: number, h2: number, t: number): number {
    let d = h2 - h1;
    if (d > 180) d -= 360;
    if (d < -180) d += 360;
    return (h1 + d * t + 360) % 360;
}

export const PRESET_CURVES = {
  LINEAR: [0, 0, 1, 1],
  EASE_OUT: [0, 0, 0.4, 0.8, 1, 1],
  EASE_IN_OUT: [0, 0, 0.5, 0.2, 1, 1],
  BELL: [0, 0, 0.5, 1, 1, 0]
};

export const PRESET_GRADIENTS = {
  GOLD: { stops: [{ position: 0, hue: 45, saturation: 1, lightness: 0.6 }, { position: 1, hue: 30, saturation: 0.8, lightness: 0.4 }] },
  FIRE: { stops: [{ position: 0, hue: 60, saturation: 1, lightness: 0.7 }, { position: 0.5, hue: 30, saturation: 1, lightness: 0.5 }, { position: 1, hue: 0, saturation: 1, lightness: 0.3 }] },
  PHOENIX: { stops: [{ position: 0, hue: 20, saturation: 1, lightness: 0.6 }, { position: 0.5, hue: 350, saturation: 1, lightness: 0.5 }, { position: 1, hue: 280, saturation: 0.8, lightness: 0.4 }] },
  RAINBOW: { stops: [
      { position: 0, hue: 0, saturation: 1, lightness: 0.5 },
      { position: 0.2, hue: 60, saturation: 1, lightness: 0.5 },
      { position: 0.4, hue: 120, saturation: 1, lightness: 0.5 },
      { position: 0.6, hue: 180, saturation: 1, lightness: 0.5 },
      { position: 0.8, hue: 240, saturation: 1, lightness: 0.5 },
      { position: 1, hue: 300, saturation: 1, lightness: 0.5 }
  ]}
};

export const PRESET_FORCE_FIELDS = {
  AIR_DRAG: { type: 'drag' as const, strength: 0.05 },
  HEAVY_DRAG: { type: 'drag' as const, strength: 0.15 },
  LIGHT_GRAVITY: { type: 'gravity' as const, strength: 5, direction: new Vector3(0, -1, 0) },
  EARTH_GRAVITY: { type: 'gravity' as const, strength: 9.8, direction: new Vector3(0, -1, 0) }
};

// ============================================================================
// 3. Runtime Instance
// = ============================================================================

export interface FireworkInstance {
  id: string;
  manifest: FireworkManifest;
  state: 'carrier' | 'payload' | 'extinct';
  elapsed: number;
}
