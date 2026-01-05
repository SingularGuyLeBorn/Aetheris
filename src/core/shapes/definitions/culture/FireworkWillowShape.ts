import * as THREE from 'three';

export const FIREWORK_WILLOW_COLOR = 0xEEE8AA; // PaleGoldenRod

/**
 * 柳垂烟花 (Willow Firework)
 * 具有长尾迹和重力感下坠的伞状结构
 */
export function generateFireworkWillow(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const r = 100 * scale; 
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const t = Math.random();
    // 伞状扩散
    const x = Math.cos(angle) * t * r;
    const z = Math.sin(angle) * t * r;
    // 模拟重力下垂的指数曲线
    const y = -Math.pow(t, 2.5) * 120 * scale; 
    
    p[i*3] = x;
    p[i*3+1] = y + 50 * scale; // 向上偏移使其爆发点在中心
    p[i*3+2] = z;
  }
  return p;
}
