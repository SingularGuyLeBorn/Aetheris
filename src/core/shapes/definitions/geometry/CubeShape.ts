import * as THREE from 'three';

export const CUBE_COLOR = 0x00FFFF; // Cyan

/**
 * 立方体 (Cube)
 * 六面体表面均匀采样，呈现出完美的棱角结构
 */
export function generateCube(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const side = 180 * scale; // 边长180，从 -90 到 90
  const half = side / 2;
  
  for (let i = 0; i < count; i++) {
    const face = Math.floor(Math.random() * 6);
    const u = (Math.random() - 0.5) * side;
    const v = (Math.random() - 0.5) * side;
    
    switch(face) {
      case 0: p[i*3]=half; p[i*3+1]=u; p[i*3+2]=v; break;
      case 1: p[i*3]=-half; p[i*3+1]=u; p[i*3+2]=v; break;
      case 2: p[i*3]=u; p[i*3+1]=half; p[i*3+2]=v; break;
      case 3: p[i*3]=u; p[i*3+1]=-half; p[i*3+2]=v; break;
      case 4: p[i*3]=u; p[i*3+1]=v; p[i*3+2]=half; break;
      case 5: p[i*3]=u; p[i*3+1]=v; p[i*3+2]=-half; break;
    }
  }
  return p;
}
