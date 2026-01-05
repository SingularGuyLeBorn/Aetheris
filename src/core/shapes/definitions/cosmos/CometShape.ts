import * as THREE from 'three';

export const COMET_COLOR = 0xAFEEEE; // PaleTurquoise

/**
 * 彗星 (Comet)
 * 具有致密头部和向一侧延伸的长尾
 */
export function generateComet(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.2) { // 彗核
      const r = Math.random() * 20 * scale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p[i*3] = r * Math.sin(phi) * Math.cos(theta);
      p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      p[i*3+2] = r * Math.cos(phi);
    } else { // 彗尾
      const t = Math.random();
      // 尾部逐渐扩散
      const spread = t * 30 * scale;
      p[i*3] = (Math.random() - 0.5) * spread;
      p[i*3+1] = (Math.random() - 0.5) * spread;
      // 尾部长度 95
      p[i*3+2] = -t * 95 * scale; 
    }
  }
  return p;
}
