import * as THREE from 'three';

export const PYRAMID_COLOR = 0xFFD700; // Gold (Usually yellow/gold)

/**
 * 四角锥 (Pyramid)
 * 由一个方形底座和四个三角形侧面组成
 */
export function generatePyramid(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 170 * scale; // 底边长
  const h = 150 * scale; // 高度
  const halfS = s / 2;
  const halfH = h / 2;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random(); 
    if (t < 0.25) { // 底部 (Square Base)
      p[i*3] = (Math.random() - 0.5) * s;
      p[i*3+1] = -halfH;
      p[i*3+2] = (Math.random() - 0.5) * s;
    } else { // 四个侧面 (Triangular Faces)
      const face = Math.floor(Math.random() * 4);
      // 在三角形内采样
      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      
      const px = (u - 0.5 * (1-v)) * s; // 随高度(v)向上收缩
      const py = v * h - halfH;
      const pz = (1 - v) * halfS;
      
      switch(face) {
        case 0: p[i*3]=px; p[i*3+1]=py; p[i*3+2]=pz; break;
        case 1: p[i*3]=px; p[i*3+1]=py; p[i*3+2]=-pz; break;
        case 2: p[i*3]=pz; p[i*3+1]=py; p[i*3+2]=px; break;
        case 3: p[i*3]=-pz; p[i*3+1]=py; p[i*3+2]=px; break;
      }
    }
  }
  return p;
}
