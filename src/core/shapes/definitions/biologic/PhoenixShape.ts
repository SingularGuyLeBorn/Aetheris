import * as THREE from 'three';

export const PHOENIX_COLOR = 0xFF4500; // OrangeRed

/**
 * 凤凰 (Phoenix)
 * 宽大的双翼和修长的尾羽，呈现浴火重生的姿态
 */
export function generatePhoenix(count: number, scale: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const s = 1.2 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random();
    // 身体 (中心轴)
    if (t < 0.2) {
      const z = (Math.random() - 0.5) * 140 * s;
      const x = Math.sin(z * 0.05) * 10 * s;
      const y = Math.cos(z * 0.05) * 10 * s;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    } 
    // 翅膀 (展开的抛物面)
    else if (t < 0.7) {
      const side = Math.random() > 0.5 ? 1 : -1;
      const u = Math.random(); // 翼长方向
      const v = Math.random(); // 翼宽方向
      const x = side * (u * 90 * s);
      const z = (v - 0.5) * 80 * s;
      const y = Math.pow(u, 2) * 50 * s + Math.sin(v * Math.PI) * 15 * s;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    // 尾部 (飘动的长羽)
    else {
      const angle = (Math.random() - 0.5) * 0.8;
      const length = Math.random() * 100 * s;
      positions[i * 3] = Math.sin(angle) * length;
      positions[i * 3 + 1] = -length * 0.3;
      positions[i * 3 + 2] = -70 * s - length; // 尾部向后方延伸
    }
  }
  return positions;
}
