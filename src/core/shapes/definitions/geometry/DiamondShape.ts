import * as THREE from 'three';

export const DIAMOND_COLOR = 0xAFEEEE; // PaleTurquoise

/**
 * 钻石 (Diamond)
 * 具有精确切割感的实心多面体，展现出晶体扩张的视觉张力
 */
export function generateDiamond(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const h = (Math.random() - 0.5) * 2; // -1 to 1
    
    // 钻石轮廓：顶部较宽，底部迅速收窄
    let currentR = 0;
    if (h > 0.3) {
      currentR = (1 - h) * 0.7 * s / 0.7; // 冠部
    } else {
      currentR = (h + 1) * s / 1.3; // 亭部
    }
    
    const r = Math.sqrt(Math.random()) * currentR;
    
    p[i*3] = Math.cos(angle) * r;
    p[i*3+1] = h * s * 0.8;
    p[i*3+2] = Math.sin(angle) * r;
  }
  return p;
}
