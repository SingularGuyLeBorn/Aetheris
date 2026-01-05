import * as THREE from 'three';

export const ASTEROID_BELT_COLOR = 0xA9A9A9; // DarkGray

/**
 * 小行星带 (Asteroid Belt)
 * 宽大的碎石圆轴带
 */
export function generateAsteroidBelt(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    // 粗细带状分布
    const r = (75 + Math.random() * 20) * scale; // 75 到 95
    // 高度范围小，呈盘状
    const h = (Math.random() - 0.5) * 20 * scale;
    
    p[i*3] = Math.cos(theta) * r;
    p[i*3+1] = h;
    p[i*3+2] = Math.sin(theta) * r;
  }
  return p;
}
