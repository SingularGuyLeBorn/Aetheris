import * as THREE from 'three';

export const NESTED_SPHERES_COLOR = 0x00BFFF; // DeepSkyBlue

/**
 * 嵌套球 (Nested Spheres)
 * 具有三个不同半径的同心球壳，层次分明
 */
export function generateNestedSpheres(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const radii = [40 * scale, 70 * scale, 95 * scale];
  
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * 3);
    const r = radii[layer];
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    
    // 增加一点厚度扰动
    const dr = (Math.random() - 0.5) * 5 * scale;
    const finalR = r + dr;
    
    p[i*3] = finalR * Math.sin(phi) * Math.cos(theta);
    p[i*3+1] = finalR * Math.sin(phi) * Math.sin(theta);
    p[i*3+2] = finalR * Math.cos(phi);
  }
  return p;
}
