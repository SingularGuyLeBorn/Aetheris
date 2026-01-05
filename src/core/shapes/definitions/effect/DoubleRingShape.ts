import * as THREE from 'three';

export const DOUBLE_RING_COLOR = 0x32CD32; // LimeGreen

/**
 * 双环 (Double Ring)
 * 两个互相垂直的圆环，极具动态感
 */
export function generateDoubleRing(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const r = 85 * scale;
  
  for (let i = 0; i < count; i++) {
    const ring = Math.random() > 0.5 ? 0 : 1;
    const theta = Math.random() * Math.PI * 2;
    // 增加一点环的宽度和微量厚度
    const thickness = (Math.random() - 0.5) * 8 * scale;
    
    if (ring === 0) {
      // XY 平面环
      p[i*3] = (r + thickness) * Math.cos(theta);
      p[i*3+1] = (r + thickness) * Math.sin(theta);
      p[i*3+2] = (Math.random() - 0.5) * 4 * scale;
    } else {
      // YZ 平面环
      p[i*3] = (Math.random() - 0.5) * 4 * scale;
      p[i*3+1] = (r + thickness) * Math.cos(theta);
      p[i*3+2] = (r + thickness) * Math.sin(theta);
    }
  }
  return p;
}
