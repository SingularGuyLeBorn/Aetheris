import * as THREE from 'three';

export const JELLYFISH_COLOR = 0xE6E6FA; // Lavender

/**
 * 水母 (Jellyfish)
 * 半球形伞部和垂下的触手
 */
export function generateJellyfish(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 100 * scale;
  
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.4) {
      // 伞部 (半球表面)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * (Math.PI / 2); // 只有上半球
      const r = 70 * scale;
      p[i*3] = r * Math.sin(phi) * Math.cos(theta);
      p[i*3+1] = r * Math.cos(phi);
      p[i*3+2] = r * Math.sin(phi) * Math.sin(theta);
    } else {
      // 触手 (几条向下的曲线)
      const tentacle = Math.floor(Math.random() * 8);
      const angle = (tentacle / 8) * Math.PI * 2;
      const t = Math.random();
      const r = (30 + Math.sin(t * 5 + tentacle)) * 10 * scale;
      const x = Math.cos(angle) * 40 * scale;
      const z = Math.sin(angle) * 40 * scale;
      const h = -t * 80 * scale;
      
      p[i*3] = x + Math.cos(t * 10) * 10 * scale;
      p[i*3+1] = h;
      p[i*3+2] = z + Math.sin(t * 10) * 10 * scale;
    }
  }
  return p;
}
