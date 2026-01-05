import * as THREE from 'three';

export const FIREWORK_CLASSIC_COLOR = 0xFFA500; // Orange

/**
 * 经典烟花 (Classic Firework)
 * 标准球形爆发，粒子从中心匀速或爆发式扩散
 */
export function generateFireworkClassic(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const r = 100 * scale;
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    // 增加一点向壳层偏移的倾向，模仿爆发瞬间
    const dist = Math.pow(Math.random(), 0.15) * r;
    
    p[i*3] = dist * Math.sin(phi) * Math.cos(theta);
    p[i*3+1] = dist * Math.sin(phi) * Math.sin(theta);
    p[i*3+2] = dist * Math.cos(phi);
  }
  return p;
}
