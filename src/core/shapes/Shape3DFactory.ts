import * as THREE from 'three';

// Biologic
import { generatePhoenix, PHOENIX_COLOR } from './definitions/biologic/PhoenixShape';
import { generateDragon, DRAGON_COLOR } from './definitions/biologic/DragonShape';
import { generateButterfly, BUTTERFLY_COLOR } from './definitions/biologic/ButterflyShape';

// Culture
import { generateHeart, HEART_COLOR } from './definitions/culture/HeartShape';
import { generateLantern, LANTERN_COLOR } from './definitions/culture/LanternShape';
import { generateLotus, LOTUS_COLOR } from './definitions/culture/LotusShape';
import { generateCrown, CROWN_COLOR } from './definitions/culture/CrownShape';
import { generateYinYang, YIN_YANG_COLOR } from './definitions/culture/YinYangShape';
import { generateRibbon, RIBBON_COLOR } from './definitions/culture/RibbonShape';
import { generateFireworkClassic, FIREWORK_CLASSIC_COLOR } from './definitions/culture/FireworkClassicShape';
import { generateFireworkWillow, FIREWORK_WILLOW_COLOR } from './definitions/culture/FireworkWillowShape';

// Geometry
import { generateCube, CUBE_COLOR } from './definitions/geometry/CubeShape';
import { generateTorus, TORUS_COLOR } from './definitions/geometry/TorusShape';
import { generateStar, STAR_COLOR } from './definitions/geometry/StarShape';
import { generateMobius, MOBIUS_COLOR } from './definitions/geometry/MobiusShape';
import { generatePyramid, PYRAMID_COLOR } from './definitions/geometry/PyramidShape';
import { generateOctahedron, OCTAHEDRON_COLOR } from './definitions/geometry/OctahedronShape';
import { generateCylinder, CYLINDER_COLOR } from './definitions/geometry/CylinderShape';
import { generateCone, CONE_COLOR } from './definitions/geometry/ConeShape';
import { generateDiamond, DIAMOND_COLOR } from './definitions/geometry/DiamondShape';

// Cosmos
import { generateGalaxy, GALAXY_COLOR } from './definitions/cosmos/GalaxyShape';
import { generatePlanetRings, PLANET_RINGS_COLOR } from './definitions/cosmos/PlanetRingsShape';
import { generateBlackHole, BLACK_HOLE_COLOR } from './definitions/cosmos/BlackHoleShape';
import { generateNebula, NEBULA_COLOR } from './definitions/cosmos/NebulaShape';
import { generateSupernova, SUPERNOVA_COLOR } from './definitions/cosmos/SupernovaShape';
import { generateComet, COMET_COLOR } from './definitions/cosmos/CometShape';
import { generateConstellation, CONSTELLATION_COLOR } from './definitions/cosmos/ConstellationShape';
import { generatePulsar, PULSAR_COLOR } from './definitions/cosmos/PulsarShape';
import { generateWormhole, WORMHOLE_COLOR } from './definitions/cosmos/WormholeShape';
import { generateAsteroidBelt, ASTEROID_BELT_COLOR } from './definitions/cosmos/AsteroidBeltShape';

// Nature
import { generateTree, TREE_COLOR } from './definitions/nature/TreeShape';
import { generateJellyfish, JELLYFISH_COLOR } from './definitions/nature/JellyfishShape';
import { generateSnowflake, SNOWFLAKE_COLOR } from './definitions/nature/SnowflakeShape';
import { generateFlower, FLOWER_COLOR } from './definitions/nature/FlowerShape';
import { generateBird, BIRD_COLOR } from './definitions/nature/BirdShape';
import { generateShell, SHELL_COLOR } from './definitions/nature/ShellShape';
import { generateLeaf, LEAF_COLOR } from './definitions/nature/LeafShape';
import { generateMushroom, MUSHROOM_COLOR } from './definitions/nature/MushroomShape';
import { generateFish, FISH_COLOR } from './definitions/nature/FishShape';

// Effect
import { generateCascade, CASCADE_COLOR } from './definitions/effect/CascadeShape';
import { generateFountain, FOUNTAIN_COLOR } from './definitions/effect/FountainShape';
import { generateShockwave, SHOCKWAVE_COLOR } from './definitions/effect/ShockwaveShape';
import { generateExplosionBurst, EXPLOSION_BURST_COLOR } from './definitions/effect/ExplosionBurstShape';
import { generateRingWave, RING_WAVE_COLOR } from './definitions/effect/RingWaveShape';
import { generateDoubleRing, DOUBLE_RING_COLOR } from './definitions/effect/DoubleRingShape';
import { generateVortex, VORTEX_COLOR } from './definitions/effect/VortexShape';
import { generateSparkleCloud, SPARKLE_CLOUD_COLOR } from './definitions/effect/SparkleCloudShape';
import { generateChaosScatter, CHAOS_SCATTER_COLOR } from './definitions/effect/ChaosScatterShape';
import { generateNestedSpheres, NESTED_SPHERES_COLOR } from './definitions/effect/NestedSpheresShape';

export enum Shape3DType {
  // 几何
  SPHERE = 'sphere', CUBE = 'cube', PYRAMID = 'pyramid', OCTAHEDRON = 'octahedron',
  TORUS = 'torus', CYLINDER = 'cylinder', CONE = 'cone', STAR_3D = 'star_3d',
  DIAMOND = 'diamond', MOBIUS = 'mobius',
  // 自然
  BUTTERFLY_3D = 'butterfly_3d', FLOWER_3D = 'flower_3d', TREE = 'tree',
  BIRD = 'bird', JELLYFISH = 'jellyfish', SHELL = 'shell',
  SNOWFLAKE_3D = 'snowflake_3d', LEAF = 'leaf', MUSHROOM = 'mushroom', FISH_3D = 'fish_3d',
  // 文化
  HEART_3D = 'heart_3d', PHOENIX = 'phoenix', DRAGON_3D = 'dragon_3d',
  CROWN_3D = 'crown_3d', LOTUS = 'lotus', LANTERN = 'lantern',
  YIN_YANG = 'yin_yang', RIBBON = 'ribbon',
  FIREWORK_CLASSIC = 'firework_classic', FIREWORK_WILLOW = 'firework_willow',
  // 宇宙
  GALAXY_SPIRAL = 'galaxy_spiral', PLANET_RINGS = 'planet_rings', NEBULA = 'nebula',
  BLACK_HOLE = 'black_hole', SUPERNOVA = 'supernova', COMET = 'comet',
  CONSTELLATION = 'constellation', PULSAR = 'pulsar', WORMHOLE = 'wormhole', ASTEROID_BELT = 'asteroid_belt',
  // 特效
  EXPLOSION_BURST = 'explosion_burst', RING_WAVE = 'ring_wave', DOUBLE_RING = 'double_ring',
  CASCADE = 'cascade', FOUNTAIN = 'fountain', VORTEX = 'vortex',
  SHOCKWAVE = 'shockwave', SPARKLE_CLOUD = 'sparkle_cloud',
  CHAOS_SCATTER = 'chaos_scatter', NESTED_SPHERES = 'nested_spheres',
}

export class Shape3DGenerator {
  static generate(type: Shape3DType, count: number, scale: number = 1): Float32Array {
    let result: Float32Array;
    switch (type) {
      // --- 1. 生物类 (Biologic) ---
      case Shape3DType.PHOENIX: result = generatePhoenix(count, scale); break;
      case Shape3DType.DRAGON_3D: result = generateDragon(count, scale); break;
      case Shape3DType.BUTTERFLY_3D: result = generateButterfly(count, scale); break;

      // --- 2. 文化类 (Culture) ---
      case Shape3DType.HEART_3D: result = generateHeart(count, scale); break;
      case Shape3DType.LANTERN: result = generateLantern(count, scale); break;
      case Shape3DType.LOTUS: result = generateLotus(count, scale); break;
      case Shape3DType.CROWN_3D: result = generateCrown(count, scale); break;
      case Shape3DType.YIN_YANG: result = generateYinYang(count, scale); break;
      case Shape3DType.RIBBON: result = generateRibbon(count, scale); break;
      case Shape3DType.FIREWORK_CLASSIC: result = generateFireworkClassic(count, scale); break;
      case Shape3DType.FIREWORK_WILLOW: result = generateFireworkWillow(count, scale); break;

      // --- 3. 几何类 (Geometry) ---
      case Shape3DType.CUBE: result = generateCube(count, scale); break;
      case Shape3DType.TORUS: result = generateTorus(count, scale); break;
      case Shape3DType.PYRAMID: result = generatePyramid(count, scale); break;
      case Shape3DType.OCTAHEDRON: result = generateOctahedron(count, scale); break;
      case Shape3DType.CYLINDER: result = generateCylinder(count, scale); break;
      case Shape3DType.CONE: result = generateCone(count, scale); break;
      case Shape3DType.STAR_3D: result = generateStar(count, scale); break;
      case Shape3DType.DIAMOND: result = generateDiamond(count, scale); break;
      case Shape3DType.MOBIUS: result = generateMobius(count, scale); break;

      // --- 4. 宇宙类 (Cosmos) ---
      case Shape3DType.GALAXY_SPIRAL: result = generateGalaxy(count, scale); break;
      case Shape3DType.PLANET_RINGS: result = generatePlanetRings(count, scale); break;
      case Shape3DType.BLACK_HOLE: result = generateBlackHole(count, scale); break;
      case Shape3DType.NEBULA: result = generateNebula(count, scale); break;
      case Shape3DType.SUPERNOVA: result = generateSupernova(count, scale); break;
      case Shape3DType.COMET: result = generateComet(count, scale); break;
      case Shape3DType.CONSTELLATION: result = generateConstellation(count, scale); break;
      case Shape3DType.PULSAR: result = generatePulsar(count, scale); break;
      case Shape3DType.WORMHOLE: result = generateWormhole(count, scale); break;
      case Shape3DType.ASTEROID_BELT: result = generateAsteroidBelt(count, scale); break;

      // --- 5. 自然类 (Nature) ---
      case Shape3DType.TREE: result = generateTree(count, scale); break;
      case Shape3DType.JELLYFISH: result = generateJellyfish(count, scale); break;
      case Shape3DType.SNOWFLAKE_3D: result = generateSnowflake(count, scale); break;
      case Shape3DType.FLOWER_3D: result = generateFlower(count, scale); break;
      case Shape3DType.BIRD: result = generateBird(count, scale); break;
      case Shape3DType.SHELL: result = generateShell(count, scale); break;
      case Shape3DType.LEAF: result = generateLeaf(count, scale); break;
      case Shape3DType.MUSHROOM: result = generateMushroom(count, scale); break;
      case Shape3DType.FISH_3D: result = generateFish(count, scale); break;

      // --- 6. 特效类 (Effect) ---
      case Shape3DType.CASCADE: result = generateCascade(count, scale); break;
      case Shape3DType.FOUNTAIN: result = generateFountain(count, scale); break;
      case Shape3DType.SHOCKWAVE: result = generateShockwave(count, scale); break;
      case Shape3DType.EXPLOSION_BURST: result = generateExplosionBurst(count, scale); break;
      case Shape3DType.RING_WAVE: result = generateRingWave(count, scale); break;
      case Shape3DType.DOUBLE_RING: result = generateDoubleRing(count, scale); break;
      case Shape3DType.VORTEX: result = generateVortex(count, scale); break;
      case Shape3DType.SPARKLE_CLOUD: result = generateSparkleCloud(count, scale); break;
      case Shape3DType.CHAOS_SCATTER: result = generateChaosScatter(count, scale); break;
      case Shape3DType.NESTED_SPHERES: result = generateNestedSpheres(count, scale); break;

      case Shape3DType.SPHERE:
      default:
        result = this.generateSphere(count, scale);
        break;
    }


    // 后处理：强制规范化到 30x30x30 的空间内 (即坐标范围在 -15 到 15)
    // 这样做可以确保无论内部是怎么写的，最终在场景中都是统一的可控大小
    return this.normalizeTo30(result, scale);
  }

  /**
   * 规范化形状到 30x30x30 的容器内
   */
  private static normalizeTo30(positions: Float32Array, scale: number): Float32Array {
    let maxDist = 0;
    const count = positions.length / 3;

    // 1. 找到当前形状的最大半径 (L-infinity norm)
    for (let i = 0; i < positions.length; i++) {
        const absVal = Math.abs(positions[i]);
        if (absVal > maxDist) maxDist = absVal;
    }

    // 2. 如果 maxDist 为 0，说明有问题，直接返回
    if (maxDist < 0.0001) return positions;

    // 3. 计算缩放系数，使得最大边长变为 30 (即半径 15)
    // 同时结合用户提供的 scale 参数
    const targetRadius = 15;
    const factor = (targetRadius / maxDist) * scale;

    for (let i = 0; i < positions.length; i++) {
        positions[i] *= factor;
    }

    return positions;
  }



  static getShapeColor(type: Shape3DType): number {
    switch(type) {
      case Shape3DType.PHOENIX: return 0xFF4500; // OrangeRed
      case Shape3DType.DRAGON_3D: return 0xFFD700; // Gold
      case Shape3DType.BUTTERFLY_3D: return 0xDA70D6; // Orchid
      
      case Shape3DType.HEART_3D: return 0xFF1493; // DeepPink
      case Shape3DType.LANTERN: return 0xFF0000; // Red
      case Shape3DType.LOTUS: return 0xFFC0CB; // Pink
      case Shape3DType.CROWN_3D: return 0xFFD700; // Gold
      case Shape3DType.YIN_YANG: return 0xF5F5F5; // WhiteSmoke
      case Shape3DType.RIBBON: return 0xDC143C; // Crimson
      case Shape3DType.FIREWORK_CLASSIC: return 0xFFA500; // Orange
      case Shape3DType.FIREWORK_WILLOW: return 0xEEE8AA; // PaleGoldenRod
      
      case Shape3DType.CUBE: return 0x00FFFF; // Cyan
      case Shape3DType.TORUS: return 0x32CD32; // LimeGreen
      case Shape3DType.STAR_3D: return 0xFFFF00; // Yellow
      case Shape3DType.MOBIUS: return 0xFF00FF; // Magenta
      case Shape3DType.PYRAMID: return 0xFFD700; // Gold
      case Shape3DType.OCTAHEDRON: return 0x1E90FF; // DodgerBlue
      case Shape3DType.CYLINDER: return 0x8B4513; // SaddleBrown
      case Shape3DType.CONE: return 0xCD853F; // Peru
      case Shape3DType.DIAMOND: return 0xAFEEEE; // PaleTurquoise
      
      case Shape3DType.GALAXY_SPIRAL: return 0x9370DB; // MediumPurple
      case Shape3DType.PLANET_RINGS: return 0xFFA07A; // LightSalmon
      case Shape3DType.BLACK_HOLE: return 0x483D8B; // DarkSlateBlue
      case Shape3DType.NEBULA: return 0xBA55D3; // MediumOrchid
      case Shape3DType.SUPERNOVA: return 0xFF6347; // Tomato
      case Shape3DType.COMET: return 0xF0F8FF; // AliceBlue
      case Shape3DType.CONSTELLATION: return 0x87CEFA; // LightSkyBlue
      case Shape3DType.PULSAR: return 0x00FA9A; // MediumSpringGreen
      case Shape3DType.WORMHOLE: return 0x9932CC; // DarkOrchid
      case Shape3DType.ASTEROID_BELT: return 0x808080; // Gray
      
      case Shape3DType.TREE: return 0x228B22; // ForestGreen
      case Shape3DType.JELLYFISH: return 0x7FFFD4; // Aquamarine
      case Shape3DType.SNOWFLAKE_3D: return 0xE0FFFF; // LightCyan
      case Shape3DType.FLOWER_3D: return 0xFF69B4; // HotPink
      case Shape3DType.BIRD: return 0xF0E68C; // Khaki
      case Shape3DType.SHELL: return 0xFFF5EE; // SeaShell
      case Shape3DType.LEAF: return 0xADFF2F; // GreenYellow
      case Shape3DType.MUSHROOM: return 0xBC8F8F; // RosyBrown
      case Shape3DType.FISH_3D: return 0x20B2AA; // LightSeaGreen
      
      case Shape3DType.CASCADE: return 0x00CED1; // DarkTurquoise
      case Shape3DType.FOUNTAIN: return 0x1E90FF; // DodgerBlue
      case Shape3DType.SHOCKWAVE: return 0xFFF0F5; // LavenderBlush
      case Shape3DType.EXPLOSION_BURST: return 0xFF4500; // OrangeRed
      case Shape3DType.RING_WAVE: return 0x7FFF00; // Chartreuse
      case Shape3DType.DOUBLE_RING: return 0x32CD32; // LimeGreen
      case Shape3DType.VORTEX: return 0x9400D3; // DarkViolet
      case Shape3DType.SPARKLE_CLOUD: return 0xFFFFE0; // LightYellow
      case Shape3DType.CHAOS_SCATTER: return 0xFF69B4; // HotPink
      case Shape3DType.NESTED_SPHERES: return 0x00BFFF; // DeepSkyBlue
      
      default: return 0xFFFFFF;
    }
  }

  private static generateSphere(count: number, scale: number): Float32Array {
    const p = new Float32Array(count * 3);
    const r = 100 * scale;
    for (let i = 0; i < count; i++) {
        const phi = Math.acos(2 * Math.random() - 1);
        const theta = Math.random() * Math.PI * 2;
        p[i*3] = r * Math.sin(phi) * Math.cos(theta);
        p[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        p[i*3+2] = r * Math.cos(phi);
    }
    return p;
  }
}

// 导出别名以兼容旧代码
export const Shape3DFactory = Shape3DGenerator;

export const SHAPE_3D_INFO: Record<Shape3DType, { name: string, category: string, description: string, icon: string }> = {
  // 几何
  [Shape3DType.SPHERE]: { name: '球体', category: '几何', description: '基础球体', icon: '⚪' },
  [Shape3DType.CUBE]: { name: '立方体', category: '几何', description: '六面体', icon: '🧊' },
  [Shape3DType.PYRAMID]: { name: '金字塔', category: '几何', description: '四角锥', icon: '🔺' },
  [Shape3DType.OCTAHEDRON]: { name: '八面体', category: '几何', description: '钻石结构', icon: '🔷' },
  [Shape3DType.TORUS]: { name: '环面', category: '几何', description: '甜甜圈形状', icon: '🍩' },
  [Shape3DType.CYLINDER]: { name: '圆柱体', category: '几何', description: '柱状结构', icon: '🛢️' },
  [Shape3DType.CONE]: { name: '圆锥体', category: '几何', description: '锥形', icon: 'A' },
  [Shape3DType.STAR_3D]: { name: '五角星', category: '几何', description: '3D星形', icon: '⭐' },
  [Shape3DType.DIAMOND]: { name: '钻石', category: '几何', description: '晶体结构', icon: '💎' },
  [Shape3DType.MOBIUS]: { name: '莫比乌斯', category: '几何', description: '无限循环', icon: '♾️' },

  // 自然
  [Shape3DType.BUTTERFLY_3D]: { name: '蝴蝶', category: '自然', description: '翩翩起舞', icon: '🦋' },
  [Shape3DType.FLOWER_3D]: { name: '花朵', category: '自然', description: '盛开花朵', icon: '🌺' },
  [Shape3DType.TREE]: { name: '树', category: '自然', description: '生命之树', icon: '🌳' },
  [Shape3DType.BIRD]: { name: '飞鸟', category: '自然', description: '翱翔天际', icon: '🕊️' },
  [Shape3DType.JELLYFISH]: { name: '水母', category: '自然', description: '深海生物', icon: '🪼' },
  [Shape3DType.SHELL]: { name: '贝壳', category: '自然', description: '螺旋贝壳', icon: '🐚' },
  [Shape3DType.SNOWFLAKE_3D]: { name: '雪花', category: '自然', description: '冰晶', icon: '❄️' },
  [Shape3DType.LEAF]: { name: '树叶', category: '自然', description: '飘落叶片', icon: '🍃' },
  [Shape3DType.MUSHROOM]: { name: '蘑菇', category: '自然', description: '森林菌类', icon: '🍄' },
  [Shape3DType.FISH_3D]: { name: '鱼', category: '自然', description: '水中游鱼', icon: '🐟' },

  // 文化
  [Shape3DType.HEART_3D]: { name: '爱心', category: '文化', description: '浪漫爱心', icon: '❤️' },
  [Shape3DType.PHOENIX]: { name: '凤凰', category: '文化', description: '浴火重生', icon: '🐦' },
  [Shape3DType.DRAGON_3D]: { name: '龙', category: '文化', description: '腾飞巨龙', icon: '🐉' },
  [Shape3DType.CROWN_3D]: { name: '皇冠', category: '文化', description: '至尊皇冠', icon: '👑' },
  [Shape3DType.LOTUS]: { name: '莲花', category: '文化', description: '出水芙蓉', icon: '🪷' },
  [Shape3DType.LANTERN]: { name: '灯笼', category: '文化', description: '节日红灯笼', icon: '🏮' },
  [Shape3DType.YIN_YANG]: { name: '阴阳', category: '文化', description: '道家太极', icon: '☯️' },
  [Shape3DType.RIBBON]: { name: '丝带', category: '文化', description: '舞动的丝带', icon: '🎗️' },
  [Shape3DType.FIREWORK_CLASSIC]: { name: '经典烟花', category: '文化', description: '传统球形', icon: '🎆' },
  [Shape3DType.FIREWORK_WILLOW]: { name: '柳垂烟花', category: '文化', description: '金柳垂丝', icon: '✨' },

  // 宇宙
  [Shape3DType.GALAXY_SPIRAL]: { name: '星系', category: '宇宙', description: '旋涡星系', icon: '🌌' },
  [Shape3DType.PLANET_RINGS]: { name: '土星环', category: '宇宙', description: '带环行星', icon: '🪐' },
  [Shape3DType.NEBULA]: { name: '星云', category: '宇宙', description: '弥漫星云', icon: '🌫️' },
  [Shape3DType.BLACK_HOLE]: { name: '黑洞', category: '宇宙', description: '引力奇点', icon: '🕳️' },
  [Shape3DType.SUPERNOVA]: { name: '超新星', category: '宇宙', description: '星体爆发', icon: '💥' },
  [Shape3DType.COMET]: { name: '彗星', category: '宇宙', description: '拖尾彗星', icon: '☄️' },
  [Shape3DType.CONSTELLATION]: { name: '星座', category: '宇宙', description: '星群连线', icon: '✨' },
  [Shape3DType.PULSAR]: { name: '脉冲星', category: '宇宙', description: '旋转中子星', icon: '⚡' },
  [Shape3DType.WORMHOLE]: { name: '虫洞', category: '宇宙', description: '时空隧道', icon: '🌀' },
  [Shape3DType.ASTEROID_BELT]: { name: '小行星带', category: '宇宙', description: '环绕碎石', icon: '🌑' },

  // 特效
  [Shape3DType.EXPLOSION_BURST]: { name: '爆发', category: '特效', description: '能量爆发', icon: '💥' },
  [Shape3DType.RING_WAVE]: { name: '环状波', category: '特效', description: '涟漪扩散', icon: '◎' },
  [Shape3DType.DOUBLE_RING]: { name: '双环', category: '特效', description: '双重环绕', icon: '⍉' },
  [Shape3DType.CASCADE]: { name: '级联', category: '特效', description: '瀑布流', icon: '🌊' },
  [Shape3DType.FOUNTAIN]: { name: '喷泉', category: '特效', description: '向上喷涌', icon: '⛲' },
  [Shape3DType.VORTEX]: { name: '涡流', category: '特效', description: '旋转涡流', icon: '🌪️' },
  [Shape3DType.SHOCKWAVE]: { name: '激波', category: '特效', description: '冲击波', icon: '⭕' },
  [Shape3DType.SPARKLE_CLOUD]: { name: '闪烁云', category: '特效', description: '星光点点', icon: '✨' },
  [Shape3DType.CHAOS_SCATTER]: { name: '混沌', category: '特效', description: '无序运动', icon: '💢' },
  [Shape3DType.NESTED_SPHERES]: { name: '嵌套球', category: '特效', description: '多层球体', icon: '🔮' },
};

// 形状分类 - 用于 UI 菜单
export const SHAPE_CATEGORIES = {
  BASIC_GEOMETRY: '几何',
  NATURE: '自然',
  CULTURE: '文化',
  COSMOS: '宇宙',
  EFFECTS: '特效',
} as const;
