
import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { Director } from '../core/stream/Director';
import { StreamRenderer } from '../core/stream/StreamRenderer';
import { Shape3DType } from '../core/shapes/Shape3DFactory';
import { 
  FireworkLifecycleConfig, 
  AscentPattern 
} from '../types/lifecycle';
import { Vector3 as CoreVector3 } from '../core/Vector3';

// ----------------------------------------------------------------------------
// 类型定义
// ----------------------------------------------------------------------------

export interface StreamFireworkSceneHandle {
  launch: () => void;
  launchAt: (x: number, y: number, z: number) => void;
  launchCarnival: () => void;
  togglePause: () => void;
  toggleAutoRotate: () => void;
}

interface StreamFireworkSceneProps {
  lifecycleConfig: FireworkLifecycleConfig;
  onStatsUpdate?: (stats: any) => void;
  isPaused: boolean;
  isAutoRotate: boolean;
}

// ----------------------------------------------------------------------------
// 映射配置 (UI -> Engine)
// ----------------------------------------------------------------------------

const SHAPE_MAP: Record<AscentPattern | string, Shape3DType | string> = {
  // 几何
  cube: Shape3DType.CUBE,
  sphere: Shape3DType.SPHERE,
  pyramid: Shape3DType.PYRAMID,
  
  // 自然
  butterfly: Shape3DType.BUTTERFLY_3D,
  flower: Shape3DType.FLOWER_3D,
  
  // 文化
  heart: Shape3DType.HEART_3D,
  star: Shape3DType.STAR_3D,
  
  // 默认 pass-through
  simple: 'simple',
  comet: 'comet'
};

const CARRIER_TYPE_MAP: Record<string, any> = {
  // 直线类
  simple_trail: 'comet',
  fast_beam: 'projectile',
  comet_tail: 'comet',
  rocket_thrust: 'vortex',
  stealth_rise: 'stealth',
  // S形类
  gentle_snake: 'comet',
  sine_wave: 'sparkle',
  dna_helix: 'projectile',
  zigzag_climb: 'vortex',
  random_wander: 'comet',
  // 螺旋类
  tight_spiral: 'comet',
  wide_orbit: 'sparkle',
  tornado_spin: 'vortex',
  double_helix: 'projectile',
  chaos_spiral: 'sparkle',
};

const PRESET_GRADIENTS = {
  GOLD: { stops: [0, 1], colors: ['#FFD700', '#FF8C00'] },
  FIRE: { stops: [0, 0.5, 1], colors: ['#FFFF00', '#FF4500', '#8B0000'] }
};

const PRESET_CURVES = {
  LINEAR: [0, 0, 1, 1],
  EASE_OUT: [0, 0, 0.2, 1],
  EASE_IN_OUT: [0, 0, 0.4, 0.2, 1, 1]
};

const curveMap: Record<string, number[]> = {
  'linear': PRESET_CURVES.LINEAR,
  'easeOut': PRESET_CURVES.EASE_OUT,
  'easeInOut': PRESET_CURVES.EASE_IN_OUT,
};

// ============================================================================
// 辅助函数：将生命周期配置转换为 FireworkManifest
// ============================================================================
const lifecycleToManifest = (config: FireworkLifecycleConfig, targetPos: CoreVector3) => {
  // 构建阶段
  const stages: any[] = [];
  
  // 1. 最终成型与悬停阶段 (Formation & Hover)
  const formationDuration = config.action.duration + 3.0; 
  stages.push({
    id: 'formation',
    name: '最终成型',
    timeOffset: 0,
    duration: formationDuration,
    topology: {
      type: 'mathematical_shape',
      source: SHAPE_MAP[config.explosion.shape] || config.explosion.shape || Shape3DType.SPHERE,
      resolution: config.explosion.particleCount, 
      scale: config.explosion.launchScale // Final Scale
    },
    dynamics: {
      transitionMode: 'morph', // ★ Switch to Morph for smooth interpolation
      morphAttractionStrength: 0.5, // Low strength, let duration control it
      morphDamping: 1.0, 
      initialVelocity: { mode: 'random', speed: 0.1 }, // Minimal random velocity
      forceFields: [] 
    },
    rendering: {
      colorMap: {
        stops: [
          // Start with Ascent Color (Gold/Fire) -> End with Explosion Color
          { position: 0, hue: 40, saturation: 1, lightness: 0.8, alpha: 1 }, 
          { position: 1, hue: config.explosion.primaryHue, saturation: 0.8, lightness: 0.6, alpha: 1 }
        ]
      },
      baseSize: 1.0,
      blending: 'additive',
      enableBloom: true,
      bloomDuration: 0, 
      growDuration: formationDuration * 0.8 // Grow over time
    }
  });

  // 2. 归寂 (Fade)
  stages.push({
    id: 'fade',
    name: '消散',
    timeOffset: formationDuration,
    duration: config.fade.duration,
    topology: {
      type: 'mathematical_shape',
      source: Shape3DType.CHAOS_SCATTER,
      resolution: config.explosion.particleCount,
      scale: config.explosion.launchScale
    },
    dynamics: {
      transitionMode: 'maintain', 
      initialVelocity: { mode: 'random', speed: 0 },
      forceFields: [
        { type: 'gravity', strength: 2, direction: new CoreVector3(0, -1, 0) },
        { type: 'drag', strength: 0.5 } 
      ]
    },
    rendering: {
      colorMap: {
        stops: [
          { position: 0, hue: config.explosion.primaryHue, saturation: 0.5, lightness: 0.4, alpha: 0.8 },
          { position: 1, hue: config.explosion.primaryHue, saturation: 0, lightness: 0, alpha: 0 }
        ]
      },
      baseSize: 1.0,
      blending: 'normal'
    }
  });

  // 计算总时长
  const totalDuration = config.ascent.duration + formationDuration + config.fade.duration + 2;
  
  return {
    id: config.id + '_' + Date.now(),
    name: config.name,
    duration: totalDuration,
    carrier: {
      type: CARRIER_TYPE_MAP[config.ascent.trailEffect] || 'comet',
      shape: config.ascent.ascentPattern !== 'none' ? (SHAPE_MAP[config.ascent.ascentPattern] || config.ascent.ascentPattern) : undefined,
      path: {
        type: config.ascent.pathCategory === 'spiral' ? 'spiral' : 
              (config.ascent.pathCategory === 's_shape' ? 'spiral' : 'linear'),
        points: [],
        speedCurve: curveMap[config.ascent.velocityCurve] || PRESET_CURVES.EASE_OUT,
        spiralRadius: config.ascent.spiralRadius || 10,
        spiralFrequency: 3,
      },
      duration: config.ascent.duration,
      trail: {
        emissionRate: config.ascent.trailDensity * 500, // Boosted density
        lifeTime: 1.0,
        colorGradient: {
          stops: [
              { position: 0, hue: 40, saturation: 1, lightness: 0.7, alpha: 1 },
              { position: 1, hue: 20, saturation: 0.8, lightness: 0.4, alpha: 0 }
          ]
        },
        texture: 'spark',
        size: config.ascent.trailSize * 0.8,
      },
    },
    payload: { stages },
  };
};

// ============================================================================
// 组件定义
// ============================================================================

export const StreamFireworkScene = forwardRef<StreamFireworkSceneHandle, StreamFireworkSceneProps>((props, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  const directorRef = useRef<Director | null>(null);
  const streamRendererRef = useRef<StreamRenderer | null>(null);
  
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);

  const launchFirework = (start: CoreVector3, end: CoreVector3) => {
    if (!directorRef.current) return;
    const manifest = lifecycleToManifest(props.lifecycleConfig, end);
    directorRef.current.registerManifest(manifest as any);
    directorRef.current.launch(manifest.id, start, end, props.lifecycleConfig.explosion.primaryHue);
  };

  // 暴露给父组件的方法
  useImperativeHandle(ref, () => ({
    launch: () => {
      const x = (Math.random() - 0.5) * 60;
      const z = (Math.random() - 0.5) * 60;
      const targetY = 60 + Math.random() * 30;
      launchFirework(new CoreVector3(x, 0, z), new CoreVector3(x, targetY, z));
    },
    launchAt: (x, y, z) => {
      launchFirework(new CoreVector3(x, 0, z), new CoreVector3(x, y, z));
    },
    launchCarnival: () => {
      for(let i=0; i<8; i++) {
        setTimeout(() => {
          const x = (Math.random() - 0.5) * 120;
          const z = (Math.random() - 0.5) * 120;
          const targetY = 50 + Math.random() * 50;
          launchFirework(new CoreVector3(x, 0, z), new CoreVector3(x, targetY, z));
        }, i * 400);
      }
    },
    togglePause: () => {
      if (directorRef.current) {
        // Assume Director has pause/resume methods
        (directorRef.current as any).setPaused?.(!props.isPaused);
      }
    },
    toggleAutoRotate: () => {
      if (controlsRef.current) {
        controlsRef.current.autoRotate = !controlsRef.current.autoRotate;
      }
    }
  }));

  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. Scene
    const scene = new THREE.Scene();
    // CRITICAL FIX: Set background to null to allow CSS background to show through.
    // This prevents multiple overlapping instances (e.g. from HMR) from occluding each other with opaque black backgrounds.
    scene.background = null; 
    scene.fog = new THREE.FogExp2(0x020205, 0.0015);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 3000);
    camera.position.set(0, 50, 150);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      powerPreference: "high-performance", 
      alpha: true, // Enable transparency
      preserveDrawingBuffer: false
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = props.lifecycleConfig.rendering.exposure;
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.pointerEvents = 'none'; // Passthrough events to container
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Post Processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      props.lifecycleConfig.rendering.bloomStrength,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // 5. Controls
    const controls = new OrbitControls(camera, containerRef.current); // Bind controls to container, not renderer (which has pointer-events: none)
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.autoRotate = props.isAutoRotate;
    controls.autoRotateSpeed = 0.5;
    controlsRef.current = controls;

    // 6. Environment - Tai Chi Ground
    const gridHelper = new THREE.GridHelper(500, 50, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -0.4;
    scene.add(gridHelper);
    
    // Tai Chi and floor setup...
    const groundGeometry = new THREE.PlaneGeometry(200, 200);
    // ... (TaiChi shader material is unchanged) ...
    const taiChiMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        colorDark: { value: new THREE.Color(0x050505) },
        colorLight: { value: new THREE.Color(0x202020) },
        bgDark: { value: new THREE.Color(0x020205) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 colorDark;
        uniform vec3 colorLight;
        uniform vec3 bgDark;
        varying vec2 vUv;

        void main() {
          vec2 center = vec2(0.5);
          vec2 pos = vUv - center;
          float dist = length(pos);
          float radius = 0.45;
          if (dist > radius) {
            float glow = 1.0 - smoothstep(radius, radius + 0.05, dist);
            gl_FragColor = vec4(mix(bgDark, colorLight * 0.2, glow), glow * 0.5); // reduced alpha
            if (dist > radius + 0.05) discard;
            return;
          }
          // Rotation
          float angle = -time * 0.2;
          float c = cos(angle);
          float s = sin(angle);
          vec2 rotatedPos = vec2(pos.x * c - pos.y * s, pos.x * s + pos.y * c);

          // Yin Yang Logic
          float d_top = distance(rotatedPos, vec2(0.0, 0.225));
          float d_bottom = distance(rotatedPos, vec2(0.0, -0.225));
          float circle_r = 0.06;
          vec3 color;
          if (d_top < circle_r) color = colorLight;
          else if (d_bottom < circle_r) color = colorDark;
          else if (d_top < 0.225) color = colorDark;
          else if (d_bottom < 0.225) color = colorLight;
          else if (rotatedPos.x < 0.0) color = colorDark;
          else color = colorLight;

          float noise = fract(sin(dot(vUv, vec2(12.9898, 78.233))) * 43758.5453);
          color += noise * 0.02;
          gl_FragColor = vec4(color, 0.9);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });

    const ground = new THREE.Mesh(groundGeometry, taiChiMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // 7. Engine
    const director = new Director({ debug: true });
    directorRef.current = director;

    const streamRenderer = new StreamRenderer(scene, director, {
      maxParticles: 100000,
      glowMultiplier: 3.0,
      particleSize: 15
    });
    streamRendererRef.current = streamRenderer;

    lastTimeRef.current = performance.now();
    let isMounted = true; // Safety flag
    
    // Animation Loop
    const animate = () => {
      if (!isMounted) return; // Stop loop if unmounted
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const time = performance.now();
      
      if (taiChiMaterial) {
          taiChiMaterial.uniforms.time.value = time / 1000;
      }

      let deltaTime = (time - lastTimeRef.current) / 1000;
      if (deltaTime <= 0.0001) {
          deltaTime = 0;
      } else {
          lastTimeRef.current = time;
      }
      
      deltaTime = Math.min(deltaTime, 0.05);

      if (props.isPaused) {
        if (Math.random() < 0.01) console.warn('[StreamFireworkScene] Scene is PAUSED');
        return;
      }
      
      controls.update();

      if (deltaTime > 0) {
        director.update(deltaTime);
        streamRenderer.update(deltaTime);
      }
      
      // Reduce log frequency to avoid flooding
      if (Math.random() < 0.001) {
        console.log(`[SceneLoop] FPS: ${(deltaTime > 0 ? 1/deltaTime : 0).toFixed(0)}, Active: ${director.getStats?.()?.activeFireworks ?? 'N/A'}`);
      }
      
      composer.render();
    };

    requestAnimationFrame(animate);

    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current || !composerRef.current) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      composerRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      isMounted = false; // Kill loop
      console.log('[StreamFireworkScene] Unmounting and cleaning up...');
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameRef.current);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      streamRenderer.dispose();
      renderer.dispose();
      // Ensure we clear the director to stop any hanging callbacks
      director.reset();
    };
  }, []); // Only once on mount

  // 响应渲染配置的变化
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = props.lifecycleConfig.rendering.exposure;
    }
    if (composerRef.current && composerRef.current.passes.length > 1) {
      const bloomPass = composerRef.current.passes[1] as UnrealBloomPass;
      if (bloomPass) {
        bloomPass.strength = props.lifecycleConfig.rendering.bloomStrength;
      }
    }
  }, [props.lifecycleConfig.rendering.exposure, props.lifecycleConfig.rendering.bloomStrength]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = props.isAutoRotate;
    }
  }, [props.isAutoRotate]);

  // Handle Click Launch
  const handleClick = (event: React.MouseEvent) => {
    if (!cameraRef.current || !directorRef.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // Intersect with GROUND plane (y=0), not sky plane
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const targetVec = new THREE.Vector3();
    const intersection = raycaster.ray.intersectPlane(plane, targetVec);

    if (intersection) {
      console.log(`[Scene] Click VALID at (${intersection.x.toFixed(1)}, 0, ${intersection.z.toFixed(1)}) - Launching!`);
      // Launch from clicked position (ground) to random height
      const targetY = 60 + Math.random() * 30;
      launchFirework(
          new CoreVector3(intersection.x, 0, intersection.z), 
          new CoreVector3(intersection.x, targetY, intersection.z)
      );
    }
  };

  useEffect(() => {
    console.log("%c StreamFireworkScene v2.1 LOADED - Code Updated ", "background: #222; color: #bada55");
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 bg-[#020205] cursor-crosshair"
      onClick={handleClick}
    />
  );
});

StreamFireworkScene.displayName = 'StreamFireworkScene';
