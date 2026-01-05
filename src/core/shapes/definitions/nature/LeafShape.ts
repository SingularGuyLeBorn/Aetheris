import * as THREE from 'three';

export const LEAF_COLOR = 0x32CD32; // LimeGreen

/**
 * 树叶 (Leaf)
 * 扁平的椭圆结构，带有中肋
 */
export function generateLeaf(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 90 * scale;
  
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1; // 沿长度 -1 到 1
    const v = Math.random() * 2 - 1; // 沿宽度 -1 到 1
    
    // 椭圆方程 (u^2 + v^2 <= 1)
    if (u*u + v*v * 4 > 1) { // 拉长的椭圆
      i--; continue;
    }
    
    const x = u * s;
    const z = v * s * 0.4 * (1 - Math.abs(u)); // 叶尖变窄
    const y = Math.pow(x/s, 2) * 20 * scale + (Math.random() - 0.5) * 5; // 略微弯曲
    
    p[i*3] = x;
    p[i*3+1] = y;
    p[i*3+2] = z;
  }
  return p;
}
