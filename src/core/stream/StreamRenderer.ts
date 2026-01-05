/**
 * StreamRenderer.ts - 流烟花渲染器
 * 
 * 职责：
 * - 使用 Three.js InstancedMesh 高效渲染大量粒子
 * - 支持 GPU 粒子动画
 * - 黑体辐射颜色计算
 * - 与后处理栈协作产生 Bloom 效果
 */

import * as THREE from 'three';
import { StreamParticle } from './ParticleStream';
import { TrailParticle, CarrierInstance } from './CarrierSystem';
import { Director } from './Director';

/**
 * 渲染器配置
 */
export interface StreamRendererConfig {
  /** 最大粒子数 */
  maxParticles: number;
  /** 最大尾焰粒子数 */
  maxTrailParticles: number;
  /** 粒子纹理类型 */
  particleTexture: 'circle' | 'star' | 'spark' | 'soft';
  /** 是否启用 HDR 颜色 */
  useHDR: boolean;
  /** 发光强度乘数 */
  glowMultiplier: number;
  /** 粒子基础大小 */
  particleSize: number;
  /** 是否启用 Bloom */
  enableBloom: boolean;
  /** Bloom 强度 */
  bloomIntensity: number;
}

const DEFAULT_RENDERER_CONFIG: StreamRendererConfig = {
  maxParticles: 50000,
  maxTrailParticles: 10000,
  particleTexture: 'soft',
  useHDR: true,
  glowMultiplier: 1.0, // 降低避免过曝
  particleSize: 8,
  enableBloom: true,
  bloomIntensity: 1.0 // 降低避免过曝
};

/**
 * 流烟花渲染器
 */
export class StreamRenderer {
  private config: StreamRendererConfig;
  private scene: THREE.Scene;
  private director: Director;

  // 主粒子系统
  private particleMesh: THREE.InstancedMesh | null = null;
  private particleGeometry: THREE.BufferGeometry | null = null;
  private particleMaterial: THREE.ShaderMaterial | null = null;
  private particleColors: Float32Array;
  private particleSizes: Float32Array;
  private dummy: THREE.Object3D;

  // 尾焰粒子系统
  private trailMesh: THREE.InstancedMesh | null = null;
  private trailMaterial: THREE.ShaderMaterial | null = null;
  private trailColors: Float32Array;
  private trailSizes: Float32Array;

  // 运载器发光点
  private carrierPoints: THREE.Points | null = null;
  private carrierMaterial: THREE.PointsMaterial | null = null;

  // 纹理
  private particleTexture: THREE.Texture | null = null;

  constructor(
    scene: THREE.Scene,
    director: Director,
    config: Partial<StreamRendererConfig> = {}
  ) {
    this.config = { ...DEFAULT_RENDERER_CONFIG, ...config };
    this.scene = scene;
    this.director = director;

    this.particleColors = new Float32Array(this.config.maxParticles * 3);
    this.particleSizes = new Float32Array(this.config.maxParticles);
    this.trailColors = new Float32Array(this.config.maxTrailParticles * 3);
    this.trailSizes = new Float32Array(this.config.maxTrailParticles);
    this.dummy = new THREE.Object3D();

    this.init();
  }

  /**
   * 初始化渲染资源
   */
  private init(): void {
    this.createParticleTexture();
    this.createMainParticleSystem();
    this.createTrailParticleSystem();
    this.createCarrierPoints();

    console.log('[StreamRenderer] Initialized with max particles:', this.config.maxParticles);
  }

  /**
   * 创建粒子纹理
   */
  private createParticleTexture(): void {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    const centerX = 32;
    const centerY = 32;
    const radius = 30;

    switch (this.config.particleTexture) {
      case 'circle':
        // 硬边圆形
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'star':
        // 星形
        ctx.fillStyle = '#ffffff';
        this.drawStar(ctx, centerX, centerY, 5, radius, radius / 2);
        break;

      case 'spark':
        // 火花 (带光晕的亮点)
        const sparkGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        sparkGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        sparkGradient.addColorStop(0.1, 'rgba(255, 255, 200, 0.9)');
        sparkGradient.addColorStop(0.4, 'rgba(255, 200, 100, 0.4)');
        sparkGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');
        ctx.fillStyle = sparkGradient;
        ctx.fillRect(0, 0, 64, 64);
        break;

      case 'soft':
      default:
        // 柔和的渐变圆
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 64, 64);
        break;
    }

    this.particleTexture = new THREE.CanvasTexture(canvas);
    this.particleTexture.needsUpdate = true;
  }

  /**
   * 绘制星形
   */
  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number, cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);

    for (let i = 0; i < spikes; i++) {
      ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
      rot += step;
    }

    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  /**
   * 创建主粒子系统
   */
  private createMainParticleSystem(): void {
    // 使用平面几何体作为粒子
    this.particleGeometry = new THREE.PlaneGeometry(1, 1);

    // 自定义着色器材质
    this.particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: this.particleTexture },
        time: { value: 0 }
      },
      vertexShader: `
        attribute vec3 instanceColor;
        attribute float instanceSize;
        
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vColor = instanceColor;
          vUv = uv;
          
          // 使用实例大小缩放
          vec3 scaled = position * instanceSize;
          
          // Billboard: 始终面向摄像机
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mvPosition.xy += scaled.xy;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vec4 texColor = texture2D(map, vUv);
          
          // 应用实例颜色
          vec3 finalColor = vColor * texColor.rgb;
          
          // HDR 发光 - 降低乘数避免过曝
          finalColor *= 1.0;
          
          float alpha = texColor.a;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    // 创建实例化网格
    this.particleMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      this.config.maxParticles
    );
    this.particleMesh.frustumCulled = false;
    this.particleMesh.count = 0;

    // 添加实例属性
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    
    const colorAttr = new THREE.InstancedBufferAttribute(this.particleColors, 3);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    this.particleGeometry.setAttribute('instanceColor', colorAttr);

    const sizeAttr = new THREE.InstancedBufferAttribute(this.particleSizes, 1);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    this.particleGeometry.setAttribute('instanceSize', sizeAttr);

    this.scene.add(this.particleMesh);
  }

  /**
   * 创建尾焰粒子系统
   */
  private createTrailParticleSystem(): void {
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);

    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: {
        map: { value: this.particleTexture }
      },
      vertexShader: `
        attribute vec3 instanceColor;
        attribute float instanceSize;
        
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vColor = instanceColor;
          vUv = uv;
          
          vec3 scaled = position * instanceSize;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mvPosition.xy += scaled.xy;
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        
        varying vec3 vColor;
        varying vec2 vUv;
        
        void main() {
          vec4 texColor = texture2D(map, vUv);
          vec3 finalColor = vColor * texColor.rgb * 1.2; // 降低亮度防止过曝
          gl_FragColor = vec4(finalColor, texColor.a * 0.8);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.trailMesh = new THREE.InstancedMesh(
      geometry,
      this.trailMaterial,
      this.config.maxTrailParticles
    );
    this.trailMesh.frustumCulled = false;
    this.trailMesh.count = 0;

    const colorAttr = new THREE.InstancedBufferAttribute(this.trailColors, 3);
    colorAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('instanceColor', colorAttr);

    const sizeAttr = new THREE.InstancedBufferAttribute(this.trailSizes, 1);
    sizeAttr.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('instanceSize', sizeAttr);

    this.scene.add(this.trailMesh);
  }

  /**
   * 创建运载器发光点
   */
  private createCarrierPoints(): void {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([], 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute([], 3));

    this.carrierMaterial = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.carrierPoints = new THREE.Points(geometry, this.carrierMaterial);
    this.scene.add(this.carrierPoints);
  }

  /**
   * 更新渲染 (每帧调用)
   */
  update(deltaTime: number): void {
    this.updateMainParticles();
    this.updateTrailParticles();
    this.updateCarrierPoints();

    // 更新着色器时间
    if (this.particleMaterial) {
      this.particleMaterial.uniforms.time.value += deltaTime;
    }
  }

  /**
   * 更新主粒子
   */
  private updateMainParticles(): void {
    if (!this.particleMesh) return;

    const particles = this.director.getAllParticles();
    const count = Math.min(particles.length, this.config.maxParticles);

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      // 设置变换矩阵
      this.dummy.position.set(p.position.x, p.position.y, p.position.z);
      this.dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.dummy.matrix);

      // 设置颜色 (HSL to RGB)
      const rgb = this.hslToRgb(p.hue / 360, p.saturation, p.lightness);
      this.particleColors[i * 3] = rgb.r * this.config.glowMultiplier;
      this.particleColors[i * 3 + 1] = rgb.g * this.config.glowMultiplier;
      this.particleColors[i * 3 + 2] = rgb.b * this.config.glowMultiplier;

      // 设置大小
      this.particleSizes[i] = p.size * p.alpha;
    }

    this.particleMesh.count = count;
    this.particleMesh.instanceMatrix.needsUpdate = true;

    const colorAttr = this.particleGeometry!.getAttribute('instanceColor') as THREE.BufferAttribute;
    colorAttr.needsUpdate = true;

    const sizeAttr = this.particleGeometry!.getAttribute('instanceSize') as THREE.BufferAttribute;
    sizeAttr.needsUpdate = true;
  }

  /**
   * 更新尾焰粒子
   */
  private updateTrailParticles(): void {
    if (!this.trailMesh) return;

    const particles = this.director.getAllTrailParticles();
    const count = Math.min(particles.length, this.config.maxTrailParticles);

    for (let i = 0; i < count; i++) {
      const p = particles[i];

      this.dummy.position.set(p.position.x, p.position.y, p.position.z);
      this.dummy.updateMatrix();
      this.trailMesh.setMatrixAt(i, this.dummy.matrix);

      const rgb = this.hslToRgb(p.hue / 360, p.saturation, p.lightness);
      this.trailColors[i * 3] = rgb.r * 2;
      this.trailColors[i * 3 + 1] = rgb.g * 2;
      this.trailColors[i * 3 + 2] = rgb.b * 2;

      this.trailSizes[i] = p.size * p.alpha;
    }

    this.trailMesh.count = count;
    this.trailMesh.instanceMatrix.needsUpdate = true;

    const geometry = this.trailMesh.geometry as THREE.BufferGeometry;
    (geometry.getAttribute('instanceColor') as THREE.BufferAttribute).needsUpdate = true;
    (geometry.getAttribute('instanceSize') as THREE.BufferAttribute).needsUpdate = true;
  }

  /**
   * 更新运载器发光点 (支持上升图案)
   */
  private updateCarrierPoints(): void {
    if (!this.carrierPoints) return;

    const carriers = this.director.getAllCarriers();
    const positions: number[] = [];
    const colors: number[] = [];

    for (const carrier of carriers) {
      if (carrier.state.arrived) continue;

      const basePos = carrier.state.position;
      const rgb = this.hslToRgb(carrier.hue / 360, 1, 0.8);
      
      // 如果有形状图案，渲染图案的所有点
      if (carrier.shapePoints && carrier.shapePoints.length > 0) {
        for (const p of carrier.shapePoints) {
          positions.push(basePos.x + p.x, basePos.y + p.y, basePos.z + p.z);
          colors.push(rgb.r, rgb.g, rgb.b);
        }
      } else {
        // 默认只渲染一个点
        positions.push(basePos.x, basePos.y, basePos.z);
        colors.push(rgb.r, rgb.g, rgb.b);
      }
    }

    const geometry = this.carrierPoints.geometry as THREE.BufferGeometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

  /**
   * HSL 转 RGB
   */
  private hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return { r, g, b };
  }

  /**
   * 获取渲染统计
   */
  getStats(): { mainParticles: number; trailParticles: number; carriers: number } {
    return {
      mainParticles: this.particleMesh?.count || 0,
      trailParticles: this.trailMesh?.count || 0,
      carriers: this.director.getAllCarriers().length
    };
  }

  /**
   * 销毁渲染器
   */
  dispose(): void {
    if (this.particleMesh) {
      this.scene.remove(this.particleMesh);
      this.particleGeometry?.dispose();
      this.particleMaterial?.dispose();
    }

    if (this.trailMesh) {
      this.scene.remove(this.trailMesh);
      this.trailMesh.geometry.dispose();
      this.trailMaterial?.dispose();
    }

    if (this.carrierPoints) {
      this.scene.remove(this.carrierPoints);
      this.carrierPoints.geometry.dispose();
      this.carrierMaterial?.dispose();
    }

    if (this.particleTexture) {
      this.particleTexture.dispose();
    }

    console.log('[StreamRenderer] Disposed');
  }
}

// END OF FILE: src/core/stream/StreamRenderer.ts
