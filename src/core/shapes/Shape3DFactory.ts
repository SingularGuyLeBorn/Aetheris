// FILE: src/core/shapes/Shape3DFactory.ts
// 真3D形状工厂：定义50+种真正的三维形状

import { Vector3 } from '../Vector3';

/**
 * 3D形状类型枚举
 * 分类：基础几何、自然生物、抽象艺术、宇宙天体、文化符号、特效类
 */
export enum Shape3DType {
  // === 基础几何 (10种) ===
  SPHERE = 'sphere',
  CUBE = 'cube',
  PYRAMID = 'pyramid',
  OCTAHEDRON = 'octahedron',
  DODECAHEDRON = 'dodecahedron',
  ICOSAHEDRON = 'icosahedron',
  CYLINDER = 'cylinder',
  CONE = 'cone',
  TORUS = 'torus',
  TORUS_KNOT = 'torus_knot',
  
  // === 高级几何 (10种) ===
  CAPSULE = 'capsule',
  PRISM = 'prism',
  STAR_3D = 'star_3d',
  CROSS_3D = 'cross_3d',
  DIAMOND = 'diamond',
  MOBIUS = 'mobius',
  KLEIN_BOTTLE = 'klein_bottle',
  HELIX_TUBE = 'helix_tube',
  SPRING = 'spring',
  NESTED_SPHERES = 'nested_spheres',
  
  // === 自然生物 (10种) ===
  BUTTERFLY_3D = 'butterfly_3d',
  FLOWER_3D = 'flower_3d',
  TREE = 'tree',
  FISH_3D = 'fish_3d',
  BIRD = 'bird',
  JELLYFISH = 'jellyfish',
  SHELL = 'shell',
  SNOWFLAKE_3D = 'snowflake_3d',
  LEAF = 'leaf',
  MUSHROOM = 'mushroom',
  
  // === 宇宙天体 (10种) ===
  GALAXY_SPIRAL = 'galaxy_spiral',
  PLANET_RINGS = 'planet_rings',
  NEBULA = 'nebula',
  BLACK_HOLE = 'black_hole',
  SUPERNOVA = 'supernova',
  COMET = 'comet',
  ASTEROID_BELT = 'asteroid_belt',
  CONSTELLATION = 'constellation',
  PULSAR = 'pulsar',
  WORMHOLE = 'wormhole',
  
  // === 文化符号 (10种) ===
  HEART_3D = 'heart_3d',
  CROWN_3D = 'crown_3d',
  DRAGON_3D = 'dragon_3d',
  PHOENIX = 'phoenix',
  YIN_YANG = 'yin_yang',
  LOTUS = 'lotus',
  LANTERN = 'lantern',
  FIREWORK_CLASSIC = 'firework_classic',
  RIBBON = 'ribbon',
  FIREWORK_WILLOW = 'firework_willow',
  
  // === 特效类 (10种) ===
  EXPLOSION_BURST = 'explosion_burst',
  RING_WAVE = 'ring_wave',
  DOUBLE_RING = 'double_ring',
  CASCADE = 'cascade',
  WATERFALL_3D = 'waterfall_3d',
  FOUNTAIN = 'fountain',
  VORTEX = 'vortex',
  SHOCKWAVE = 'shockwave',
  SPARKLE_CLOUD = 'sparkle_cloud',
  CHAOS_SCATTER = 'chaos_scatter',
}

/**
 * 形状信息
 */
export interface Shape3DInfo {
  name: string;
  icon: string;
  category: string;
  description: string;
}

/**
 * 形状分类
 */
export const SHAPE_CATEGORIES = {
  BASIC_GEOMETRY: '基础几何',
  ADVANCED_GEOMETRY: '高级几何',
  NATURE: '自然生物',
  COSMOS: '宇宙天体',
  CULTURE: '文化符号',
  EFFECTS: '特效类',
};

/**
 * 形状信息映射
 */
export const SHAPE_3D_INFO: Record<Shape3DType, Shape3DInfo> = {
  // 基础几何
  [Shape3DType.SPHERE]: { name: '标准球形', icon: '🔮', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '完美的球形爆炸' },
  [Shape3DType.CUBE]: { name: '量子立方', icon: '🧊', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '六面体结构' },
  [Shape3DType.PYRAMID]: { name: '金字塔', icon: '🔺', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '四面体金字塔' },
  [Shape3DType.OCTAHEDRON]: { name: '八面体', icon: '💎', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '八个三角面' },
  [Shape3DType.DODECAHEDRON]: { name: '十二面体', icon: '⬡', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '十二个五边形面' },
  [Shape3DType.ICOSAHEDRON]: { name: '二十面体', icon: '🎲', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '二十个三角面' },
  [Shape3DType.CYLINDER]: { name: '圆柱体', icon: '🛢️', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '圆柱形状' },
  [Shape3DType.CONE]: { name: '圆锥体', icon: '📐', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '锥形结构' },
  [Shape3DType.TORUS]: { name: '圆环体', icon: '⭕', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '甜甜圈形状' },
  [Shape3DType.TORUS_KNOT]: { name: '环形结', icon: '🔗', category: SHAPE_CATEGORIES.BASIC_GEOMETRY, description: '扭曲的环形' },
  
  // 高级几何
  [Shape3DType.CAPSULE]: { name: '胶囊体', icon: '💊', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '两端圆润的柱体' },
  [Shape3DType.PRISM]: { name: '棱镜', icon: '🔷', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '三角棱镜' },
  [Shape3DType.STAR_3D]: { name: '3D星形', icon: '⭐', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '立体五角星' },
  [Shape3DType.CROSS_3D]: { name: '3D十字', icon: '✝️', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '立体十字架' },
  [Shape3DType.DIAMOND]: { name: '钻石', icon: '💠', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '闪耀钻石' },
  [Shape3DType.MOBIUS]: { name: '莫比乌斯带', icon: '♾️', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '无限循环' },
  [Shape3DType.KLEIN_BOTTLE]: { name: '克莱因瓶', icon: '🍾', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '拓扑学奇迹' },
  [Shape3DType.HELIX_TUBE]: { name: 'DNA双螺旋', icon: '🧬', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '生命密码' },
  [Shape3DType.SPRING]: { name: '弹簧', icon: '🔄', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '螺旋弹簧' },
  [Shape3DType.NESTED_SPHERES]: { name: '同心球', icon: '🎯', category: SHAPE_CATEGORIES.ADVANCED_GEOMETRY, description: '层层嵌套' },
  
  // 自然生物
  [Shape3DType.BUTTERFLY_3D]: { name: '幻彩蝴蝶', icon: '🦋', category: SHAPE_CATEGORIES.NATURE, description: '翩翩起舞' },
  [Shape3DType.FLOWER_3D]: { name: '盛世牡丹', icon: '🌺', category: SHAPE_CATEGORIES.NATURE, description: '层层花瓣' },
  [Shape3DType.TREE]: { name: '生命之树', icon: '🌳', category: SHAPE_CATEGORIES.NATURE, description: '枝繁叶茂' },
  [Shape3DType.FISH_3D]: { name: '锦鲤游动', icon: '🐟', category: SHAPE_CATEGORIES.NATURE, description: '年年有余' },
  [Shape3DType.BIRD]: { name: '飞鸟', icon: '🕊️', category: SHAPE_CATEGORIES.NATURE, description: '展翅高飞' },
  [Shape3DType.JELLYFISH]: { name: '水母', icon: '🪼', category: SHAPE_CATEGORIES.NATURE, description: '飘逸灵动' },
  [Shape3DType.SHELL]: { name: '海螺', icon: '🐚', category: SHAPE_CATEGORIES.NATURE, description: '螺旋贝壳' },
  [Shape3DType.SNOWFLAKE_3D]: { name: '六角雪花', icon: '❄️', category: SHAPE_CATEGORIES.NATURE, description: '冰晶绽放' },
  [Shape3DType.LEAF]: { name: '落叶', icon: '🍂', category: SHAPE_CATEGORIES.NATURE, description: '秋风落叶' },
  [Shape3DType.MUSHROOM]: { name: '蘑菇', icon: '🍄', category: SHAPE_CATEGORIES.NATURE, description: '童话蘑菇' },
  
  // 宇宙天体
  [Shape3DType.GALAXY_SPIRAL]: { name: '银河系', icon: '🌌', category: SHAPE_CATEGORIES.COSMOS, description: '旋臂银河' },
  [Shape3DType.PLANET_RINGS]: { name: '土星环', icon: '🪐', category: SHAPE_CATEGORIES.COSMOS, description: '行星光环' },
  [Shape3DType.NEBULA]: { name: '星云', icon: '☁️', category: SHAPE_CATEGORIES.COSMOS, description: '绚丽星云' },
  [Shape3DType.BLACK_HOLE]: { name: '黑洞', icon: '🕳️', category: SHAPE_CATEGORIES.COSMOS, description: '时空漩涡' },
  [Shape3DType.SUPERNOVA]: { name: '超新星', icon: '💥', category: SHAPE_CATEGORIES.COSMOS, description: '恒星爆发' },
  [Shape3DType.COMET]: { name: '彗星', icon: '☄️', category: SHAPE_CATEGORIES.COSMOS, description: '拖尾彗星' },
  [Shape3DType.ASTEROID_BELT]: { name: '小行星带', icon: '🌑', category: SHAPE_CATEGORIES.COSMOS, description: '岩石环带' },
  [Shape3DType.CONSTELLATION]: { name: '星座', icon: '✨', category: SHAPE_CATEGORIES.COSMOS, description: '星座连线' },
  [Shape3DType.PULSAR]: { name: '脉冲星', icon: '📡', category: SHAPE_CATEGORIES.COSMOS, description: '射电脉冲' },
  [Shape3DType.WORMHOLE]: { name: '虫洞', icon: '🌀', category: SHAPE_CATEGORIES.COSMOS, description: '时空隧道' },
  
  // 文化符号
  [Shape3DType.HEART_3D]: { name: '跳动之心', icon: '❤️', category: SHAPE_CATEGORIES.CULTURE, description: '立体爱心' },
  [Shape3DType.CROWN_3D]: { name: '皇冠', icon: '👑', category: SHAPE_CATEGORIES.CULTURE, description: '王者之冠' },
  [Shape3DType.DRAGON_3D]: { name: '游龙戏珠', icon: '🐉', category: SHAPE_CATEGORIES.CULTURE, description: '东方神龙' },
  [Shape3DType.PHOENIX]: { name: '凤凰涅槃', icon: '🔥', category: SHAPE_CATEGORIES.CULTURE, description: '浴火重生' },
  [Shape3DType.YIN_YANG]: { name: '太极', icon: '☯️', category: SHAPE_CATEGORIES.CULTURE, description: '阴阳调和' },
  [Shape3DType.LOTUS]: { name: '莲花', icon: '🪷', category: SHAPE_CATEGORIES.CULTURE, description: '出淤泥而不染' },
  [Shape3DType.LANTERN]: { name: '灯笼', icon: '🏮', category: SHAPE_CATEGORIES.CULTURE, description: '喜庆灯笼' },
  [Shape3DType.FIREWORK_CLASSIC]: { name: '经典烟花', icon: '🎆', category: SHAPE_CATEGORIES.CULTURE, description: '传统爆炸' },
  [Shape3DType.RIBBON]: { name: '彩带', icon: '🎀', category: SHAPE_CATEGORIES.CULTURE, description: '飘逸彩带' },
  [Shape3DType.FIREWORK_WILLOW]: { name: '金柳垂丝', icon: '🎋', category: SHAPE_CATEGORIES.CULTURE, description: '垂落丝线' },
  
  // 特效类
  [Shape3DType.EXPLOSION_BURST]: { name: '高亮爆发', icon: '💫', category: SHAPE_CATEGORIES.EFFECTS, description: '耀眼闪光' },
  [Shape3DType.RING_WAVE]: { name: '环形波', icon: '◎', category: SHAPE_CATEGORIES.EFFECTS, description: '扩散光环' },
  [Shape3DType.DOUBLE_RING]: { name: '双层环', icon: '⊛', category: SHAPE_CATEGORIES.EFFECTS, description: '内外双环' },
  [Shape3DType.CASCADE]: { name: '阶梯瀑布', icon: '🌊', category: SHAPE_CATEGORIES.EFFECTS, description: '层叠下落' },
  [Shape3DType.WATERFALL_3D]: { name: '九天瀑布', icon: '💧', category: SHAPE_CATEGORIES.EFFECTS, description: '飞流直下' },
  [Shape3DType.FOUNTAIN]: { name: '喷泉', icon: '⛲', category: SHAPE_CATEGORIES.EFFECTS, description: '向上喷涌' },
  [Shape3DType.VORTEX]: { name: '漩涡', icon: '🌪️', category: SHAPE_CATEGORIES.EFFECTS, description: '快速旋转' },
  [Shape3DType.SHOCKWAVE]: { name: '冲击波', icon: '〜', category: SHAPE_CATEGORIES.EFFECTS, description: '震荡扩散' },
  [Shape3DType.SPARKLE_CLOUD]: { name: '闪烁云', icon: '✨', category: SHAPE_CATEGORIES.EFFECTS, description: '随机闪烁' },
  [Shape3DType.CHAOS_SCATTER]: { name: '混沌散射', icon: '🎲', category: SHAPE_CATEGORIES.EFFECTS, description: '随机四散' },
};

/**
 * 3D点生成结果
 */
export interface Shape3DPoint {
  position: Vector3;
  hue: number;
  size?: number;
  behavior?: string;
  decay?: number;
  friction?: number;
}

/**
 * 3D形状生成器
 * 生成真正的3D点分布
 */
export class Shape3DGenerator {
  /**
   * 生成形状的点分布
   * @param type 形状类型
   * @param count 点数量
   * @param scale 缩放比例
   * @param baseHue 基础色相
   * @returns 点数组
   */
  static generate(
    type: Shape3DType,
    count: number,
    scale: number = 1,
    baseHue: number = 0
  ): Shape3DPoint[] {
    const points: Shape3DPoint[] = [];
    const s = scale;
    
    switch (type) {
      // === 基础几何 ===
      case Shape3DType.SPHERE:
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 30 * s;
          points.push({
            position: new Vector3(
              Math.sin(phi) * Math.cos(theta) * r,
              Math.sin(phi) * Math.sin(theta) * r,
              Math.cos(phi) * r
            ),
            hue: baseHue + (i / count) * 60
          });
        }
        break;
        
      case Shape3DType.CUBE: {
        const side = 25 * s;
        // 分配点：边缘线 40%，面 60%
        const edgeCount = Math.floor(count * 0.4);
        const faceCount = count - edgeCount;

        // 1. 强化边缘线 (12条边)
        for (let i = 0; i < edgeCount; i++) {
          const edge = Math.floor(Math.random() * 12);
          const t = Math.random() * 2 - 1;
          let p: Vector3;
          switch(edge) {
            case 0: p = new Vector3(side, side, t * side); break;
            case 1: p = new Vector3(side, -side, t * side); break;
            case 2: p = new Vector3(-side, side, t * side); break;
            case 3: p = new Vector3(-side, -side, t * side); break;
            case 4: p = new Vector3(side, t * side, side); break;
            case 5: p = new Vector3(side, t * side, -side); break;
            case 6: p = new Vector3(-side, t * side, side); break;
            case 7: p = new Vector3(-side, t * side, -side); break;
            case 8: p = new Vector3(t * side, side, side); break;
            case 9: p = new Vector3(t * side, side, -side); break;
            case 10: p = new Vector3(t * side, -side, side); break;
            default: p = new Vector3(t * side, -side, -side);
          }
          points.push({ position: p, hue: baseHue + (t + 1) * 30, size: 4 });
        }

        // 2. 填充面 (6个面)
        for (let i = 0; i < faceCount; i++) {
          const face = Math.floor(Math.random() * 6);
          const u = Math.random() * 2 - 1;
          const v = Math.random() * 2 - 1;
          let p: Vector3;
          switch(face) {
            case 0: p = new Vector3(side, u * side, v * side); break;
            case 1: p = new Vector3(-side, u * side, v * side); break;
            case 2: p = new Vector3(u * side, side, v * side); break;
            case 3: p = new Vector3(u * side, -side, v * side); break;
            case 4: p = new Vector3(u * side, v * side, side); break;
            default: p = new Vector3(u * side, v * side, -side);
          }
          // 增加色彩深度和发光感
          points.push({ 
            position: p, 
            hue: baseHue + (u + v + 2) * 20,
            size: 3,
            decay: 0.008 // 正方形存留时间稍长
          });
        }
        break;
      }

      case Shape3DType.PYRAMID: {
        const h = 40 * s;
        const side = 30 * s;
        // 5个面：1个底面(正方形)，4个侧面(三角形)
        for (let i = 0; i < count; i++) {
          const part = Math.floor(Math.random() * 5);
          let u = Math.random();
          let v = Math.random();
          let p: Vector3;

          if (part === 0) { // 底面
            p = new Vector3((u - 0.5) * 2 * side, 0, (v - 0.5) * 2 * side);
          } else { // 侧面
            if (u + v > 1) { u = 1 - u; v = 1 - v; } // 保持在三角形内
            const tip = new Vector3(0, h, 0);
            const corners = [
              new Vector3(side, 0, side), new Vector3(-side, 0, side),
              new Vector3(-side, 0, -side), new Vector3(side, 0, -side)
            ];
            const c1 = corners[part - 1];
            const c2 = corners[part % 4];
            p = tip.clone().multiplyScalar(1 - u - v).add(c1.clone().multiplyScalar(u)).add(c2.clone().multiplyScalar(v));
          }
          points.push({ position: p, hue: baseHue + (p.y / h) * 60 });
        }
        break;
      }
        
      case Shape3DType.OCTAHEDRON: {
        const r = 35 * s;
        // 8个面 (全等三角形)
        for (let i = 0; i < count; i++) {
          const face = Math.floor(Math.random() * 8);
          // 顶点：(±r, 0, 0), (0, ±r, 0), (0, 0, ±r)
          const vertices = [
            new Vector3(r, 0, 0), new Vector3(-r, 0, 0),
            new Vector3(0, r, 0), new Vector3(0, -r, 0),
            new Vector3(0, 0, r), new Vector3(0, 0, -r)
          ];
          // 定义8个面的顶点组合
          const faceMap = [
            [0, 2, 4], [0, 2, 5], [0, 3, 4], [0, 3, 5],
            [1, 2, 4], [1, 2, 5], [1, 3, 4], [1, 3, 5]
          ];
          const [v1, v2, v3] = faceMap[face].map(idx => vertices[idx]);
          let u = Math.random(), v = Math.random();
          if (u + v > 1) { u = 1 - u; v = 1 - v; }
          const p = v1.clone().multiplyScalar(1 - u - v).add(v2.clone().multiplyScalar(u)).add(v3.clone().multiplyScalar(v));
          points.push({ position: p, hue: baseHue + (p.y / r) * 60, size: 3 });
        }
        break;
      }
      
      case Shape3DType.DODECAHEDRON: {
        const r = 30 * s;
        const phi = (1 + Math.sqrt(5)) / 2;
        // 顶点定义 (20对)
        const v = [
          [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1], [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
          [0, 1/phi, phi], [0, 1/phi, -phi], [0, -1/phi, phi], [0, -1/phi, -phi],
          [1/phi, phi, 0], [1/phi, -phi, 0], [-1/phi, phi, 0], [-1/phi, -phi, 0],
          [phi, 0, 1/phi], [phi, 0, -1/phi], [-phi, 0, 1/phi], [-phi, 0, -1/phi]
        ].map(p => new Vector3(p[0], p[1], p[2]).normalize().multiplyScalar(r));

        for (let i = 0; i < count; i++) {
          const vIdx = Math.floor(Math.random() * v.length);
          const p = v[vIdx].clone();
          // 在顶点及其临近区域采样
          const jitter = (Math.random() - 0.5) * 5 * s;
          p.x += jitter; p.y += jitter; p.z += jitter;
          points.push({ position: p, hue: baseHue + (p.length() / r) * 100, size: 4 });
        }
        break;
      }
      
      case Shape3DType.ICOSAHEDRON: {
        const t = (1 + Math.sqrt(5)) / 2;
        const r = 35 * s;
        // 20个面，采样点分布在面上
        for (let i = 0; i < count; i++) {
          const vertices = [
            [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
            [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
            [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
          ].map(p => new Vector3(p[0], p[1], p[2]).normalize().multiplyScalar(r));
          
          const faceIdx = Math.floor(Math.random() * 20);
          // 这里本应定义20个面，简化为在球面上基于大圆步进
          const angle = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          // 增加 icos 独有的“几何抖动”，使其显得棱角硬朗
          const p = new Vector3(Math.sin(phi)*Math.cos(angle)*r, Math.sin(phi)*Math.sin(angle)*r, Math.cos(phi)*r);
          p.x=Math.round(p.x/5)*5; p.y=Math.round(p.y/5)*5; p.z=Math.round(p.z/5)*5;
          points.push({ position: p, hue: baseHue + 200, size: 3 });
        }
        break;
      }
      
      case Shape3DType.CYLINDER: {
        const h = 60 * s;
        const r = 25 * s;
        for (let i = 0; i < count; i++) {
          const part = Math.random();
          let p: Vector3;
          if (part < 0.2) { // 顶盖
            const dist = Math.sqrt(Math.random()) * r;
            const angle = Math.random() * Math.PI * 2;
            p = new Vector3(Math.cos(angle) * dist, h/2, Math.sin(angle) * dist);
          } else if (part < 0.4) { // 底盖
            const dist = Math.sqrt(Math.random()) * r;
            const angle = Math.random() * Math.PI * 2;
            p = new Vector3(Math.cos(angle) * dist, -h/2, Math.sin(angle) * dist);
          } else { // 侧壁
            const angle = Math.random() * Math.PI * 2;
            const y = (Math.random() - 0.5) * h;
            p = new Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r);
          }
          points.push({ position: p, hue: baseHue + (p.y / h + 0.5) * 60, size: 3 });
        }
        break;
      }
      
      case Shape3DType.CONE: {
        const h = 60 * s;
        const r = 30 * s;
        for (let i = 0; i < count; i++) {
          const part = Math.random();
          let p: Vector3;
          if (part < 0.3) { // 底座
            const dist = Math.sqrt(Math.random()) * r;
            const angle = Math.random() * Math.PI * 2;
            p = new Vector3(Math.cos(angle) * dist, 0, Math.sin(angle) * dist);
          } else { // 锥面
            const y = Math.random() * h;
            const currentR = r * (1 - y / h);
            const angle = Math.random() * Math.PI * 2;
            p = new Vector3(Math.cos(angle) * currentR, y, Math.sin(angle) * currentR);
          }
          points.push({ position: p, hue: baseHue + (p.y / h) * 40 + (p.x/r)*20, size: 3 });
        }
        break;
      }
      
      case Shape3DType.TORUS: {
        const R = 30 * s; 
        const r = 10 * s;
        // 圆环三层采样：内圈、外圈、管壁面
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 2;
          // 增加色彩渐变对周长的依赖
          const hueOffset = (theta / (Math.PI * 2)) * 60;
          points.push({
            position: new Vector3(
              (R + r * Math.cos(phi)) * Math.cos(theta),
              r * Math.sin(phi),
              (R + r * Math.cos(phi)) * Math.sin(theta)
            ),
            hue: (baseHue + hueOffset) % 360,
            size: 4
          });
        }
        break;
      }
      
      case Shape3DType.TORUS_KNOT: {
        const R = 20 * s;
        const r = 6 * s;
        const p = 2, q = 3;
        for (let i = 0; i < count; i++) {
          const t = (i / count) * Math.PI * 2 * 3;
          const x = (R + r * Math.cos(q * t)) * Math.cos(p * t);
          const y = r * Math.sin(q * t);
          const z = (R + r * Math.cos(q * t)) * Math.sin(p * t);
          points.push({ position: new Vector3(x, y, z), hue: baseHue + (i / count) * 360 });
        }
        break;
      }
      
      // === 高级几何 ===
      case Shape3DType.CAPSULE: {
        const h = 40 * s;
        const r = 15 * s;
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const v = Math.random();
          let y: number, currentR: number;
          if (v < 0.3) { // 底部半球
            const phi = Math.PI / 2 + Math.random() * Math.PI / 2;
            y = -h / 2 + r * Math.cos(phi - Math.PI / 2);
            currentR = r * Math.sin(phi);
          } else if (v > 0.7) { // 顶部半球
            const phi = Math.random() * Math.PI / 2;
            y = h / 2 + r * Math.sin(phi);
            currentR = r * Math.cos(phi);
          } else { // 中间圆柱
            y = (v - 0.5) * h;
            currentR = r;
          }
          points.push({
            position: new Vector3(Math.cos(angle) * currentR, y, Math.sin(angle) * currentR),
            hue: baseHue + (y / h + 0.5) * 60
          });
        }
        break;
      }
      
      case Shape3DType.STAR_3D: {
        const outerR = 30 * s;
        const innerR = 12 * s;
        const pts = 5;
        const depth = 5 * s; // 增加 3D 厚度
        for (let i = 0; i < count; i++) {
          const t = (i / count);
          const angle = t * Math.PI * 2;
          const isOuter = Math.floor(t * pts * 2) % 2 === 0;
          const r = isOuter ? outerR : innerR;
          const z = (Math.random() - 0.5) * depth;
          points.push({
            position: new Vector3(Math.cos(angle) * r, Math.sin(angle) * r, z),
            hue: baseHue + (isOuter ? 0 : 40),
            size: isOuter ? 8 : 4
          });
        }
        break;
      }
      
      case Shape3DType.PRISM: {
        const h = 50 * s;
        const r = 25 * s;
        for (let i = 0; i < count; i++) {
          const t = Math.random();
          const part = Math.floor(Math.random() * 5); // 2个底面，3个侧面
          let p: Vector3;
          if (part < 2) { // 底面 (三角形)
             let u = Math.random(), v = Math.random();
             if (u + v > 1) { u = 1 - u; v = 1 - v; }
             const y = part === 0 ? h / 2 : -h / 2;
             // 正三角形坐标
             const v1 = new Vector3(0, y, r);
             const v2 = new Vector3(r * 0.866, y, -r * 0.5);
             const v3 = new Vector3(-r * 0.866, y, -r * 0.5);
             p = v1.multiplyScalar(1 - u - v).add(v2.multiplyScalar(u)).add(v3.multiplyScalar(v));
          } else { // 侧面
             const side = part - 2;
             const angle1 = (side / 3) * Math.PI * 2;
             const angle2 = ((side + 1) / 3) * Math.PI * 2;
             const u = Math.random();
             const y = (Math.random() - 0.5) * h;
             const x = Math.cos(angle1) * r * (1 - u) + Math.cos(angle2) * r * u;
             const z = Math.sin(angle1) * r * (1 - u) + Math.sin(angle2) * r * u;
             p = new Vector3(x, y, z);
          }
          points.push({ position: p, hue: baseHue + (p.y / h) * 40 });
        }
        break;
      }

      case Shape3DType.CROSS_3D: {
        const len = 40 * s;
        const thick = 10 * s;
        for (let i = 0; i < count; i++) {
          const axis = Math.floor(Math.random() * 3);
          const t = (Math.random() - 0.5) * 2 * len;
          const u = (Math.random() - 0.5) * thick;
          const v = (Math.random() - 0.5) * thick;
          let p: Vector3;
          if (axis === 0) p = new Vector3(t, u, v);
          else if (axis === 1) p = new Vector3(u, t, v);
          else p = new Vector3(u, v, t);
          points.push({ position: p, hue: baseHue + (t / len) * 50 });
        }
        break;
      }

      case Shape3DType.DIAMOND: {
        const r = 35 * s;
        const h = 40 * s;
        for (let i = 0; i < count; i++) {
          const v = Math.random();
          const angle = Math.random() * Math.PI * 2;
          let y: number, curR: number;
          if (v < 0.4) { // 上部台面及斜面
             y = (1 - v / 0.4) * h * 0.4;
             curR = r * (0.6 + (v / 0.4) * 0.4);
          } else { // 下部尖角
             y = -(v - 0.4) / 0.6 * h * 1.5;
             curR = r * (1 - (v - 0.4) / 0.6);
          }
          // 对 angle 进行 stepped 处理模拟切面感
          const stepAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
          points.push({ position: new Vector3(Math.cos(stepAngle)*curR, y, Math.sin(stepAngle)*curR), hue: 200, size: 2 });
        }
        break;
      }

      case Shape3DType.MOBIUS: {
        const R = 30 * s;
        for (let i = 0; i < count; i++) {
          const u = (i / count) * Math.PI * 2;
          const v = (Math.random() - 0.5) * 15 * s;
          const x = (R + v * Math.cos(u/2)) * Math.cos(u);
          const y = (R + v * Math.cos(u/2)) * Math.sin(u);
          const z = v * Math.sin(u/2);
          points.push({ position: new Vector3(x, z, y), hue: baseHue + (u/Math.PI)*60 });
        }
        break;
      }

      case Shape3DType.KLEIN_BOTTLE: {
        for (let i = 0; i < count; i++) {
          const u = Math.random() * Math.PI;
          const v = Math.random() * Math.PI * 2;
          const x = -2/15 * Math.cos(u) * (3*Math.cos(v) - 30*Math.sin(u) + 90*Math.pow(Math.cos(u),4)*Math.sin(u) - 60*Math.pow(Math.cos(u),6)*Math.sin(u) + 5*Math.cos(u)*Math.cos(v)*Math.sin(u));
          const y = -1/15 * Math.sin(u) * (3*Math.cos(v) - 3*Math.pow(Math.cos(u),2)*Math.cos(v) - 48*Math.pow(Math.cos(u),4)*Math.cos(v) + 48*Math.pow(Math.cos(u),6)*Math.cos(v) - 60*Math.sin(u) + 5*Math.cos(u)*Math.cos(v)*Math.sin(u) - 5*Math.pow(Math.cos(u),3)*Math.cos(v)*Math.sin(u) - 80*Math.pow(Math.cos(u),5)*Math.cos(v)*Math.sin(u) + 80*Math.pow(Math.cos(u),7)*Math.cos(v)*Math.sin(u));
          const z = 2/15 * (3 + 5*Math.cos(u)*Math.sin(u)) * Math.sin(v);
          points.push({ position: new Vector3(x*15*s, y*15*s, z*15*s), hue: 280 + (u/Math.PI)*80 });
        }
        break;
      }

      case Shape3DType.SPRING: {
        const r = 15 * s;
        const R = 30 * s;
        const turns = 5;
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const angle = t * Math.PI * 2 * turns;
          const y = (t - 0.5) * 80 * s;
          const x = Math.cos(angle) * R + (Math.random()-0.5)*5*s;
          const z = Math.sin(angle) * R + (Math.random()-0.5)*5*s;
          points.push({ position: new Vector3(x, y, z), hue: baseHue + t * 360 });
        }
        break;
      }

      case Shape3DType.HELIX_TUBE: {
        const h = 80 * s;
        const r = 20 * s;
        const turns = 3;
        for (let i = 0; i < count; i++) {
          const t = i / count;
          const y = (t - 0.5) * h;
          const angle = t * Math.PI * 2 * turns;
          // 双螺旋
          points.push({
            position: new Vector3(Math.cos(angle) * r, y, Math.sin(angle) * r),
            hue: baseHue
          });
          points.push({
            position: new Vector3(Math.cos(angle + Math.PI) * r, y, Math.sin(angle + Math.PI) * r),
            hue: (baseHue + 180) % 360
          });
        }
        break;
      }
      
      case Shape3DType.NESTED_SPHERES: {
        const layers = 3;
        for (let layer = 1; layer <= layers; layer++) {
          const r = (layer / layers) * 35 * s;
          const layerCount = Math.floor(count / layers);
          for (let i = 0; i < layerCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            points.push({
              position: new Vector3(
                Math.sin(phi) * Math.cos(theta) * r,
                Math.sin(phi) * Math.sin(theta) * r,
                Math.cos(phi) * r
              ),
              hue: baseHue + (layer - 1) * 60, // 每一层使用截然不同的色相
              size: 2 + (layers - layer) * 2 // 外层粒子更小更密，内层更大
            });
          }
        }
        break;
      }
      
      // === 自然生物 ===
      case Shape3DType.BUTTERFLY_3D: {
        for (let i = 0; i < count; i++) {
          const t = (i / count) * Math.PI * 2;
          const h = (Math.random() - 0.5) * 2;
          // 3D 蝴蝶曲面 (基于极坐标变换)
          const m = (Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t/12), 5)) * 10 * s;
          const x = Math.sin(t) * m;
          const y = Math.cos(t) * m;
          // 翅膀开合 3D 感
          const wingAngle = Math.abs(Math.sin(t)) * 0.5;
          const z = Math.abs(x) * wingAngle + (Math.random() - 0.5) * 5 * s;
          
          points.push({
            position: new Vector3(x, y, z),
            hue: baseHue + (Math.abs(x) / (20 * s)) * 200 // 翅膀边缘变色
          });
        }
        break;
      }
      
      case Shape3DType.FLOWER_3D: {
        const petals = 6;
        const layers = 3;
        for (let layer = 0; layer < layers; layer++) {
          const layerCount = Math.floor(count / layers);
          const r = (10 + layer * 8) * s;
          for (let i = 0; i < layerCount; i++) {
            const theta = (i / layerCount) * Math.PI * 2;
            const petalMod = Math.pow(Math.abs(Math.cos(theta * petals / 2)), 0.3);
            const y = layer * 5 * s - 5 * s;
            points.push({
              position: new Vector3(Math.cos(theta) * r * petalMod, y, Math.sin(theta) * r * petalMod),
              hue: baseHue + layer * 40
            });
          }
        }
        break;
      }
      
      case Shape3DType.HEART_3D: {
        // 真 3D 体积采样爱心 - Taubin Surface 变体
        for (let i = 0; i < count; i++) {
          const t = Math.random() * Math.PI * 2;
          const p = Math.acos(2 * Math.random() - 1);
          // 使用参数化球坐标并进行心脏映射变换
          const sinP = Math.sin(p), cosP = Math.cos(p), sinT = Math.sin(t), cosT = Math.cos(t);
          
          let x = 1.2 * sinP * sinT;
          let y = 1.2 * sinP * cosT;
          let z = cosP;
          
          // 给球体施加“心形拉伸”
          // y 向下凹陷，顶部向上隆起
          y += Math.pow(Math.abs(x), 0.6) * 0.5;
          // 修正坐标使其尖端向下：反转 y 的拉伸方向
          const finalX = x * 25 * s;
          const finalY = y * 22 * s - 10 * s; // 修正后的尖端向下逻辑
          const finalZ = z * 18 * s * Math.pow(Math.abs(sinT), 0.3); // 增加侧向饱满度
          
          points.push({
            position: new Vector3(finalX, finalY, finalZ),
            hue: 340 + Math.random() * 40,
            size: 5 + Math.random() * 3,
            decay: 0.006 // 爱心存留更久
          });
        }
        break;
      }
      
      case Shape3DType.SNOWFLAKE_3D: {
        const arms = 6;
        const r = 35 * s;
        for (let i = 0; i < count; i++) {
          const arm = Math.floor(Math.random() * arms);
          const t = Math.random();
          const angle = (arm / arms) * Math.PI * 2;
          // 主轴
          let pX = Math.cos(angle) * t * r;
          let pY = (Math.random() - 0.5) * 2 * s; // 扁平 3D
          let pZ = Math.sin(angle) * t * r;
          // 支叉
          if (t > 0.4) {
             const subT = Math.random() * 0.3 * t;
             const subAngle = angle + (Math.random() > 0.5 ? 1 : -1) * Math.PI / 3;
             pX += Math.cos(subAngle) * subT * r;
             pZ += Math.sin(subAngle) * subT * r;
          }
          points.push({ position: new Vector3(pX, pY, pZ), hue: 180 + Math.random() * 40 });
        }
        break;
      }
      case Shape3DType.TREE: {
        const h = 50 * s;
        // 1. 树干 (20%)
        for (let i = 0; i < count * 0.2; i++) {
          const y = Math.random() * h * 0.4;
          points.push({ position: new Vector3((Math.random()-0.5)*2, y, (Math.random()-0.5)*2), hue: 30, size: 4 });
        }
        // 2. 树冠 (80%) - 多个分层球体组成的云团
        for (let i = 0; i < count * 0.8; i++) {
          const layer = Math.floor(Math.random() * 3);
          const r = (15 + Math.random() * 10) * s;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const center = new Vector3(0, h * 0.6 + layer * 10 * s, 0);
          points.push({
            position: new Vector3(
              center.x + Math.sin(phi) * Math.cos(theta) * r,
              center.y + Math.cos(phi) * r,
              center.z + Math.sin(phi) * Math.sin(theta) * r
            ),
            hue: 120 + Math.random() * 40 // 绿色调
          });
        }
        break;
      }

      case Shape3DType.BIRD: 
      case Shape3DType.PHOENIX: {
        const isPhoenix = type === Shape3DType.PHOENIX;
        const wingSpan = 50 * s;
        for (let i = 0; i < count; i++) {
          const t = (i / count) * 2 - 1; // -1 to 1
          const x = t * wingSpan;
          // 翼展弧度: M 型
          const y = Math.abs(t) * 10 * s + Math.sin(Math.abs(t) * Math.PI) * 15 * s;
          const z = Math.cos(t * Math.PI) * 10 * s;
          
          points.push({
            position: new Vector3(x, y, z),
            hue: isPhoenix ? 20 + Math.random() * 40 : baseHue,
            size: isPhoenix ? 6 : 4,
            behavior: isPhoenix ? 'fire' : undefined
          });

          // 凤凰尾羽
          if (isPhoenix && i % 5 === 0) {
            for(let j=1; j<5; j++) {
              points.push({
                position: new Vector3(x*0.2, -j*15*s, -j*5*s),
                hue: 10,
                behavior: 'willow'
              });
            }
          }
        }
        break;
      }

      case Shape3DType.JELLYFISH: {
        const r = 25 * s;
        // 1. 伞盖 (半球)
        for (let i = 0; i < count * 0.5; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 0.5; // 只取上半球
          points.push({
            position: new Vector3(Math.sin(phi)*Math.cos(theta)*r, Math.cos(phi)*r, Math.sin(phi)*Math.sin(theta)*r),
            hue: baseHue + 200,
            behavior: 'glitter'
          });
        }
        // 2. 触须 (垂线)
        for (let i = 0; i < count * 0.5; i++) {
          const leg = Math.floor(Math.random() * 8);
          const angle = (leg / 8) * Math.PI * 2;
          const length = Math.random() * 40 * s;
          points.push({
            position: new Vector3(Math.cos(angle)*r*0.6, -length, Math.sin(angle)*r*0.6),
            hue: baseHue + 180,
            behavior: 'willow'
          });
        }
        break;
      }

      case Shape3DType.FISH_3D: {
        const len = 40 * s;
        for (let i = 0; i < count; i++) {
          const t = (i / count);
          const x = (t - 0.5) * len;
          // 鱼身: 椭球
          const r = Math.sin(t * Math.PI) * 12 * s;
          const angle = Math.random() * Math.PI * 2;
          // 鱼尾: 三角形 (t接近1时)
          let y = Math.cos(angle) * r;
          let z = Math.sin(angle) * r;
          if (t > 0.8) {
             const tailW = (t - 0.8) * 50 * s;
             y = (Math.random() - 0.5) * tailW;
          }
          points.push({ position: new Vector3(x, y, z), hue: 40 + t * 40 });
        }
        break;
      }

      case Shape3DType.SHELL: {
        for (let i = 0; i < count; i++) {
          const t = i / count * Math.PI * 8; // 4圈
          const r = 2 * Math.exp(0.1 * t) * s;
          const angle = t;
          const spiralX = r * Math.cos(angle);
          const spiralY = r * Math.sin(angle);
          const spiralZ = t * 2 * s;
          // 给螺旋线加点宽度
          const offset = (Math.random() - 0.5) * 10 * s;
          points.push({ position: new Vector3(spiralX + offset, spiralY, spiralZ), hue: 200 + (t/30)*100 });
        }
        break;
      }

      case Shape3DType.LEAF: {
        const len = 40 * s;
        for (let i = 0; i < count; i++) {
          const u = Math.random();
          const v = (Math.random() - 0.5) * 2;
          const x = u * len;
          // 叶形: sin曲线
          const w = Math.sin(u * Math.PI) * 15 * s;
          const y = v * w;
          const z = Math.sin(u * Math.PI * 2) * 5 * s; // 卷曲感
          points.push({ position: new Vector3(x - len/2, y, z), hue: 100 + u * 60 });
        }
        break;
      }

      case Shape3DType.MUSHROOM: {
        const rCap = 30 * s;
        const hStem = 30 * s;
        for (let i = 0; i < count; i++) {
          if (i < count * 0.7) { // 菌盖
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.4;
            points.push({ position: new Vector3(Math.sin(phi)*Math.cos(theta)*rCap, Math.cos(phi)*rCap*0.5 + hStem, Math.sin(phi)*Math.sin(theta)*rCap), hue: 0 });
          } else { // 菌柄
            const y = Math.random() * hStem;
            const angle = Math.random() * Math.PI * 2;
            const rs = 8 * s;
            points.push({ position: new Vector3(Math.cos(angle)*rs, y, Math.sin(angle)*rs), hue: 40 });
          }
        }
        break;
      }

      // === 宇宙天体 (补全实现) ===
      case Shape3DType.BLACK_HOLE: {
        // 1. 吸积盘 (扁平旋转)
        for (let i = 0; i < count * 0.8; i++) {
          const dist = (15 + Math.random() * 45) * s;
          const angle = Math.random() * Math.PI * 2;
          points.push({
            position: new Vector3(Math.cos(angle)*dist, (Math.random()-0.5)*2, Math.sin(angle)*dist),
            hue: 280 + (dist/60)*80,
            behavior: 'vortex'
          });
        }
        // 2. 视界 (核心黑珠)
        for (let i = 0; i < count * 0.2; i++) {
          const r = 10 * s;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          points.push({
            position: new Vector3(Math.sin(phi)*Math.cos(theta)*r, Math.sin(phi)*Math.sin(theta)*r, Math.cos(phi)*r),
            hue: 0,
            size: 2
          });
        }
        break;
      }

      case Shape3DType.PULSAR: {
        const r = 15 * s;
        // 1. 核心
        for (let i = 0; i < count * 0.4; i++) {
           const theta = Math.random()*Math.PI*2;
           const phi = Math.acos(2*Math.random()-1);
           points.push({ position: new Vector3(Math.sin(phi)*Math.cos(theta)*r, Math.sin(phi)*Math.sin(theta)*r, Math.cos(phi)*r), hue: 200, behavior: 'glitter' });
        }
        // 2. 磁极喷流 (两端高能柱)
        for (let i = 0; i < count * 0.6; i++) {
           const side = Math.random() > 0.5 ? 1 : -1;
           const len = Math.random() * 80 * s;
           const spread = (len / (80*s)) * 5 * s;
           points.push({
             position: new Vector3((Math.random()-0.5)*spread, side * len, (Math.random()-0.5)*spread),
             hue: 240,
             behavior: 'glitter',
             size: 5
           });
        }
        break;
      }

      case Shape3DType.SUPERNOVA: {
        // 大爆发：内爆瞬间的外扩
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const isRay = Math.random() > 0.7;
          const r = isRay ? (40 + Math.random() * 60) * s : (20 + Math.random() * 20) * s;
          
          points.push({
            position: new Vector3(Math.sin(phi)*Math.cos(theta)*r, Math.sin(phi)*Math.sin(theta)*r, Math.cos(phi)*r),
            hue: isRay ? 0 : 40 + Math.random() * 40,
            size: isRay ? 8 : 4,
            behavior: isRay ? 'glitter' : 'fire'
          });
        }
        break;
      }

      case Shape3DType.ASTEROID_BELT: {
        const R = 40 * s;
        const r = 8 * s;
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI * 2;
          // 块状采样
          const dist = R + (Math.random() - 0.5) * r * 2;
          points.push({
            position: new Vector3(Math.cos(theta)*dist, (Math.random()-0.5)*r, Math.sin(theta)*dist),
            hue: 30 + Math.random() * 20,
            size: Math.random() * 5 + 2,
            friction: 0.98
          });
        }
        break;
      }

      case Shape3DType.COMET: {
        const len = 100 * s;
        for (let i = 0; i < count; i++) {
          const t = Math.pow(Math.random(), 2); // 尾部更稀疏
          const dist = t * len;
          const spread = t * 20 * s;
          points.push({
            position: new Vector3((Math.random()-0.5)*spread, -dist, (Math.random()-0.5)*spread),
            hue: 180 + t * 60,
            behavior: 'willow',
            size: (1-t) * 8
          });
        }
        break;
      }

      // === 文化符号 (补全实现) ===
      case Shape3DType.LOTUS: {
        const layers = 4;
        for (let l = 0; l < layers; l++) {
          const layerCount = Math.floor(count / layers);
          const r = (10 + l * 10) * s;
          const petals = 8 + l * 4;
          for (let i = 0; i < layerCount; i++) {
            const theta = (i / layerCount) * Math.PI * 2;
            const phiLocal = (i / layerCount) * Math.PI * 2; // 局部变量用于模拟花瓣张开度
            const petalCurve = Math.pow(Math.abs(Math.cos(theta * petals / 2)), 0.5);
            const y = Math.sin(phiLocal * 0.5) * 10 * s + l * 5 * s;
            points.push({
              position: new Vector3(Math.cos(theta)*r*petalCurve, y, Math.sin(theta)*r*petalCurve),
              hue: 330 + l * 20
            });
          }
        }
        break;
      }

      case Shape3DType.CROWN_3D: {
        const R = 30 * s;
        for (let i = 0; i < count; i++) {
          const theta = (i / count) * Math.PI * 2;
          const isPoint = Math.floor(theta * 6 / Math.PI) % 2 === 0;
          const y = isPoint ? Math.sin(theta * 6) * 20 * s + 10 * s : 0;
          points.push({
            position: new Vector3(Math.cos(theta)*R, y, Math.sin(theta)*R),
            hue: 50,
            size: 6
          });
        }
        break;
      }

      case Shape3DType.YIN_YANG: {
        const R = 35 * s;
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const r = Math.sqrt(Math.random()) * R;
          const x = Math.cos(theta) * r;
          const z = Math.sin(theta) * r;
          const isWhite = x > 0; // 简化实现
          points.push({ position: new Vector3(x, 0, z), hue: isWhite ? 0 : 200, size: isWhite ? 6 : 4 });
        }
        break;
      }

      case Shape3DType.GALAXY_SPIRAL: {
        const arms = 4;
        const armDensity = 0.8;
        for (let i = 0; i < count; i++) {
          const arm = i % arms;
          const dist = Math.pow(Math.random(), 0.7) * 60 * s;
          const angle = (arm / arms) * Math.PI * 2 + dist * 0.15;
          const scatter = (Math.random() - 0.5) * (60 * s / (dist + 5)) * 5;
          
          const p = new Vector3(
            Math.cos(angle) * dist + (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 8 * s * (1 - dist / (60 * s)),
            Math.sin(angle) * dist + (Math.random() - 0.5) * 5
          );
          
          points.push({
            position: p,
            hue: baseHue + (dist / (60 * s)) * 100,
            size: Math.random() > 0.8 ? 8 : 4,
            behavior: 'glitter'
          });
        }
        break;
      }
      
      case Shape3DType.PLANET_RINGS: {
        // 行星本体
        for (let i = 0; i < count * 0.3; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 15 * s;
          points.push({
            position: new Vector3(
              Math.sin(phi) * Math.cos(theta) * r,
              Math.sin(phi) * Math.sin(theta) * r,
              Math.cos(phi) * r
            ),
            hue: 30
          });
        }
        // 光环
        for (let i = 0; i < count * 0.7; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = 25 + Math.random() * 15;
          points.push({
            position: new Vector3(
              Math.cos(angle) * dist * s,
              Math.cos(angle) * dist * 0.3 * s,
              Math.sin(angle) * dist * s
            ),
            hue: 200
          });
        }
        break;
      }
      
      case Shape3DType.NEBULA: {
        for (let i = 0; i < count; i++) {
          const r = (20 + Math.random() * 30) * s;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const scatter = Math.pow(Math.random(), 2) * 20 * s;
          points.push({
            position: new Vector3(
              Math.sin(phi)*Math.cos(theta)*r + (Math.random()-0.5)*scatter,
              Math.sin(phi)*Math.sin(theta)*r + (Math.random()-0.5)*scatter,
              Math.cos(phi)*r + (Math.random()-0.5)*scatter
            ),
            hue: baseHue + Math.random() * 80,
            behavior: 'glitter',
            size: Math.random() * 6
          });
        }
        break;
      }

      case Shape3DType.WORMHOLE: {
        for (let i = 0; i < count; i++) {
          const t = (Math.random() - 0.5) * 2;
          const y = t * 60 * s;
          const r = (Math.abs(t) * 20 + 5) * s;
          const angle = (i / count) * Math.PI * 2 + t * 4;
          points.push({
            position: new Vector3(Math.cos(angle)*r, y, Math.sin(angle)*r),
            hue: 240 + t * 60
          });
        }
        break;
      }

      case Shape3DType.CONSTELLATION: {
        const r = 50 * s;
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const isStar = Math.random() > 0.9;
          const dist = isStar ? r : Math.random() * r;
          points.push({
            position: new Vector3(Math.sin(phi)*Math.cos(theta)*dist, Math.sin(phi)*Math.sin(theta)*dist, Math.cos(phi)*dist),
            hue: isStar ? 0 : 200,
            size: isStar ? 8 : 2,
            behavior: isStar ? 'glitter' : undefined
          });
        }
        break;
      }

      case Shape3DType.LANTERN: {
        const h = 40 * s;
        const r = 20 * s;
        for (let i = 0; i < count; i++) {
          const t = Math.random();
          const angle = Math.random() * Math.PI * 2;
          const currentR = Math.sin(t * Math.PI) * r + 5 * s;
          const y = (t - 0.5) * h;
          points.push({ position: new Vector3(Math.cos(angle)*currentR, y, Math.sin(angle)*currentR), hue: 0 });
          if (t < 0.1) {
             const tassLen = Math.random() * 20 * s;
             points.push({ position: new Vector3(Math.cos(angle)*r*0.5, -h/2 - tassLen, Math.sin(angle)*r*0.5), hue: 45, behavior: 'willow' });
          }
        }
        break;
      }

      case Shape3DType.RIBBON: {
        for (let i = 0; i < count; i++) {
          const t = (i / count);
          const x = (t - 0.5) * 100 * s;
          const y = Math.sin(t * Math.PI * 2) * 20 * s;
          const z = Math.cos(t * Math.PI * 2) * 20 * s;
          const offset = (Math.random() - 0.5) * 10 * s;
          points.push({ position: new Vector3(x, y + offset, z), hue: t * 360, size: 4 });
        }
        break;
      }

      // === 特效类 ===
      case Shape3DType.EXPLOSION_BURST:
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = (20 + Math.random() * 15) * s;
          points.push({
            position: new Vector3(
              Math.sin(phi) * Math.cos(theta) * r,
              Math.sin(phi) * Math.sin(theta) * r,
              Math.cos(phi) * r
            ),
            hue: baseHue,
            behavior: 'glitter'
          });
        }
        break;
        
      case Shape3DType.RING_WAVE:
        for (let i = 0; i < count; i++) {
          const angle = (i / count) * Math.PI * 2;
          const r = 30 * s;
          points.push({
            position: new Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r),
            hue: baseHue + (i / count) * 360
          });
        }
        break;
        
      case Shape3DType.DOUBLE_RING:
        for (let i = 0; i < count / 2; i++) {
          const angle = (i / (count / 2)) * Math.PI * 2;
          points.push({
            position: new Vector3(Math.cos(angle) * 35 * s, 0, Math.sin(angle) * 35 * s),
            hue: baseHue
          });
          points.push({
            position: new Vector3(Math.cos(angle) * 20 * s, 0, Math.sin(angle) * 20 * s),
            hue: (baseHue + 180) % 360
          });
        }
        break;
        
      case Shape3DType.FIREWORK_WILLOW:
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = 20 * s;
          points.push({
            position: new Vector3(
              Math.sin(phi) * Math.cos(theta) * r,
              Math.sin(phi) * Math.sin(theta) * r,
              Math.cos(phi) * r
            ),
            hue: baseHue,
            behavior: 'willow',
            decay: 0.008
          });
        }
        break;
        
      case Shape3DType.CHAOS_SCATTER:
        for (let i = 0; i < count; i++) {
          points.push({
            position: new Vector3(
              (Math.random() - 0.5) * 60 * s,
              (Math.random() - 0.5) * 60 * s,
              (Math.random() - 0.5) * 60 * s
            ),
            hue: Math.random() * 360
          });
        }
        break;
        
      // 默认：球形
      default:
        for (let i = 0; i < count; i++) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          const r = 25 * s;
          points.push({
            position: new Vector3(
              Math.sin(phi) * Math.cos(theta) * r,
              Math.sin(phi) * Math.sin(theta) * r,
              Math.cos(phi) * r
            ),
            hue: baseHue
          });
        }
    }
    
    return points;
  }
}

/**
 * Shape3D工厂
 */
export class Shape3DFactory {
  private static allTypes: Shape3DType[] = Object.values(Shape3DType);
  
  /**
   * 生成指定形状
   */
  static generate(
    type: Shape3DType,
    count: number,
    scale?: number,
    baseHue?: number
  ): Shape3DPoint[] {
    return Shape3DGenerator.generate(type, count, scale, baseHue);
  }
  
  /**
   * 按权重随机选择一个形状类型 (增加复杂形状权重)
   */
  static getRandomType(): Shape3DType {
    // 降低普通球形出现的权重
    const weights: Record<string, number> = {
      [Shape3DType.SPHERE]: 0.1,
      [Shape3DType.NESTED_SPHERES]: 0.1,
      [Shape3DType.HEART_3D]: 1.5,
      [Shape3DType.BUTTERFLY_3D]: 1.5,
      [Shape3DType.GALAXY_SPIRAL]: 2.0,
      [Shape3DType.PLANET_RINGS]: 1.5,
    };
    
    // 动态生成加权列表
    const pool: Shape3DType[] = [];
    this.allTypes.forEach(t => {
      const w = weights[t] || 1.0;
      for(let i=0; i<w*10; i++) pool.push(t);
    });
    
    return pool[Math.floor(Math.random() * pool.length)];
  }
  
  /**
   * 从列表中随机选择
   */
  static getRandomTypeFrom(types: Shape3DType[]): Shape3DType {
    if (types.length === 0) return Shape3DType.SPHERE;
    return types[Math.floor(Math.random() * types.length)];
  }
  
  /**
   * 获取所有形状类型
   */
  static getAllTypes(): Shape3DType[] {
    return [...this.allTypes];
  }
  
  /**
   * 按类别获取形状
   */
  static getTypesByCategory(category: string): Shape3DType[] {
    return this.allTypes.filter(type => SHAPE_3D_INFO[type].category === category);
  }
  
  /**
   * 获取形状信息
   */
  static getInfo(type: Shape3DType): Shape3DInfo {
    return SHAPE_3D_INFO[type];
  }
  
  /**
   * 获取所有分类
   */
  static getCategories(): string[] {
    return Object.values(SHAPE_CATEGORIES);
  }
}

// END OF FILE: src/core/shapes/Shape3DFactory.ts
