import * as THREE from 'three';

export const CASCADE_COLOR = 0x00CED1; // DarkTurquoise

/**
 * 级联 (Cascade)
 * 多个不同高度和大小的环层叠下落
 */
export function generateCascade(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const layers = 5;
  const s = 90 * scale;
  
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * layers);
    const theta = Math.random() * Math.PI * 2;
    // 每层半径逐渐缩小
    const radius = (1 - layer * 0.15) * s;
    const h = (layer - 2) * 20 * scale; // 从 -40 到 40
    
    const noise = (Math.random() - 0.5) * 5 * scale;
    
    p[i*3] = Math.cos(theta) * radius + noise;
    p[i*3+1] = h;
    p[i*3+2] = Math.sin(theta) * radius + noise;
  }
  return p;
}
