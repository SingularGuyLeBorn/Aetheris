import * as THREE from 'three';

export const MUSHROOM_COLOR = 0xBC8F8F; // RosyBrown

/**
 * 蘑菇 (Mushroom)
 * 宽大的半球形菌盖和粗壮的菌柄
 */
export function generateMushroom(count: number, scale: number): Float32Array {
  const p = new Float32Array(count * 3);
  const capR = 85 * scale;
  const stemR = 20 * scale;
  
  for (let i = 0; i < count; i++) {
    if (Math.random() < 0.3) { // 菌柄 (Stem)
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * stemR;
      p[i*3] = Math.cos(angle) * r;
      p[i*3+1] = Math.random() * 80 * scale - 120 * scale; // -120 到 -40
      p[i*3+2] = Math.sin(angle) * r;
    } else { // 菌盖 (Cap)
      const angle = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * capR;
      // 半球形顶
      const h = Math.sqrt(Math.max(0, 1 - (r / capR) ** 2)) * 40 * scale;
      p[i*3] = Math.cos(angle) * r;
      p[i*3+1] = h - 40 * scale; // 底部基准面在 -40
      p[i*3+2] = Math.sin(angle) * r;
    }
  }
  return p;
}
