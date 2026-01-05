import * as THREE from 'three';

export const BLACK_HOLE_COLOR = 0x483D8B; // DarkSlateBlue

/**
 * 黑洞 (Black Hole)
 * 表现为漏斗形的引力场，粒子向中心塌陷
 */
export function generateBlackHole(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    // 螺旋塌陷效果
    const theta = t * Math.PI * 16;
    // 半径随 t 增大，呈漏斗状
    const r = (1 - Math.pow(t, 2)) * 95 * scale; 
    
    p[i*3] = Math.cos(theta) * r;
    p[i*3+2] = Math.sin(theta) * r; // 置于 XZ 平面
    // Y 轴表现深度
    p[i*3+1] = (t - 0.5) * 40 * scale; 
  }
  return p;
}
