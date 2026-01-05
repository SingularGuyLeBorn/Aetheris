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
  maxParticles: 100000,
  maxTrailParticles: 50000,
  particleTexture: 'soft',
  useHDR: true,
  glowMultiplier: 1.5,
  particleSize: 8,
  enableBloom: true,
  bloomIntensity: 1.5
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

    // 默认柔和的渐变圆
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 64, 64);

    this.particleTexture = new THREE.CanvasTexture(canvas);
    this.particleTexture.needsUpdate = true;
  }

  /**
   * 创建主粒子系统
   */
  private createMainParticleSystem(): void {
    this.particleGeometry = new THREE.PlaneGeometry(1, 1);

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
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mvPosition.xy += position.xy * instanceSize;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec3 vColor;
        varying vec2 vUv;
        void main() {
          vec4 texColor = texture2D(map, vUv);
          gl_FragColor = vec4(vColor * texColor.rgb, texColor.a);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    this.particleMesh = new THREE.InstancedMesh(
      this.particleGeometry,
      this.particleMaterial,
      this.config.maxParticles
    );
    this.particleMesh.frustumCulled = false;
    this.particleMesh.count = 0;
    
    const colorAttr = new THREE.InstancedBufferAttribute(this.particleColors, 3);
    this.particleGeometry.setAttribute('instanceColor', colorAttr);
    const sizeAttr = new THREE.InstancedBufferAttribute(this.particleSizes, 1);
    this.particleGeometry.setAttribute('instanceSize', sizeAttr);

    this.scene.add(this.particleMesh);
  }

  /**
   * 创建尾焰粒子系统
   */
  private createTrailParticleSystem(): void {
    const geometry = new THREE.PlaneGeometry(0.5, 0.5);
    this.trailMaterial = new THREE.ShaderMaterial({
      uniforms: { map: { value: this.particleTexture } },
      vertexShader: `
        attribute vec3 instanceColor;
        attribute float instanceSize;
        varying vec3 vColor;
        varying vec2 vUv;
        void main() {
          vColor = instanceColor;
          vUv = uv;
          vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);
          mvPosition.xy += position.xy * instanceSize;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D map;
        varying vec3 vColor;
        varying vec2 vUv;
        void main() {
          vec4 texColor = texture2D(map, vUv);
          gl_FragColor = vec4(vColor * texColor.rgb, texColor.a);
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
    geometry.setAttribute('instanceColor', colorAttr);
    const sizeAttr = new THREE.InstancedBufferAttribute(this.trailSizes, 1);
    geometry.setAttribute('instanceSize', sizeAttr);

    this.scene.add(this.trailMesh);
  }

  /**
   * 创建运载器发光点
   */
  private createCarrierPoints(): void {
    const geometry = new THREE.BufferGeometry();
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

  update(deltaTime: number): void {
    this.updateMainParticles();
    this.updateTrailParticles();
    this.updateCarrierPoints();
    if (this.particleMaterial) this.particleMaterial.uniforms.time.value += deltaTime;
  }

  private updateMainParticles(): void {
    if (!this.particleMesh) return;
    const particles = this.director.getAllParticles();
    const count = Math.min(particles.length, this.config.maxParticles);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      this.dummy.position.set(p.position.x, p.position.y, p.position.z);
      this.dummy.updateMatrix();
      this.particleMesh.setMatrixAt(i, this.dummy.matrix);

      const rgb = this.hslToRgb(p.hue / 360, p.saturation, p.lightness);
      this.particleColors[i * 3] = rgb.r * this.config.glowMultiplier;
      this.particleColors[i * 3 + 1] = rgb.g * this.config.glowMultiplier;
      this.particleColors[i * 3 + 2] = rgb.b * this.config.glowMultiplier;
      this.particleSizes[i] = p.size * p.alpha;
    }

    this.particleMesh.count = count;
    this.particleMesh.instanceMatrix.needsUpdate = true;
    this.particleGeometry!.getAttribute('instanceColor').needsUpdate = true;
    this.particleGeometry!.getAttribute('instanceSize').needsUpdate = true;
  }

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
    this.trailMesh.geometry.getAttribute('instanceColor').needsUpdate = true;
    this.trailMesh.geometry.getAttribute('instanceSize').needsUpdate = true;
  }

  private updateCarrierPoints(): void {
    if (!this.carrierPoints) return;
    const carriers = this.director.getAllCarriers();
    const positions: number[] = [];
    const colors: number[] = [];

    for (const carrier of carriers) {
        const basePos = carrier.state.position;
        // 核心形状使用高亮度高饱和度颜色
        const rgb = this.hslToRgb(carrier.hue / 360, 1, 0.75); 
        const elapsed = carrier.state.elapsed;
        const scale = Math.min(elapsed * 2, 1);
        
        const shapeType = carrier.config.shape;
        
        // 动画标志
        const isWinged = shapeType === 'phoenix' || shapeType === 'bird' || shapeType === 'butterfly' || shapeType === 'dragon_3d';
        const isRotator = shapeType === 'star_3d' || shapeType === 'cube' || shapeType === 'pyramid' || shapeType === 'diamond' || shapeType === 'helix';

        if (carrier.shapePoints) {
            
            // 预计算旋转
            let cosR = 1, sinR = 0;
            if (isRotator) {
                const angle = elapsed * 3;
                cosR = Math.cos(angle);
                sinR = Math.sin(angle);
            }

            for (const p of carrier.shapePoints) {
                let px = p.x;
                let py = p.y;
                let pz = p.z;
                
                // 1. 振翅动画 (Flapping)
                if (isWinged) {
                    const distCheck = Math.abs(px); 
                    // 假设 X 轴远离中心的是翅膀
                    if (distCheck > 2) { 
                         const flapSpeed = 15;
                         const flapAmp = distCheck * 0.3; // 振幅
                         // 翅膀上下拍打 y
                         py += Math.sin(elapsed * flapSpeed) * flapAmp;
                    }
                    // 身体起伏
                    py += Math.sin(elapsed * 6) * 0.5;
                }

                // 2. 自旋动画 (Spinning)
                if (isRotator) {
                    const rx = px * cosR - pz * sinR;
                    const rz = px * sinR + pz * cosR;
                    px = rx;
                    pz = rz;
                }

                // 应用缩放和最终位置
                positions.push(
                    basePos.x + px * scale, 
                    basePos.y + py * scale, 
                    basePos.z + pz * scale
                );
                colors.push(rgb.r, rgb.g, rgb.b);
            }
        } else {
            // 普通粒子 (Simple/Comet)
            positions.push(basePos.x, basePos.y, basePos.z);
            colors.push(rgb.r, rgb.g, rgb.b);
        }
    }

    const geometry = this.carrierPoints.geometry;
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
  }

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
    this.particleTexture?.dispose();
  }
}
