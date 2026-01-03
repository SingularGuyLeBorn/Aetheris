/**
 * PostProcessingStack.ts - 电影级后期处理管线
 * 
 * 功能特性：
 * - Unreal Bloom (虚幻引擎级别的辉光)
 * - Chromatic Aberration (色差/紫边效果)
 * - Tone Mapping (HDR → SDR 色调映射)
 * - Film Grain (可选电影噪点)
 * - Vignette (暗角)
 * 
 * 这些效果组合在一起，让画面具有真实摄影机的质感
 */

import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass';

/**
 * 色差着色器 (Chromatic Aberration)
 * 模拟镜头边缘的红蓝分离效果
 */
export const ChromaticAberrationShader = {
  name: 'ChromaticAberrationShader',
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.003 },       // 色差强度
    radialFalloff: { value: 1.5 },     // 从中心到边缘的衰减
    center: { value: new THREE.Vector2(0.5, 0.5) }
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
    uniform float radialFalloff;
    uniform vec2 center;
    varying vec2 vUv;
    
    void main() {
      // 计算从中心到当前像素的距离
      vec2 toCenter = vUv - center;
      float dist = length(toCenter);
      
      // 径向衰减：边缘效果更强
      float aberration = dist * dist * intensity * radialFalloff;
      
      // RGB 通道分离
      vec2 redOffset = toCenter * aberration * 1.2;
      vec2 greenOffset = toCenter * aberration * 0.0;  // 绿色通道不偏移
      vec2 blueOffset = toCenter * aberration * -1.0;
      
      float r = texture2D(tDiffuse, vUv - redOffset).r;
      float g = texture2D(tDiffuse, vUv - greenOffset).g;
      float b = texture2D(tDiffuse, vUv - blueOffset).b;
      
      // 保留原始 alpha
      float a = texture2D(tDiffuse, vUv).a;
      
      gl_FragColor = vec4(r, g, b, a);
    }
  `
};

/**
 * 高级色调映射着色器 (ACES Filmic Tone Mapping)
 * 比 Three.js 内置的 Reinhard 更电影化
 */
export const ACESFilmicToneMappingShader = {
  name: 'ACESFilmicToneMappingShader',
  uniforms: {
    tDiffuse: { value: null },
    exposure: { value: 1.2 },
    saturation: { value: 1.05 },
    contrast: { value: 1.05 }
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
    uniform float exposure;
    uniform float saturation;
    uniform float contrast;
    varying vec2 vUv;
    
    // ACES Filmic Tone Mapping Curve
    // 来源: https://knarkowicz.wordpress.com/2016/01/06/aces-filmic-tone-mapping-curve/
    vec3 ACESFilm(vec3 x) {
      float a = 2.51;
      float b = 0.03;
      float c = 2.43;
      float d = 0.59;
      float e = 0.14;
      return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
    }
    
    // 饱和度调整
    vec3 adjustSaturation(vec3 color, float sat) {
      float grey = dot(color, vec3(0.2126, 0.7152, 0.0722));
      return mix(vec3(grey), color, sat);
    }
    
    // 对比度调整
    vec3 adjustContrast(vec3 color, float cont) {
      return (color - 0.5) * cont + 0.5;
    }
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      
      // 曝光调整
      vec3 color = texel.rgb * exposure;
      
      // ACES 色调映射
      color = ACESFilm(color);
      
      // 饱和度和对比度
      color = adjustSaturation(color, saturation);
      color = adjustContrast(color, contrast);
      
      gl_FragColor = vec4(color, texel.a);
    }
  `
};

/**
 * 暗角着色器 (Vignette)
 * 模拟真实镜头边缘变暗的效果
 */
export const VignetteShader = {
  name: 'VignetteShader',
  uniforms: {
    tDiffuse: { value: null },
    intensity: { value: 0.3 },
    smoothness: { value: 0.5 },
    center: { value: new THREE.Vector2(0.5, 0.5) }
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
    uniform float smoothness;
    uniform vec2 center;
    varying vec2 vUv;
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      
      // 计算到中心的距离
      vec2 toCenter = (vUv - center) * 2.0;
      float dist = length(toCenter);
      
      // 柔和的暗角衰减
      float vignette = 1.0 - smoothstep(1.0 - smoothness, 1.0, dist * intensity);
      
      gl_FragColor = vec4(texel.rgb * vignette, texel.a);
    }
  `
};

/**
 * 电影噪点着色器 (Film Grain)
 * 增加电影质感的细微噪点
 */
export const FilmGrainShader = {
  name: 'FilmGrainShader',
  uniforms: {
    tDiffuse: { value: null },
    time: { value: 0 },
    intensity: { value: 0.05 },
    luminanceThreshold: { value: 0.2 }  // 只在暗部添加噪点
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
    uniform float time;
    uniform float intensity;
    uniform float luminanceThreshold;
    varying vec2 vUv;
    
    // 伪随机数生成
    float random(vec2 co) {
      return fract(sin(dot(co.xy, vec2(12.9898, 78.233))) * 43758.5453);
    }
    
    void main() {
      vec4 texel = texture2D(tDiffuse, vUv);
      
      // 计算亮度
      float luminance = dot(texel.rgb, vec3(0.299, 0.587, 0.114));
      
      // 噪点强度随亮度降低而增加
      float noiseStrength = (1.0 - smoothstep(0.0, luminanceThreshold, luminance)) * intensity;
      
      // 生成动态噪点
      float noise = random(vUv + vec2(time * 0.1)) * 2.0 - 1.0;
      
      vec3 result = texel.rgb + noise * noiseStrength;
      
      gl_FragColor = vec4(result, texel.a);
    }
  `
};

/**
 * 后期处理配置接口
 */
export interface PostProcessingConfig {
  // Bloom 设置
  bloomEnabled: boolean;
  bloomStrength: number;     // 0-3
  bloomRadius: number;       // 0-1
  bloomThreshold: number;    // 0-1
  
  // 色差设置
  chromaticAberrationEnabled: boolean;
  chromaticAberrationIntensity: number;  // 0-0.02
  
  // 色调映射设置
  toneMappingEnabled: boolean;
  exposure: number;          // 0.5-2.0
  saturation: number;        // 0.5-1.5
  contrast: number;          // 0.8-1.2
  
  // 暗角设置
  vignetteEnabled: boolean;
  vignetteIntensity: number; // 0-1
  
  // 噪点设置
  filmGrainEnabled: boolean;
  filmGrainIntensity: number; // 0-0.15
}

/**
 * 默认后期处理配置 - 电影级质量
 */
export const DEFAULT_POST_PROCESSING_CONFIG: PostProcessingConfig = {
  bloomEnabled: true,
  bloomStrength: 1.5,
  bloomRadius: 0.4,
  bloomThreshold: 0.2,
  
  chromaticAberrationEnabled: true,
  chromaticAberrationIntensity: 0.004,
  
  toneMappingEnabled: true,
  exposure: 1.3,
  saturation: 1.08,
  contrast: 1.05,
  
  vignetteEnabled: true,
  vignetteIntensity: 0.35,
  
  filmGrainEnabled: false,  // 默认关闭，可选开启
  filmGrainIntensity: 0.03
};

/**
 * 高性能预设 - 牺牲部分效果换取性能
 */
export const PERFORMANCE_POST_PROCESSING_CONFIG: PostProcessingConfig = {
  bloomEnabled: true,
  bloomStrength: 1.2,
  bloomRadius: 0.3,
  bloomThreshold: 0.3,
  
  chromaticAberrationEnabled: false,
  chromaticAberrationIntensity: 0,
  
  toneMappingEnabled: true,
  exposure: 1.2,
  saturation: 1.0,
  contrast: 1.0,
  
  vignetteEnabled: false,
  vignetteIntensity: 0,
  
  filmGrainEnabled: false,
  filmGrainIntensity: 0
};

/**
 * 电影级后期处理栈
 */
export class PostProcessingStack {
  private composer: EffectComposer;
  private renderPass: RenderPass;
  private bloomPass: UnrealBloomPass;
  private chromaticPass: ShaderPass;
  private toneMappingPass: ShaderPass;
  private vignettePass: ShaderPass;
  private filmGrainPass: ShaderPass;
  private outputPass: OutputPass;
  
  private config: PostProcessingConfig;
  private startTime: number;
  
  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera,
    config: Partial<PostProcessingConfig> = {}
  ) {
    this.config = { ...DEFAULT_POST_PROCESSING_CONFIG, ...config };
    this.startTime = performance.now();
    
    // 配置渲染器
    renderer.toneMapping = THREE.NoToneMapping;  // 我们用自定义色调映射
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // 创建 Effect Composer
    this.composer = new EffectComposer(renderer);
    
    // 1. 渲染通道
    this.renderPass = new RenderPass(scene, camera);
    this.composer.addPass(this.renderPass);
    
    // 2. Unreal Bloom 通道
    const resolution = new THREE.Vector2(window.innerWidth, window.innerHeight);
    this.bloomPass = new UnrealBloomPass(
      resolution,
      this.config.bloomStrength,
      this.config.bloomRadius,
      this.config.bloomThreshold
    );
    this.bloomPass.enabled = this.config.bloomEnabled;
    this.composer.addPass(this.bloomPass);
    
    // 3. 色差通道
    this.chromaticPass = new ShaderPass(ChromaticAberrationShader);
    this.chromaticPass.uniforms.intensity.value = this.config.chromaticAberrationIntensity;
    this.chromaticPass.enabled = this.config.chromaticAberrationEnabled;
    this.composer.addPass(this.chromaticPass);
    
    // 4. 色调映射通道
    this.toneMappingPass = new ShaderPass(ACESFilmicToneMappingShader);
    this.toneMappingPass.uniforms.exposure.value = this.config.exposure;
    this.toneMappingPass.uniforms.saturation.value = this.config.saturation;
    this.toneMappingPass.uniforms.contrast.value = this.config.contrast;
    this.toneMappingPass.enabled = this.config.toneMappingEnabled;
    this.composer.addPass(this.toneMappingPass);
    
    // 5. 暗角通道
    this.vignettePass = new ShaderPass(VignetteShader);
    this.vignettePass.uniforms.intensity.value = this.config.vignetteIntensity;
    this.vignettePass.enabled = this.config.vignetteEnabled;
    this.composer.addPass(this.vignettePass);
    
    // 6. 电影噪点通道
    this.filmGrainPass = new ShaderPass(FilmGrainShader);
    this.filmGrainPass.uniforms.intensity.value = this.config.filmGrainIntensity;
    this.filmGrainPass.enabled = this.config.filmGrainEnabled;
    this.composer.addPass(this.filmGrainPass);
    
    // 7. 输出通道 (颜色空间转换)
    this.outputPass = new OutputPass();
    this.composer.addPass(this.outputPass);
  }
  
  /**
   * 更新配置
   */
  setConfig(config: Partial<PostProcessingConfig>): void {
    this.config = { ...this.config, ...config };
    
    // 更新 Bloom
    if (config.bloomEnabled !== undefined) this.bloomPass.enabled = config.bloomEnabled;
    if (config.bloomStrength !== undefined) this.bloomPass.strength = config.bloomStrength;
    if (config.bloomRadius !== undefined) this.bloomPass.radius = config.bloomRadius;
    if (config.bloomThreshold !== undefined) this.bloomPass.threshold = config.bloomThreshold;
    
    // 更新色差
    if (config.chromaticAberrationEnabled !== undefined) {
      this.chromaticPass.enabled = config.chromaticAberrationEnabled;
    }
    if (config.chromaticAberrationIntensity !== undefined) {
      this.chromaticPass.uniforms.intensity.value = config.chromaticAberrationIntensity;
    }
    
    // 更新色调映射
    if (config.toneMappingEnabled !== undefined) {
      this.toneMappingPass.enabled = config.toneMappingEnabled;
    }
    if (config.exposure !== undefined) {
      this.toneMappingPass.uniforms.exposure.value = config.exposure;
    }
    if (config.saturation !== undefined) {
      this.toneMappingPass.uniforms.saturation.value = config.saturation;
    }
    if (config.contrast !== undefined) {
      this.toneMappingPass.uniforms.contrast.value = config.contrast;
    }
    
    // 更新暗角
    if (config.vignetteEnabled !== undefined) {
      this.vignettePass.enabled = config.vignetteEnabled;
    }
    if (config.vignetteIntensity !== undefined) {
      this.vignettePass.uniforms.intensity.value = config.vignetteIntensity;
    }
    
    // 更新噪点
    if (config.filmGrainEnabled !== undefined) {
      this.filmGrainPass.enabled = config.filmGrainEnabled;
    }
    if (config.filmGrainIntensity !== undefined) {
      this.filmGrainPass.uniforms.intensity.value = config.filmGrainIntensity;
    }
  }
  
  /**
   * 获取当前配置
   */
  getConfig(): PostProcessingConfig {
    return { ...this.config };
  }
  
  /**
   * 渲染帧
   */
  render(): void {
    // 更新动态 uniforms
    const elapsed = (performance.now() - this.startTime) / 1000;
    this.filmGrainPass.uniforms.time.value = elapsed;
    
    this.composer.render();
  }
  
  /**
   * 更新尺寸
   */
  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
    this.bloomPass.setSize(width, height);
  }
  
  /**
   * 获取 Effect Composer (用于高级自定义)
   */
  getComposer(): EffectComposer {
    return this.composer;
  }
  
  /**
   * 获取各个通道的引用
   */
  getPasses() {
    return {
      render: this.renderPass,
      bloom: this.bloomPass,
      chromatic: this.chromaticPass,
      toneMapping: this.toneMappingPass,
      vignette: this.vignettePass,
      filmGrain: this.filmGrainPass,
      output: this.outputPass
    };
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    this.composer.dispose();
  }
}

/**
 * 创建简化版后期处理栈 (用于快速集成)
 */
export function createSimplePostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  quality: 'cinematic' | 'performance' | 'minimal' = 'cinematic'
): PostProcessingStack {
  const configs: Record<string, Partial<PostProcessingConfig>> = {
    cinematic: DEFAULT_POST_PROCESSING_CONFIG,
    performance: PERFORMANCE_POST_PROCESSING_CONFIG,
    minimal: {
      bloomEnabled: true,
      bloomStrength: 1.0,
      bloomRadius: 0.3,
      bloomThreshold: 0.4,
      chromaticAberrationEnabled: false,
      toneMappingEnabled: true,
      exposure: 1.1,
      saturation: 1.0,
      contrast: 1.0,
      vignetteEnabled: false,
      filmGrainEnabled: false
    }
  };
  
  return new PostProcessingStack(renderer, scene, camera, configs[quality]);
}
