import * as THREE from 'three';

export const LANTERN_COLOR = 0xFF0000; // Red

/**
 * 红灯笼 (Lantern)
 * 具有中国传统风格的灯笼结构，包含椭圆主体和下垂流苏
 */
export function generateLantern(count: number, scale: number): Float32Array {
  const positions = new Float32Array(count * 3);
  const rCover = 75 * scale;
  
  for (let i = 0; i < count; i++) {
    const isBody = Math.random() < 0.8;
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI;
    
    if (isBody) {
      // 椭球体形灯笼主体
      positions[i * 3] = rCover * 0.8 * Math.sin(v) * Math.cos(u);
      positions[i * 3 + 1] = rCover * 1.1 * Math.cos(v); 
      positions[i * 3 + 2] = rCover * 0.8 * Math.sin(v) * Math.sin(u);
    } else {
      // 底部下垂的流苏 (Tassel)
      const t = Math.random();
      const tasselAngle = Math.random() * Math.PI * 2;
      const tasselR = Math.random() * 8 * scale;
      positions[i * 3] = Math.cos(tasselAngle) * tasselR;
      positions[i * 3 + 1] = -rCover * 1.0 - t * 40 * scale; 
      positions[i * 3 + 2] = Math.sin(tasselAngle) * tasselR;
    }
  }
  return positions;
}
