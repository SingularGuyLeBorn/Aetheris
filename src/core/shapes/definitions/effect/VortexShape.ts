import * as THREE from 'three';

export const VORTEX_COLOR = 0x9400D3; // DarkViolet

/**
 * 涡流 (Vortex)
 * 旋转的螺旋漏斗结构
 */
export function generateVortex(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const theta = t * Math.PI * 12; // 6圈旋转
    const r = (0.1 + 0.9 * t) * s;
    const h = (t - 0.5) * 60 * scale;
    
    p[i*3] = Math.cos(theta) * r;
    p[i*3+1] = h;
    p[i*3+2] = Math.sin(theta) * r;
  }
  return p;
}
