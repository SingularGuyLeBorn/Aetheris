import * as THREE from 'three';

export const HEART_COLOR = 0xFF1493; // DeepPink

/**
 * 爱心 (Heart 3D)
 * 经典的心形参数方程，具有饱满的体感
 */
export function generateHeart(count: number, scale: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const s = 6 * scale; // 16 * 6 = 96，确保核心在 100 以内
  
  for (let i = 0; i < count; i++) {
    const t = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI;
    
    // 心形二维曲线
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    
    // 赋予其 3D 厚度，使之成为一个饱含张力的心形体
    const z = (Math.random() - 0.5) * 15 * Math.sin(v);
    
    positions[i * 3] = x * s;
    positions[i * 3 + 1] = y * s;
    positions[i * 3 + 2] = z * s;
  }
  return positions;
}
