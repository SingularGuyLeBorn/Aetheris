import * as THREE from 'three';

export const FISH_COLOR = 0x20B2AA; // LightSeaGreen

/**
 * 鱼 (Fish 3D)
 * 梭形的主体和侧扁的尾部
 */
export function generateFish(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const len = 180 * scale;
  const maxR = 35 * scale;
  
  for (let i = 0; i < count; i++) {
    const t = Math.random(); // 0(头) 到 1(尾)
    const angle = Math.random() * Math.PI * 2;
    
    // 梭形身体厚度
    const r = Math.sin(t * Math.PI) * maxR;
    const x = Math.cos(angle) * r * 0.6; // 稍微侧扁
    const y = Math.sin(angle) * r;
    const z = (t - 0.5) * len;
    
    // 尾鳍效果
    if (t > 0.8) {
      const tailT = (t - 0.8) / 0.2;
      const tailY = (Math.random() - 0.5) * 60 * scale * tailT;
      p[i*3] = (Math.random() - 0.5) * 5 * scale;
      p[i*3+1] = tailY;
      p[i*3+2] = z;
    } else {
      p[i*3] = x;
      p[i*3+1] = y;
      p[i*3+2] = z;
    }
  }
  return p;
}
