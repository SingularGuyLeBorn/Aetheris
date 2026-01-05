import * as THREE from 'three';

export const WORMHOLE_COLOR = 0xDA70D6; // Orchid

/**
 * 虫洞 (Wormhole)
 * 高度扭曲的漏斗结构
 */
export function generateWormhole(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const theta = Math.random() * Math.PI * 2;
    // 双向漏斗结构
    const side = Math.random() > 0.5 ? 1 : -1;
    const r = (30 + 65 * Math.pow(t, 1.5)) * scale; 
    const h = side * t * 95 * scale; 
    
    p[i*3] = Math.cos(theta) * r;
    p[i*3+1] = h;
    p[i*3+2] = Math.sin(theta) * r;
  }
  return p;
}
