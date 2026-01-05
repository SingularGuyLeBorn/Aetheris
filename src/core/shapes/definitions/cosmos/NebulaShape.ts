import * as THREE from 'three';

export const NEBULA_COLOR = 0xEE82EE; // Violet

/**
 * 星云 (Nebula)
 * 弥漫状点云，没有规则边界
 */
export function generateNebula(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    // 基础半径 70，加上大量的扰动
    const r = Math.random() * 70 * scale; 
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    
    // 增加体积感
    const noise = (Math.random() - 0.5) * 25 * scale;
    
    p[i*3] = r * Math.sin(phi) * Math.cos(theta) + noise;
    p[i*3+1] = r * Math.sin(phi) * Math.sin(theta) + noise;
    p[i*3+2] = r * Math.cos(phi) + noise;
  }
  return p;
}
