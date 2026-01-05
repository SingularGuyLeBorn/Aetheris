import * as THREE from 'three';

export const MOBIUS_COLOR = 0xFF00FF; // Magenta

/**
 * 莫比乌斯环 (Mobius)
 * 具有拓扑学意义的单面环结构
 */
export function generateMobius(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const R = 75 * scale, w = 35 * scale;
  
  for (let i = 0; i < count; i++) {
    const u = Math.random() * Math.PI * 2;
    const v = (Math.random() - 0.5) * w;
    
    // 莫比乌斯参数方程
    const x = (R + v * Math.cos(u/2)) * Math.cos(u);
    const y = (R + v * Math.cos(u/2)) * Math.sin(u);
    const z = v * Math.sin(u/2);
    
    p[i*3] = x;
    p[i*3+1] = y;
    p[i*3+2] = z;
  }
  return p;
}
