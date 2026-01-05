import * as THREE from 'three';

export const STAR_COLOR = 0xFFFF00; // Yellow

/**
 * 五角星 (Star 3D)
 * 具有厚度的经典五角星形状
 */
export function generateStar(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const isOuter = Math.abs((t * 5 / Math.PI) % 2 - 1) < 0.5;
    const r = (isOuter ? s : s * 0.4);
    
    // 表面采样
    const z = (Math.random() - 0.5) * 20 * scale;
    
    p[i*3] = Math.cos(t) * r;
    p[i*3+1] = Math.sin(t) * r;
    p[i*3+2] = z;
  }
  return p;
}
