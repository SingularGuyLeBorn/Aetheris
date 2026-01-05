import * as THREE from 'three';

export const SPARKLE_CLOUD_COLOR = 0xFFFFE0; // LightYellow

/**
 * 闪烁云 (Sparkle Cloud)
 * 在一个立方体空间内均匀分布的粒子云，适合表现大范围闪烁
 */
export function generateSparkleCloud(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const side = 180 * scale; 
  for (let i = 0; i < count; i++) {
    p[i*3] = (Math.random() - 0.5) * side;
    p[i*3+1] = (Math.random() - 0.5) * side;
    p[i*3+2] = (Math.random() - 0.5) * side;
  }
  return p;
}
