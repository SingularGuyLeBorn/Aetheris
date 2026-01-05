import * as THREE from 'three';

export const YIN_YANG_COLOR = 0xFFFFFF; // White

/**
 * 阴阳 (Yin Yang)
 * 具有两个互补的半圆和两个反色眼睛
 */
export function generateYinYang(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const r = 90 * scale;
  
  for (let i = 0; i < count; i++) {
    const side = Math.random() > 0.5 ? 1 : -1;
    let x = 0, y = 0, z = (Math.random() - 0.5) * 10 * scale;
    
    const t = Math.random();
    if (t < 0.8) {
      // 勾玉部分
      const angle = Math.random() * Math.PI;
      const radius = Math.sqrt(Math.random()) * r;
      const finalAngle = angle + (side === 1 ? 0 : Math.PI);
      
      // 调整形状以形成完美的勾玉 (简化版)
      x = Math.cos(finalAngle) * radius;
      y = Math.sin(finalAngle) * radius;
    } else {
      // 眼睛部分
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 15 * scale;
      const offsetX = 0;
      const offsetY = side * (r / 2);
      
      x = offsetX + Math.cos(angle) * radius;
      y = offsetY + Math.sin(angle) * radius;
    }
    
    p[i*3] = x;
    p[i*3+1] = y;
    p[i*3+2] = z;
  }
  return p;
}
