import * as THREE from 'three';

export const RIBBON_COLOR = 0xDC143C; // Crimson

/**
 * 丝带 (Ribbon)
 * 具有周期性波动和螺旋倾向的条状结构
 */
export function generateRibbon(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 1.0 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 4; // 两次完整旋转
    const width = (Math.random() - 0.5) * 25 * s; // 丝带宽度
    
    // 螺旋路径
    const x = Math.cos(t) * 80 * s + width * Math.sin(t);
    const y = Math.sin(t * 0.5) * 60 * s;
    const z = Math.sin(t) * 80 * s + width * Math.cos(t);
    
    p[i*3] = x;
    p[i*3+1] = y;
    p[i*3+2] = z;
  }
  return p;
}
