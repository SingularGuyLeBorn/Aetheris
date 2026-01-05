import * as THREE from 'three';

export const LOTUS_COLOR = 0xFFC0CB; // Pink

/**
 * 荷花 (Lotus)
 * 多层盛开的花瓣结构，呈现出优雅的辐射状
 */
export function generateLotus(count: number, scale: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const layers = 3;
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const layer = Math.floor(Math.random() * layers);
    const angle = Math.random() * Math.PI * 2;
    // 每层花瓣的半径和翘起程度
    const t = Math.random();
    const r = (0.2 + 0.8 * (layer + 1) / layers) * s * t;
    const h = Math.pow(t, 2) * (layer + 1) * 15 * scale;
    
    positions[i * 3] = Math.cos(angle) * r;
    positions[i * 3 + 1] = h - 20 * scale; // 底部稍微下沉
    positions[i * 3 + 2] = Math.sin(angle) * r;
  }
  return positions;
}
