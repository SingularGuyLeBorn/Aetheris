import * as THREE from 'three';

export const SHOCKWAVE_COLOR = 0xFFF0F5; // LavenderBlush

/**
 * 激波 (Shockwave)
 * 表现为一个快速扩张的实心盘状结构，边缘有模糊感
 */
export function generateShockwave(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const maxRadius = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    // 实心分布，但在边缘更密集以体现“波”的特质
    const r = Math.pow(Math.random(), 0.5) * maxRadius;
    const h = (Math.random() - 0.5) * 6 * scale;
    
    p[i*3] = Math.cos(theta) * r;
    p[i*3+1] = h;
    p[i*3+2] = Math.sin(theta) * r;
  }
  return p;
}
