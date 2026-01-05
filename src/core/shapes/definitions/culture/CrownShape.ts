import * as THREE from 'three';

export const CROWN_COLOR = 0xFFD700; // Gold

/**
 * 皇冠 (Crown)
 * 带有五个尖峰的圆环结构，底部宽阔，顶部尖锐
 */
export function generateCrown(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const baseR = 85 * scale;
  const topH = 60 * scale;
  const spikes = 5;
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const isSpike = Math.random() < 0.4;
    
    let radius = baseR;
    let h = 0;
    
    if (isSpike) {
      // 尖峰逻辑：周期性高度变化
      const spikeIdx = Math.floor(theta / (Math.PI * 2 / spikes));
      const midTheta = (spikeIdx + 0.5) * (Math.PI * 2 / spikes);
      const distToMid = Math.abs(theta - midTheta);
      const spikeT = Math.max(0, 1 - distToMid * 1.5); // 调整尖锐度
      h = Math.pow(spikeT, 0.8) * topH;
      radius = baseR * (1 - spikeT * 0.2); // 尖端向内收缩
    } else {
      // 基座部分
      h = Math.random() * 20 * scale;
    }
    
    p[i*3] = Math.cos(theta) * radius;
    p[i*3+1] = h - 20 * scale;
    p[i*3+2] = Math.sin(theta) * radius;
  }
  return p;
}
