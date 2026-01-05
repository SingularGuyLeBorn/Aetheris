import * as THREE from 'three';

export const PLANET_RINGS_COLOR = 0xF0E68C; // Khaki

/**
 * 土星环 (Planet Rings)
 * 中心球体配合倾斜的盘状光环
 */
export function generatePlanetRings(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (i < count * 0.4) { // 中心行星
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const r = 45 * scale; 
      p[i*3] = r * Math.sin(phi) * Math.cos(theta);
      p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      p[i*3+2] = r * Math.cos(phi);
    } else { // 光环
      const theta = Math.random() * Math.PI * 2;
      const r = (65 + Math.random() * 30) * scale; // 65 到 95
      p[i*3] = r * Math.cos(theta);
      p[i*3+1] = r * Math.sin(theta) * 0.3; // 倾斜
      p[i*3+2] = (Math.random() - 0.5) * 5 * scale;
    }
  }
  return p;
}
