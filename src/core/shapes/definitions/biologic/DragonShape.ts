import * as THREE from 'three';

export const DRAGON_COLOR = 0xFFD700; // Gold

/**
 * 腾龙 (Dragon 3D)
 * 蜿蜒曲折的长蛇状结构，带有动态的盘旋感
 */
export function generateDragon(count: number, scale: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const s = scale;
  
  for (let i = 0; i < count; i++) {
    const p = i / count;
    const angle = p * Math.PI * 10; // 增加旋转圈数
    const r = (1 + Math.sin(p * 25)) * 12 * s; // 龙身粗细律动
    
    // 主干路径 (螺旋蜿蜒)
    const tx = Math.sin(angle * 0.25) * 75 * s;
    const ty = Math.cos(angle * 0.35) * 75 * s;
    const tz = (p - 0.5) * 180 * s; // 长度控制在 180
    
    // 表面随机点
    const randAngle = Math.random() * Math.PI * 2;
    const randR = Math.sqrt(Math.random()) * r;
    
    positions[i * 3] = tx + Math.cos(randAngle) * randR;
    positions[i * 3 + 1] = ty + Math.sin(randAngle) * randR;
    positions[i * 3 + 2] = tz;
  }
  return positions;
}
