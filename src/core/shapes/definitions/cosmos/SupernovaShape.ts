import * as THREE from 'three';

export const SUPERNOVA_COLOR = 0xFF0000; // Bright Red

/**
 * 超新星 (Supernova)
 * 强烈的球形爆发，中心致密，边缘向外放射
 */
export function generateSupernova(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // 具有放射感的分布
    const isRay = Math.random() > 0.8;
    const r = Math.pow(Math.random(), 0.6) * 95 * scale * (isRay ? 1.05 : 1.0);
    
    p[i*3] = r * Math.sin(phi) * Math.cos(theta);
    p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    p[i*3+2] = r * Math.cos(phi);
  }
  return p;
}
