/**
 * PBRMaterial.ts - 物理基础渲染材质系统
 * 
 * 功能特性：
 * - 粗糙度 (Roughness) - 控制光线散射
 * - 金属度 (Metalness) - 控制镜面反射
 * - 自发光 (Emissive) - 烟花的核心光源
 * - HDR 支持 - 超过1.0的亮度值
 * 
 * 用于创建无法区分真实与虚拟的烟花效果
 */

import * as THREE from 'three';

/**
 * 粒子 PBR 属性
 */
export interface ParticlePBRProperties {
  roughness: number;      // 0-1, 0=完全光滑(镜面), 1=完全粗糙(漫反射)
  metalness: number;      // 0-1, 0=非金属(塑料), 1=金属(高反射)
  emissiveIntensity: number; // HDR 发光强度, 可超过 1.0
  temperature: number;    // 色温控制, 2000K-10000K
}

/**
 * 预设的粒子材质类型
 */
export enum ParticleMaterialType {
  SPARK = 'spark',           // 火花 - 高金属度，中等粗糙度
  EMBER = 'ember',           // 余烬 - 低金属度，高粗糙度
  GLITTER = 'glitter',       // 闪粉 - 高金属度，低粗糙度
  SMOKE = 'smoke',           // 烟雾 - 透明漫反射
  STAR_CORE = 'star_core',   // 星芯 - 极高发光强度
  PLASMA = 'plasma',         // 等离子 - 高发光，低粗糙度
  CRYSTAL = 'crystal',       // 水晶 - 中等金属度，极低粗糙度
}

/**
 * 材质预设配置
 */
export const PBR_PRESETS: Record<ParticleMaterialType, ParticlePBRProperties> = {
  [ParticleMaterialType.SPARK]: {
    roughness: 0.3,
    metalness: 0.9,
    emissiveIntensity: 3.0,
    temperature: 3000
  },
  [ParticleMaterialType.EMBER]: {
    roughness: 0.8,
    metalness: 0.2,
    emissiveIntensity: 1.5,
    temperature: 2000
  },
  [ParticleMaterialType.GLITTER]: {
    roughness: 0.1,
    metalness: 1.0,
    emissiveIntensity: 4.0,
    temperature: 6500
  },
  [ParticleMaterialType.SMOKE]: {
    roughness: 1.0,
    metalness: 0.0,
    emissiveIntensity: 0.0,
    temperature: 5000
  },
  [ParticleMaterialType.STAR_CORE]: {
    roughness: 0.0,
    metalness: 0.5,
    emissiveIntensity: 8.0,
    temperature: 8000
  },
  [ParticleMaterialType.PLASMA]: {
    roughness: 0.05,
    metalness: 0.7,
    emissiveIntensity: 5.0,
    temperature: 10000
  },
  [ParticleMaterialType.CRYSTAL]: {
    roughness: 0.02,
    metalness: 0.6,
    emissiveIntensity: 2.5,
    temperature: 7000
  }
};

/**
 * 根据色温计算 RGB 颜色 (Planckian Locus)
 * 基于 Tanner Helland 的近似算法
 */
export function temperatureToRGB(kelvin: number): { r: number; g: number; b: number } {
  const temp = kelvin / 100;
  let r: number, g: number, b: number;
  
  // 红色通道
  if (temp <= 66) {
    r = 255;
  } else {
    r = temp - 60;
    r = 329.698727446 * Math.pow(r, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }
  
  // 绿色通道
  if (temp <= 66) {
    g = temp;
    g = 99.4708025861 * Math.log(g) - 161.1195681661;
  } else {
    g = temp - 60;
    g = 288.1221695283 * Math.pow(g, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));
  
  // 蓝色通道
  if (temp >= 66) {
    b = 255;
  } else if (temp <= 19) {
    b = 0;
  } else {
    b = temp - 10;
    b = 138.5177312231 * Math.log(b) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }
  
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255
  };
}

/**
 * HDR 颜色处理 - 支持超过 1.0 的亮度
 */
export function createHDRColor(
  hue: number,
  saturation: number,
  intensity: number
): THREE.Color {
  const color = new THREE.Color();
  color.setHSL(hue / 360, saturation, 0.5);
  
  // HDR 强度：允许超过 1.0
  color.r *= intensity;
  color.g *= intensity;
  color.b *= intensity;
  
  return color;
}

/**
 * 创建高级粒子材质着色器
 * 支持：PBR 属性、HDR、自发光、柔和边缘
 */
export function createAdvancedParticleMaterial(): THREE.ShaderMaterial {
  const vertexShader = `
    attribute float size;
    attribute float alpha;
    attribute vec3 particleColor;
    attribute float roughness;
    attribute float metalness;
    attribute float emissive;
    
    varying vec3 vColor;
    varying float vAlpha;
    varying float vRoughness;
    varying float vMetalness;
    varying float vEmissive;
    varying float vDistance;
    
    void main() {
      vColor = particleColor;
      vAlpha = alpha;
      vRoughness = roughness;
      vMetalness = metalness;
      vEmissive = emissive;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vDistance = -mvPosition.z;
      
      // 基于距离的大小衰减 (更物理准确)
      float sizeAttenuation = 300.0 / (-mvPosition.z);
      gl_PointSize = size * sizeAttenuation;
      gl_PointSize = clamp(gl_PointSize, 1.0, 128.0);
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `;
  
  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    varying float vRoughness;
    varying float vMetalness;
    varying float vEmissive;
    varying float vDistance;
    
    // 基于物理的光照计算
    vec3 fresnelSchlick(float cosTheta, vec3 F0) {
      return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
    }
    
    void main() {
      // 计算点精灵的圆形遮罩
      vec2 center = gl_PointCoord - vec2(0.5);
      float dist = length(center);
      
      // 柔和边缘 - 高斯衰减
      float softness = 0.5 - vRoughness * 0.3; // 粗糙度越高，边缘越柔和
      float edgeFalloff = 1.0 - smoothstep(0.0, softness, dist);
      
      // 核心光晕 (自发光效果)
      float coreGlow = exp(-dist * dist * 8.0) * vEmissive;
      
      // PBR 计算 - 简化的 Fresnel 效果
      vec3 baseColor = vColor;
      vec3 F0 = mix(vec3(0.04), baseColor, vMetalness);
      
      // 模拟从中心向外看的 Fresnel
      float fresnel = pow(1.0 - max(0.0, 1.0 - dist * 2.0), 5.0);
      vec3 fresnelColor = mix(baseColor, vec3(1.0), fresnel * vMetalness);
      
      // 最终颜色 = 基础色 + 核心光晕 + Fresnel 高光
      vec3 finalColor = fresnelColor + vec3(coreGlow);
      
      // HDR 输出 (不 clamp，让后期处理的 tone mapping 来处理)
      float finalAlpha = edgeFalloff * vAlpha;
      
      // 丢弃透明像素
      if (finalAlpha < 0.01) discard;
      
      gl_FragColor = vec4(finalColor, finalAlpha);
    }
  `;
  
  return new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {}
  });
}

/**
 * 创建用于 PointsMaterial 的高质量粒子贴图
 * 具有 PBR 风格的柔和渐变和核心光晕
 */
export function createPBRParticleTexture(resolution: number = 128): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  const center = resolution / 2;
  
  // 多层渐变实现 HDR 效果
  // 第一层：核心光晕 (高强度)
  const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.3);
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  coreGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.9)');
  coreGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.4)');
  coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  
  ctx.fillStyle = coreGradient;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // 第二层：主光晕 (中等强度)
  const mainGradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.6);
  mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  mainGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
  mainGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.1)');
  mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = mainGradient;
  ctx.fillRect(0, 0, resolution, resolution);
  
  // 第三层：外层柔和边缘
  const outerGradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  outerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
  outerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)');
  outerGradient.addColorStop(0.8, 'rgba(255, 255, 255, 0.02)');
  outerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  
  ctx.fillStyle = outerGradient;
  ctx.fillRect(0, 0, resolution, resolution);
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * 创建带发光效果的地面，用于接收烟花光线反射
 */
export function createReflectiveGround(width: number = 8000, height: number = 8000): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(width, height);
  
  const material = new THREE.MeshStandardMaterial({
    color: 0x1a1a2e,
    roughness: 0.7,
    metalness: 0.3,
    transparent: true,
    opacity: 0.6,
    envMapIntensity: 0.5
  });
  
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -10;
  mesh.receiveShadow = true;
  
  return mesh;
}

/**
 * 材质管理器 - 管理所有 PBR 材质的生命周期
 */
export class PBRMaterialManager {
  private materials: Map<string, THREE.Material> = new Map();
  private textures: Map<string, THREE.Texture> = new Map();
  
  constructor() {
    // 预创建常用纹理
    this.textures.set('particle_pbr', createPBRParticleTexture(128));
    this.textures.set('particle_pbr_hd', createPBRParticleTexture(256));
  }
  
  /**
   * 获取粒子 PBR 贴图
   */
  getParticleTexture(highQuality: boolean = false): THREE.Texture {
    return this.textures.get(highQuality ? 'particle_pbr_hd' : 'particle_pbr')!;
  }
  
  /**
   * 获取预设的 PBR 属性
   */
  getPreset(type: ParticleMaterialType): ParticlePBRProperties {
    return { ...PBR_PRESETS[type] };
  }
  
  /**
   * 混合两种材质属性
   */
  blendPresets(
    typeA: ParticleMaterialType,
    typeB: ParticleMaterialType,
    factor: number
  ): ParticlePBRProperties {
    const a = PBR_PRESETS[typeA];
    const b = PBR_PRESETS[typeB];
    const t = Math.max(0, Math.min(1, factor));
    
    return {
      roughness: a.roughness * (1 - t) + b.roughness * t,
      metalness: a.metalness * (1 - t) + b.metalness * t,
      emissiveIntensity: a.emissiveIntensity * (1 - t) + b.emissiveIntensity * t,
      temperature: a.temperature * (1 - t) + b.temperature * t
    };
  }
  
  /**
   * 清理材质资源
   */
  dispose(): void {
    this.materials.forEach(mat => mat.dispose());
    this.textures.forEach(tex => tex.dispose());
    this.materials.clear();
    this.textures.clear();
  }
}

/**
 * 全局材质管理器单例
 */
let globalMaterialManager: PBRMaterialManager | null = null;

export function getPBRMaterialManager(): PBRMaterialManager {
  if (!globalMaterialManager) {
    globalMaterialManager = new PBRMaterialManager();
  }
  return globalMaterialManager;
}
