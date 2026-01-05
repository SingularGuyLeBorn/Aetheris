import * as THREE from 'three';

export const CONSTELLATION_COLOR = 0xFFFAF0; // FloralWhite

/**
 * 星座 (Constellation)
 * 离散的亮点集合，模拟遥远恒星
 */
export function generateConstellation(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const stars = 8;
  const starPos: {x: number, y: number, z: number}[] = [];
  
  // 预生成骨干点
  for (let s = 0; s < stars; s++) {
    starPos.push({
      x: (Math.random() - 0.5) * 180 * scale, // 范围 ±90
      y: (Math.random() - 0.5) * 180 * scale,
      z: (Math.random() - 0.5) * 40 * scale
    });
  }
  
  for (let i = 0; i < count; i++) {
    const sIdx = Math.floor(Math.random() * stars);
    const star = starPos[sIdx];
    // 主要是亮点，带少量周围云雾
    const offset = Math.random() < 0.8 ? 2 : 12;
    p[i*3] = star.x + (Math.random() - 0.5) * offset * scale;
    p[i*3+1] = star.y + (Math.random() - 0.5) * offset * scale;
    p[i*3+2] = star.z + (Math.random() - 0.5) * offset * scale;
  }
  return p;
}
