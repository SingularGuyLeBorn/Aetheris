import * as THREE from 'three';

export const SNOWFLAKE_COLOR = 0xAFEEEE; // PaleTurquoise

/**
 * 雪花 (Snowflake 3D)
 * 六角对称结构，高细节分支
 */
export function generateSnowflake(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const branches = 6;
  const s = 95 * scale;
  
  for (let i = 0; i < count; i++) {
    const branch = Math.floor(Math.random() * branches);
    const angle = (branch / branches) * Math.PI * 2;
    
    // 分支逻辑
    const t = Math.random(); // 沿主轴位置
    const side = Math.random() > 0.5 ? 1 : -1;
    
    let x = 0, y = 0, z = 0;
    
    if (t < 0.2) { // 中心
      const r = Math.random() * 20 * scale;
      const a = Math.random() * Math.PI * 2;
      x = Math.cos(a) * r;
      z = Math.sin(a) * r;
    } else {
      // 主干
      const dist = t * s;
      x = dist;
      // 侧分支
      if (t > 0.4) {
        const subT = (t - 0.4) / 0.6;
        const subAngle = Math.PI / 3;
        const subDist = Math.random() * 20 * (1 - subT) * scale;
        x += Math.cos(subAngle) * subDist;
        z += Math.sin(subAngle) * subDist * side;
      }
    }
    
    // 旋转到对应分支
    const rx = x * Math.cos(angle) - z * Math.sin(angle);
    const rz = x * Math.sin(angle) + z * Math.cos(angle);
    
    p[i*3] = rx;
    p[i*3+1] = (Math.random() - 0.5) * 5 * scale; // 略微厚度
    p[i*3+2] = rz;
  }
  return p;
}
