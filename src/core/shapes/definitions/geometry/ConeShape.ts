import * as THREE from 'three';

export const CONE_COLOR = 0xCD853F; // Peru

/**
 * 圆锥 (Cone)
 * 实心采样的圆锥体，从底座到顶尖具有连贯的密度分布
 */
export function generateCone(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const R = 85 * scale;
  const H = 160 * scale;
  
  for (let i = 0; i < count; i++) {
    const h = Math.random(); // 高度比例 0(底) 到 1(顶)
    const angle = Math.random() * Math.PI * 2;
    // 随高度减小的半径
    const currentR = (1 - h) * R;
    // 体积权重采样
    const r = Math.sqrt(Math.random()) * currentR;
    
    p[i*3] = Math.cos(angle) * r;
    p[i*3+1] = h * H - H / 2;
    p[i*3+2] = Math.sin(angle) * r;
  }
  return p;
}
