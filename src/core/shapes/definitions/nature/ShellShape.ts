import * as THREE from 'three';

export const SHELL_COLOR = 0xFFF5EE; // SeaShell

/**
 * 贝壳 (Shell)
 * 螺旋形圆锥结构
 */
export function generateShell(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 100 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 6; // 三圈螺旋
    const r = (1 - t / (Math.PI * 6 + 1)) * 80 * scale;
    const innerR = Math.random() * 20 * (1 - t / (Math.PI * 8)) * scale;
    const angle = Math.random() * Math.PI * 2;
    
    p[i*3] = Math.cos(t) * r + Math.cos(angle) * innerR;
    p[i*3+1] = t * 5 * scale + Math.sin(angle) * innerR;
    p[i*3+2] = Math.sin(t) * r + Math.sin(angle) * innerR;
  }
  return p;
}
