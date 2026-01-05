import * as THREE from 'three';

export const BIRD_COLOR = 0xF0E68C; // Khaki

/**
 * 飞鸟 (Bird)
 * 表现为展开双翼的简洁几何造型
 */
export function generateBird(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const wingSpan = 180 * scale;
  const bodyLen = 80 * scale;
  
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1; // -1 to 1 across wings
    const v = Math.random(); // body/wing depth
    
    // 翼展方向
    const x = u * wingSpan / 2;
    // 翅膀的 V 字形弯曲
    const y = Math.abs(u) * 40 * scale + Math.sin(v * Math.PI) * 10 * scale;
    // 身体前后方向
    const z = (v - 0.5) * bodyLen;
    
    p[i*3] = x;
    p[i*3+1] = y - 20 * scale;
    p[i*3+2] = z;
  }
  return p;
}
