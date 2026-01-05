import * as THREE from 'three';

export const CHAOS_SCATTER_COLOR = 0xFF00FF; // Magenta

/**
 * 混沌散射 (Chaos Scatter)
 * 完全无序分布的粒子云
 */
export function generateChaosScatter(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // 限制在半径 95 的球体内
    const r = 95 * scale * Math.pow(Math.random(), 0.33); 
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    p[i*3] = r * Math.sin(phi) * Math.cos(theta);
    p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
    p[i*3+2] = r * Math.cos(phi);
  }
  return p;
}
