import * as THREE from 'three';

export const RING_WAVE_COLOR = 0x7FFF00; // Chartreuse

/**
 * 环状波 (Ring Wave)
 * 带有明显的正弦波浪边缘的空心环
 */
export function generateRingWave(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const baseR = 80 * scale;
  const waves = 12;
  const amplitude = 12 * scale;
  
  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    // 基础半径 + 波浪偏移
    const r = baseR + Math.sin(theta * waves) * amplitude;
    // 增加一点宽度随机扰动
    const thickness = (Math.random() - 0.5) * 5 * scale;
    
    p[i*3] = Math.cos(theta) * (r + thickness);
    p[i*3+1] = (Math.random() - 0.5) * 4 * scale;
    p[i*3+2] = Math.sin(theta) * (r + thickness);
  }
  return p;
}
