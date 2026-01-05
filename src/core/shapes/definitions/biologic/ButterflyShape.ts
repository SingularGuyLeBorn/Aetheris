import * as THREE from 'three';

export const BUTTERFLY_COLOR = 0xDA70D6; // Orchid

/**
 * 蝴蝶 (Butterfly)
 * 基于蝴蝶曲线生成的四翼结构，具有柔和的弧度
 */
export function generateButterfly(count: number, scale: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const s = 30 * scale; 
  
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    // 经典的蝴蝶曲线方程
    const r = Math.exp(Math.sin(t)) - 2 * Math.cos(4 * t) + Math.pow(Math.sin((2 * t - Math.PI) / 24), 5);
    
    // 分为左右两半，并增加一点3D厚度/弯曲
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side * Math.sin(t) * r * s;
    const y = Math.cos(t) * r * s;
    const z = Math.abs(x) * 0.3 + (Math.random() - 0.5) * 10 * scale;
    
    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
  }
  return positions;
}
