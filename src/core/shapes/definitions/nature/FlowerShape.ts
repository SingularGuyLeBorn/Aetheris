import * as THREE from 'three';

export const FLOWER_COLOR = 0xFF69B4; // HotPink

/**
 * 花朵 (Flower 3D)
 * 六片对称的花瓣，边缘呈波浪状，呈现盛开态势
 */
export function generateFlower(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const petals = 6;
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    // 花瓣方程
    const r = (Math.abs(Math.sin(t * petals / 2)) * 0.7 + 0.3) * s;
    const phi = (Math.random() - 0.5) * 0.4 + (r / s) * 0.5; // 边缘向上翘
    
    p[i*3] = r * Math.cos(t);
    p[i*3+1] = r * Math.sin(phi);
    p[i*3+2] = r * Math.sin(t);
  }
  return p;
}
