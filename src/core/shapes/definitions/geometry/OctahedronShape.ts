import * as THREE from 'three';

export const OCTAHEDRON_COLOR = 0x1E90FF; // DodgerBlue

/**
 * 八面体 (Octahedron)
 * 具有实心质感的双金字塔结构，增强膨胀时的体积感
 */
export function generateOctahedron(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 100 * scale; 
  
  for (let i = 0; i < count; i++) {
    // 随机分配到正负八个空间区域，实现实心采样
    let x = (Math.random() - 0.5) * 2;
    let y = (Math.random() - 0.5) * 2;
    let z = (Math.random() - 0.5) * 2;
    
    // 归一化到 |x| + |y| + |z| <= 1 的正八面体空间
    const sum = Math.abs(x) + Math.abs(y) + Math.abs(z);
    // 使用立方根确保体积内采样均匀
    const mag = Math.pow(Math.random(), 0.33); 
    
    x = (x / sum) * mag * s;
    y = (y / sum) * mag * s;
    z = (z / sum) * mag * s;
    
    p[i*3] = x;
    p[i*3+1] = y;
    p[i*3+2] = z;
  }
  return p;
}
