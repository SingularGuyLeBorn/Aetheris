import * as THREE from 'three';

export const EXPLOSION_BURST_COLOR = 0xFF6347; // Tomato

/**
 * 爆发 (Explosion Burst)
 * 具有强力核心的径向爆发
 */
export function generateExplosionBurst(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const r = 100 * scale;
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    // 采用非线性分布，使外部粒子更稀疏
    const dist = Math.pow(Math.random(), 1.5) * r; 
    
    p[i*3] = dist * Math.sin(phi) * Math.cos(theta);
    p[i*3+1] = dist * Math.sin(phi) * Math.sin(theta);
    p[i*3+2] = dist * Math.cos(phi);
  }
  return p;
}
