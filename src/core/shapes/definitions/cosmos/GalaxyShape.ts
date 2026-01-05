import * as THREE from 'three';

export const GALAXY_COLOR = 0x9370DB; // MediumPurple

/**
 * 旋涡星系 (Galaxy Spiral)
 * 具有旋臂和中心核球的盘状结构
 */
export function generateGalaxy(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const arms = 2;
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    const arm = Math.floor(Math.random() * arms);
    const angle = t * Math.PI * 6 + (arm / arms) * Math.PI * 2;
    const r = t * s;
    const noise = (Math.random() - 0.5) * 15 * scale;
    
    p[i*3] = Math.cos(angle) * r + noise;
    p[i*3+1] = (Math.random() - 0.5) * 10 * (1 - t) * scale;
    p[i*3+2] = Math.sin(angle) * r + noise;
  }
  return p;
}
