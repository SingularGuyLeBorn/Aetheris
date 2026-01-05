import * as THREE from 'three';

export const CYLINDER_COLOR = 0x8B4513; // SaddleBrown

/**
 * 圆柱 (Cylinder)
 * 实心采样的圆柱体，膨胀时呈现出明显的柱状扩张感
 */
export function generateCylinder(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const R = 75 * scale;
  const H = 160 * scale;
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * R;
    const h = (Math.random() - 0.5) * H;
    
    p[i*3] = Math.cos(angle) * r;
    p[i*3+1] = h;
    p[i*3+2] = Math.sin(angle) * r;
  }
  return p;
}
