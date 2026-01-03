/**
 * AdvancedEffects.ts - 电影级高级渲染效果
 * 
 * 实现"与现实无法分辨"的极致视觉效果：
 * 
 * 1. 体积感烟雾与自发光遮蔽
 * 2. 物理快门运动模糊 (长曝光)
 * 3. 大气散射与丁达尔效应
 * 4. 镜头光学: 光晕、色差、景深
 * 5. 黑体辐射颜色模拟
 */

import * as THREE from 'three';

// ============================================================
// 1. 体积烟雾系统
// ============================================================

/**
 * 烟雾粒子配置
 */
export interface SmokeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  color: THREE.Color;
  illumination: number;  // 被烟花照亮的程度
}

/**
 * 体积烟雾管理器
 * 模拟烟花产生的烟雾被火光照亮的效果
 */
export class VolumetricSmokeSystem {
  private particles: SmokeParticle[] = [];
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private mesh: THREE.Points;
  private maxParticles: number;
  
  constructor(scene: THREE.Scene, maxParticles: number = 2000) {
    this.maxParticles = maxParticles;
    
    // 创建几何体
    this.geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    
    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // 烟雾材质：使用 additive 混合模拟内发光
    this.material = new THREE.PointsMaterial({
      size: 20,
      map: this.createSmokeTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.15,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });
    
    this.mesh = new THREE.Points(this.geometry, this.material);
    this.mesh.frustumCulled = false;
    scene.add(this.mesh);
  }
  
  /**
   * 创建柔和的烟雾纹理
   */
  private createSmokeTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    // 多层高斯渐变模拟烟雾
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.05)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
  }
  
  /**
   * 在指定位置生成烟雾
   */
  emit(position: THREE.Vector3, color: THREE.Color, intensity: number = 1): void {
    if (this.particles.length >= this.maxParticles) {
      // 回收最老的粒子
      this.particles.shift();
    }
    
    // 添加随机偏移
    const spread = 5;
    const smokePos = new THREE.Vector3(
      position.x + (Math.random() - 0.5) * spread,
      position.y + (Math.random() - 0.5) * spread,
      position.z + (Math.random() - 0.5) * spread
    );
    
    // 烟雾缓慢上升和扩散
    const velocity = new THREE.Vector3(
      (Math.random() - 0.5) * 0.5,
      Math.random() * 0.8 + 0.2,  // 主要向上
      (Math.random() - 0.5) * 0.5
    );
    
    this.particles.push({
      position: smokePos,
      velocity,
      life: 1,
      maxLife: 3 + Math.random() * 2,  // 3-5秒生命
      size: 15 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.1,
      color: color.clone(),
      illumination: intensity
    });
  }
  
  /**
   * 更新烟雾物理和渲染
   */
  update(deltaTime: number, lightSources: { position: THREE.Vector3; color: THREE.Color; intensity: number }[] = []): void {
    const positions = this.geometry.attributes.position.array as Float32Array;
    const colors = this.geometry.attributes.color.array as Float32Array;
    const sizes = this.geometry.attributes.size.array as Float32Array;
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      
      // 更新生命
      p.life -= deltaTime / p.maxLife;
      
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      
      // 物理更新：缓慢扩散
      p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
      p.velocity.y *= 0.99;  // 阻力
      p.size += deltaTime * 5;  // 逐渐变大
      
      // 计算光照：被周围光源照亮
      let totalIllumination = p.illumination * 0.95;  // 衰减
      const illuminatedColor = p.color.clone();
      
      for (const light of lightSources) {
        const dist = p.position.distanceTo(light.position);
        if (dist < 100) {
          const falloff = 1 - (dist / 100);
          const contrib = falloff * falloff * light.intensity * 0.3;
          totalIllumination += contrib;
          
          // Mie 散射：光染烟雾
          illuminatedColor.lerp(light.color, contrib * 0.5);
        }
      }
      
      p.illumination = Math.min(totalIllumination, 1);
      
      // 更新 buffer
      const idx3 = i * 3;
      positions[idx3] = p.position.x;
      positions[idx3 + 1] = p.position.y;
      positions[idx3 + 2] = p.position.z;
      
      // 颜色受光照影响
      const fadeAlpha = p.life * p.illumination;
      colors[idx3] = illuminatedColor.r * fadeAlpha;
      colors[idx3 + 1] = illuminatedColor.g * fadeAlpha;
      colors[idx3 + 2] = illuminatedColor.b * fadeAlpha;
      
      sizes[i] = p.size * p.life;
    }
    
    // 隐藏未使用的粒子
    for (let i = this.particles.length; i < this.maxParticles; i++) {
      const idx3 = i * 3;
      positions[idx3 + 1] = -10000;
    }
    
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.color.needsUpdate = true;
    this.geometry.attributes.size.needsUpdate = true;
  }
  
  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

// ============================================================
// 2. 运动模糊 (长曝光效果)
// ============================================================

/**
 * 运动模糊着色器
 * 基于速度向量的动态模糊
 */
export const MotionBlurShader = {
  name: 'MotionBlurShader',
  uniforms: {
    tDiffuse: { value: null },
    tVelocity: { value: null },  // 速度缓冲
    velocityFactor: { value: 0.5 },
    samples: { value: 16 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tVelocity;
    uniform float velocityFactor;
    uniform int samples;
    varying vec2 vUv;
    
    void main() {
      vec2 velocity = texture2D(tVelocity, vUv).rg * velocityFactor;
      
      vec4 color = vec4(0.0);
      vec2 offset = velocity / float(samples);
      
      for(int i = 0; i < 32; i++) {
        if(i >= samples) break;
        vec2 sampleUv = vUv + offset * float(i - samples / 2);
        color += texture2D(tDiffuse, sampleUv);
      }
      
      gl_FragColor = color / float(samples);
    }
  `
};

/**
 * 累积缓冲运动模糊 (长曝光)
 */
export class AccumulationBuffer {
  private accumTexture: THREE.WebGLRenderTarget;
  private blendAmount: number;
  
  constructor(width: number, height: number, blendAmount: number = 0.9) {
    this.blendAmount = blendAmount;
    this.accumTexture = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType
    });
  }
  
  /**
   * 获取累积纹理
   */
  getTexture(): THREE.Texture {
    return this.accumTexture.texture;
  }
  
  /**
   * 设置混合量 (0=无模糊, 0.99=强烈拖尾)
   */
  setBlendAmount(amount: number): void {
    this.blendAmount = Math.max(0, Math.min(0.99, amount));
  }
  
  resize(width: number, height: number): void {
    this.accumTexture.setSize(width, height);
  }
  
  dispose(): void {
    this.accumTexture.dispose();
  }
}

// ============================================================
// 3. 大气散射与丁达尔效应 (God Rays)
// ============================================================

/**
 * 丁达尔效应/光柱着色器
 */
export const GodRaysShader = {
  name: 'GodRaysShader',
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    lightPosition: { value: new THREE.Vector2(0.5, 0.5) },
    exposure: { value: 0.3 },
    decay: { value: 0.95 },
    density: { value: 0.8 },
    weight: { value: 0.5 },
    samples: { value: 60 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform vec2 lightPosition;
    uniform float exposure;
    uniform float decay;
    uniform float density;
    uniform float weight;
    uniform int samples;
    varying vec2 vUv;
    
    void main() {
      vec2 deltaTextCoord = vUv - lightPosition;
      deltaTextCoord *= 1.0 / float(samples) * density;
      
      vec2 coord = vUv;
      vec4 color = texture2D(tDiffuse, coord);
      float illuminationDecay = 1.0;
      
      for(int i = 0; i < 100; i++) {
        if(i >= samples) break;
        coord -= deltaTextCoord;
        vec4 sampleColor = texture2D(tDiffuse, coord);
        sampleColor *= illuminationDecay * weight;
        color += sampleColor;
        illuminationDecay *= decay;
      }
      
      gl_FragColor = color * exposure;
    }
  `
};

// ============================================================
// 4. 镜头光学效果
// ============================================================

/**
 * 镜头光晕 (Lens Flare) 配置
 */
export interface LensFlareConfig {
  enabled: boolean;
  intensity: number;
  size: number;
  haloSize: number;
  ghostCount: number;
  threshold: number;
}

/**
 * 镜头光晕着色器
 */
export const LensFlareShader = {
  name: 'LensFlareShader',
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.3 },
    threshold: { value: 0.8 },
    ghostCount: { value: 5 },
    ghostSpacing: { value: 0.3 },
    haloWidth: { value: 0.6 }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform float intensity;
    uniform float threshold;
    uniform int ghostCount;
    uniform float ghostSpacing;
    uniform float haloWidth;
    varying vec2 vUv;
    
    vec3 sampleGhost(vec2 uv, float offset) {
      vec2 ghostUv = vec2(1.0) - uv;
      ghostUv = mix(vec2(0.5), ghostUv, offset);
      
      if(ghostUv.x < 0.0 || ghostUv.x > 1.0 || ghostUv.y < 0.0 || ghostUv.y > 1.0) {
        return vec3(0.0);
      }
      
      vec3 color = texture2D(tDiffuse, ghostUv).rgb;
      float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
      
      if(brightness < threshold) return vec3(0.0);
      
      return color * (brightness - threshold);
    }
    
    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      vec3 flare = vec3(0.0);
      
      // 幽灵图像
      for(int i = 0; i < 10; i++) {
        if(i >= ghostCount) break;
        float offset = ghostSpacing * float(i + 1);
        flare += sampleGhost(vUv, offset) * (1.0 / float(i + 1));
      }
      
      // 光环
      vec2 haloVec = vec2(0.5) - vUv;
      float haloDist = length(haloVec);
      float halo = pow(1.0 - abs(haloDist - haloWidth), 5.0);
      halo *= texture2D(tDiffuse, vUv + normalize(haloVec) * haloWidth).r;
      flare += vec3(halo) * 0.5;
      
      gl_FragColor = vec4(base.rgb + flare * intensity, base.a);
    }
  `
};

/**
 * 景深着色器 (Depth of Field)
 */
export const DepthOfFieldShader = {
  name: 'DepthOfFieldShader',
  uniforms: {
    tDiffuse: { value: null },
    tDepth: { value: null },
    focusDistance: { value: 300.0 },
    focusRange: { value: 150.0 },
    maxBlur: { value: 3.0 },
    resolution: { value: new THREE.Vector2(1, 1) }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float focusDistance;
    uniform float focusRange;
    uniform float maxBlur;
    uniform vec2 resolution;
    varying vec2 vUv;
    
    float getDepth(vec2 uv) {
      return texture2D(tDepth, uv).r * 1000.0;
    }
    
    void main() {
      float depth = getDepth(vUv);
      float blur = clamp(abs(depth - focusDistance) / focusRange, 0.0, 1.0) * maxBlur;
      
      if(blur < 0.5) {
        gl_FragColor = texture2D(tDiffuse, vUv);
        return;
      }
      
      vec2 texelSize = 1.0 / resolution;
      vec4 color = vec4(0.0);
      float total = 0.0;
      
      // 简单的框模糊
      for(float x = -3.0; x <= 3.0; x += 1.0) {
        for(float y = -3.0; y <= 3.0; y += 1.0) {
          vec2 offset = vec2(x, y) * texelSize * blur;
          color += texture2D(tDiffuse, vUv + offset);
          total += 1.0;
        }
      }
      
      gl_FragColor = color / total;
    }
  `
};

// ============================================================
// 5. 黑体辐射颜色
// ============================================================

/**
 * 基于温度的黑体辐射颜色
 * 真实模拟金属/火焰随温度变化的颜色
 * 
 * @param temperature 温度 (Kelvin), 1000-15000
 * @returns RGB 颜色
 */
export function blackbodyColor(temperature: number): { r: number; g: number; b: number } {
  // Clamp temperature
  const temp = Math.max(1000, Math.min(15000, temperature));
  const t = temp / 100;
  
  let r: number, g: number, b: number;
  
  // 红色通道
  if (t <= 66) {
    r = 255;
  } else {
    r = 329.698727446 * Math.pow(t - 60, -0.1332047592);
    r = Math.max(0, Math.min(255, r));
  }
  
  // 绿色通道
  if (t <= 66) {
    g = 99.4708025861 * Math.log(t) - 161.1195681661;
  } else {
    g = 288.1221695283 * Math.pow(t - 60, -0.0755148492);
  }
  g = Math.max(0, Math.min(255, g));
  
  // 蓝色通道
  if (t >= 66) {
    b = 255;
  } else if (t <= 19) {
    b = 0;
  } else {
    b = 138.5177312231 * Math.log(t - 10) - 305.0447927307;
    b = Math.max(0, Math.min(255, b));
  }
  
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255
  };
}

/**
 * 根据生命值计算冷却颜色
 * 模拟火花从亮黄色冷却到暗红色的过程
 * 
 * @param life 生命值 (0-1)
 * @param baseHue 基础色相
 * @returns THREE.Color
 */
export function coolingColor(life: number, baseHue: number = 0): THREE.Color {
  // 生命值高时: 高温 (6000K - 白/黄)
  // 生命值低时: 低温 (2000K - 红/暗红)
  const temperature = 2000 + life * 4000;
  const blackbody = blackbodyColor(temperature);
  
  // 混合基础色相
  const baseColor = new THREE.Color();
  baseColor.setHSL(baseHue / 360, 0.8, 0.5);
  
  const finalColor = new THREE.Color(blackbody.r, blackbody.g, blackbody.b);
  finalColor.lerp(baseColor, 0.3 * life);  // 高生命时更多原色
  
  // 低生命时降低亮度
  if (life < 0.3) {
    finalColor.multiplyScalar(life / 0.3);
  }
  
  return finalColor;
}

// ============================================================
// 6. 综合效果管理器
// ============================================================

/**
 * 高级效果配置
 */
export interface AdvancedEffectsConfig {
  // 烟雾
  smokeEnabled: boolean;
  smokeIntensity: number;
  
  // 运动模糊
  motionBlurEnabled: boolean;
  motionBlurStrength: number;
  
  // God Rays
  godRaysEnabled: boolean;
  godRaysIntensity: number;
  
  // 镜头效果
  lensFlareEnabled: boolean;
  lensFlareIntensity: number;
  depthOfFieldEnabled: boolean;
  focusDistance: number;
  
  // 颜色
  useBlackbodyColors: boolean;
}

/**
 * 默认高级效果配置
 */
export const DEFAULT_ADVANCED_EFFECTS: AdvancedEffectsConfig = {
  smokeEnabled: true,
  smokeIntensity: 0.3,
  
  motionBlurEnabled: false,  // 默认关闭，性能考量
  motionBlurStrength: 0.5,
  
  godRaysEnabled: false,     // 默认关闭
  godRaysIntensity: 0.3,
  
  lensFlareEnabled: true,
  lensFlareIntensity: 0.2,
  depthOfFieldEnabled: false,
  focusDistance: 300,
  
  useBlackbodyColors: true
};

/**
 * 高性能配置 (关闭大部分效果)
 */
export const PERFORMANCE_ADVANCED_EFFECTS: AdvancedEffectsConfig = {
  smokeEnabled: false,
  smokeIntensity: 0,
  motionBlurEnabled: false,
  motionBlurStrength: 0,
  godRaysEnabled: false,
  godRaysIntensity: 0,
  lensFlareEnabled: false,
  lensFlareIntensity: 0,
  depthOfFieldEnabled: false,
  focusDistance: 300,
  useBlackbodyColors: false
};
