import * as THREE from 'three';

export const PULSAR_COLOR = 0x7FFFD4; // Aquamarine

/**
 * 脉冲星 (Pulsar)
 * 旋转的中子星，极具特色的轴向喷流
 */
export function generatePulsar(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.5) { // 中心球体
      const r = 35 * scale;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      p[i*3] = r * Math.sin(phi) * Math.cos(theta);
      p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
      p[i*3+2] = r * Math.cos(phi);
    } else { // 上下两极喷流
      const side = Math.random() > 0.5 ? 1 : -1;
      const t = Math.random();
      // 喷流半径随距离扩散
      const r = 5 * scale + t * 15 * scale;
      const angle = Math.random() * Math.PI * 2;
      
      p[i*3] = Math.cos(angle) * r;
      p[i*3+1] = side * t * 95 * scale; // Y 轴喷流
      p[i*3+2] = Math.sin(angle) * r;
    }
  }
  return p;
}
