import * as THREE from 'three';

export const FOUNTAIN_COLOR = 0x1E90FF; // DodgerBlue

/**
 * 喷泉 (Fountain)
 * 向四周抛射并下坠的动态喷涌结构
 */
export function generateFountain(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const hLimit = 150 * scale;
  const rLimit = 60 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random(); // 抛射进度
    const angle = Math.random() * Math.PI * 2;
    
    // 模拟抛物线轨迹
    const h = t * hLimit;
    const r = Math.sin(t * Math.PI) * rLimit;
    
    p[i*3] = Math.cos(angle) * r;
    p[i*3+1] = h - hLimit / 2; // 中心化
    p[i*3+2] = Math.sin(angle) * r;
  }
  return p;
}
