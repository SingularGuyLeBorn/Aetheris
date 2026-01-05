import * as THREE from 'three';

export const TORUS_COLOR = 0x32CD32; // LimeGreen

/**
 * 圆环 (Torus)
 * 具有体积感的环状结构，通过填充内部粒子实现更丰富的膨胀动画
 */
export function generateTorus(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const R = 70 * scale; // 主半径
  const rLimit = 25 * scale; // 管径
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 2;
    
    // 使用 Math.sqrt(Math.random()) 确保体积内采样均匀，或不使用以保持一定空心感但有厚度
    const r = Math.pow(Math.random(), 0.7) * rLimit; 
    
    const x = (R + r * Math.cos(phi)) * Math.cos(theta);
    const y = r * Math.sin(phi);
    const z = (R + r * Math.cos(phi)) * Math.sin(theta);
    
    p[i*3] = x;
    p[i*3+1] = y;
    p[i*3+2] = z;
  }
  return p;
}
