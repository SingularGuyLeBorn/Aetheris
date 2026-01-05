import * as THREE from 'three';

export const TREE_COLOR = 0x228B22; // ForestGreen

/**
 * 树 (Tree)
 * 圆柱状树干配合圆锥状或球状树冠
 */
export function generateTree(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 1.0 * scale;
  
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.25) { // 树干 (Trunk)
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 15 * s;
      p[i*3] = Math.cos(angle) * r;
      p[i*3+1] = Math.random() * 100 * s - 90 * s; // -90 到 10
      p[i*3+2] = Math.sin(angle) * r;
    } else { // 树冠 (Canopy)
      const ratio = Math.pow(Math.random(), 0.6);
      const theta = Math.random() * Math.PI * 2;
      const r = (1 - ratio) * 85 * s; 
      const h = 10 * s + ratio * 120 * s; // 顶部最高达 130
      
      p[i*3] = r * Math.cos(theta);
      p[i*3+1] = h - 50 * s; // 整体范围约 -40 到 80
      p[i*3+2] = r * Math.sin(theta);
    }
  }
  return p;
}
