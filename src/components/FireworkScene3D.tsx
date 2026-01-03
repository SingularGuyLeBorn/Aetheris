// FILE: src/components/FireworkScene3D.tsx
// 升级版 - 支持 PBR 材质、电影级后期处理、Verlet 积分物理

import React, { useEffect, useRef, useImperativeHandle, forwardRef, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { ParticlePool3D } from '../core/ParticlePool3D';
import { Firework3D } from '../core/Firework3D';
import { TimeController } from '../core/TimeController';
import { PostProcessingStack, DEFAULT_POST_PROCESSING_CONFIG, PostProcessingConfig } from '../core/PostProcessingStack';
import { PhysicsEngine, DEFAULT_PHYSICS_CONFIG, IntegratorType } from '../core/PhysicsEngine';
import { getPBRMaterialManager, createPBRParticleTexture } from '../core/PBRMaterial';
import {
  AppSettings,
  CameraMode,
  ExplosionType,
  AscensionType,
  FireworkConfig,
  ManualConfig,
  ColorStyle,
  LaunchFormation
} from '../types';

/**
 * 显式定义 Props 接口，确保 TypeScript 在父组件引用时不会报错
 */
export interface FireworkScene3DProps {
  settings: AppSettings;
  config: FireworkConfig;
  manualConfig: ManualConfig;
  autoRotate: boolean;
  onTimeUpdate?: (timeController: TimeController) => void;
  onStatsUpdate?: (stats: { particles: number; fireworks: number; fps: number }) => void;
  onLaunch?: (log: string) => void;
}

/**
 * 定义组件暴露给外部的操作接口
 */
export interface FireworkScene3DHandle {
  launchCarnival: () => void;
  launchAt: (x: number, y: number, z: number) => void;
  getTimeController: () => TimeController;
}

/**
 * 内部辅助函数：创建 PBR 级别的发光粒子贴图
 * 多层渐变实现 HDR 效果，核心光晕 + 柔和边缘
 */
const createDetailedParticleTexture = () => {
  const canvas = document.createElement('canvas');
  const resolution = 128;
  canvas.width = resolution;
  canvas.height = resolution;
  const ctx = canvas.getContext('2d')!;
  
  const center = resolution / 2;

  // 第一层：核心光晕 (超高强度 HDR)
  const coreGradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.3);
  coreGradient.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
  coreGradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.95)');
  coreGradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.5)');
  coreGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  
  ctx.fillStyle = coreGradient;
  ctx.fillRect(0, 0, resolution, resolution);

  // 第二层：主光晕 (中等强度)
  const mainGradient = ctx.createRadialGradient(center, center, 0, center, center, center * 0.7);
  mainGradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
  mainGradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.25)');
  mainGradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.08)');
  mainGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = mainGradient;
  ctx.fillRect(0, 0, resolution, resolution);

  // 第三层：外层柔和边缘 (营造真实感)
  const outerGradient = ctx.createRadialGradient(center, center, 0, center, center, center);
  outerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.0)');
  outerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
  outerGradient.addColorStop(0.85, 'rgba(255, 255, 255, 0.01)');
  outerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.0)');
  
  ctx.fillStyle = outerGradient;
  ctx.fillRect(0, 0, resolution, resolution);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};

/**
 * FireworkScene3D 核心组件
 * 使用 React.ForwardRefRenderFunction 显式声明以获得最佳 TS 支持
 */
const FireworkScene3DInner: React.ForwardRefRenderFunction<FireworkScene3DHandle, FireworkScene3DProps> = (
    { settings, config, manualConfig, autoRotate, onTimeUpdate, onStatsUpdate, onLaunch },
    ref
) => {
  // === 基础引用 ===
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number>(0);

  // === 业务逻辑引用 (用于在不触发 useEffect 的情况下同步状态) ===
  const settingsRef = useRef(settings);
  const configRef = useRef(config);
  const manualConfigRef = useRef(manualConfig);
  const autoRotateRef = useRef(autoRotate);

  useEffect(() => { settingsRef.current = settings; }, [settings]);
  useEffect(() => { configRef.current = config; }, [config]);
  useEffect(() => { manualConfigRef.current = manualConfig; }, [manualConfig]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // === 模拟器内部状态 ===
  const fireworksRef = useRef<Firework3D[]>([]);
  const particlePoolRef = useRef<ParticlePool3D>(new ParticlePool3D(30000));
  const timeControllerRef = useRef<TimeController>(new TimeController());

  const lastAutoLaunchRef = useRef<number>(0);
  const lastCarnivalRef = useRef<number>(0);
  const fpsRef = useRef({ frames: 0, lastTime: 0, value: 0 });

  // === 鼠标交互引用 ===
  const mouseDownPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const mouseDownTime = useRef<number>(0);
  const planeRef = useRef<THREE.Plane>(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  /**
   * 核心发射方法：支持从配置中随机或指定样式
   */
  const launchSingle = (s: AppSettings, c: FireworkConfig, overrides?: any) => {
    const targetX = overrides?.targetX ?? (Math.random() - 0.5) * 800;
    const targetZ = overrides?.targetZ ?? (Math.random() - 0.5) * 800;
    const targetY = overrides?.targetY ?? (200 + Math.random() * 150);
    const startX = overrides?.startX ?? (Math.random() - 0.5) * 1000;
    const startZ = overrides?.startZ ?? (Math.random() - 0.5) * 1000;

    // 1. 轨迹决策
    let trajectory = overrides?.trajectory || 'RANDOM';
    if (trajectory === 'RANDOM') {
      const tPool = c.enabledTrajectories || [];
      trajectory = tPool.length > 0 ? tPool[Math.floor(Math.random() * tPool.length)] : undefined;
    }

    // 2. 形状决策
    let shape = overrides?.shape || 'RANDOM';
    if (shape === 'RANDOM') {
      const sPool = [...(c.enabledShape3Ds || []), ...(c.enabledShapes || [])];
      shape = sPool.length > 0 ? sPool[Math.floor(Math.random() * sPool.length)] : undefined;
    }

    // 3. 组合技决策
    let combo = overrides?.combo || 'RANDOM';
    if (combo === 'RANDOM') {
      const cbPool = c.enabledCombos || [];
      combo = cbPool.length > 0 ? cbPool[Math.floor(Math.random() * cbPool.length)] : undefined;
    }
    
    // 4. 生命周期决策 (Decay)
    const lifeTimeOverride = overrides?.duration || 0;

    fireworksRef.current.push(new Firework3D(
      {
        startX, startZ,
        targetX, targetY, targetZ,
        hue: Math.random() * 360,
        charge: 1.0,
        trajectoryType: trajectory,
        comboType: combo,
        customShape: shape,
        lifeTimeOverride
      },
      s, c
    ));

    // 输出日志到 UI
    if (!overrides?.skipLog) {
       const logInfo = `🚀 发射: [${shape || '默认'}] - ${trajectory || '直线'} - ${combo || '单级'}`;
       onLaunch?.(logInfo);
    }
  };

  /**
   * 队形发射器
   */
  const launchGroup = (
      formation: LaunchFormation, 
      count: number, 
      interval: number, 
      duration: number,
      launchFn: (idx: number, posOffset: THREE.Vector3, targetOffset: THREE.Vector3) => void
  ) => {
      if (count <= 1 || formation === LaunchFormation.SINGLE) {
          launchFn(0, new THREE.Vector3(), new THREE.Vector3());
          return;
      }

      const radius = 150;
      
      for (let i = 0; i < count; i++) {
          const offsetS = new THREE.Vector3(); 
          const offsetT = new THREE.Vector3(); 
          
          const progress = i / count;
          const angle = progress * Math.PI * 2;
          
          switch (formation) {
              case LaunchFormation.CIRCLE:
                  offsetT.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
                  offsetS.set(Math.cos(angle) * radius * 0.5, 0, Math.sin(angle) * radius * 0.5); 
                  break;
              case LaunchFormation.LINE:
                  const w = radius * 2;
                  const x = (i - count / 2) * (w / count);
                  offsetT.set(x, 0, 0);
                  offsetS.set(x, 0, 0);
                  break;
              case LaunchFormation.CROSS: // 简单的十字布局
                  const arm = i % 4;
                  const dist = Math.floor(i / 4 + 1) * (radius / 2);
                  if (arm === 0) offsetT.set(dist, 0, 0);
                  if (arm === 1) offsetT.set(-dist, 0, 0);
                  if (arm === 2) offsetT.set(0, 0, dist);
                  if (arm === 3) offsetT.set(0, 0, -dist);
                  offsetS.copy(offsetT).multiplyScalar(0.5);
                  break;
              case LaunchFormation.V_SHAPE:
                  const side = i % 2 === 0 ? 1 : -1;
                  const row = Math.floor(i / 2);
                  offsetT.set(side * row * 50, 0, row * 50);
                  offsetS.copy(offsetT);
                  break;
              case LaunchFormation.RANDOM:
              default:
                  offsetT.set((Math.random()-0.5)*radius*2, (Math.random()-0.5)*50, (Math.random()-0.5)*radius*2);
                  offsetS.set((Math.random()-0.5)*radius, 0, (Math.random()-0.5)*radius);
                  break;
          }

          if (interval > 0) {
              setTimeout(() => {
                  launchFn(i, offsetS, offsetT);
              }, i * interval);
          } else {
              launchFn(i, offsetS, offsetT);
          }
      }
  };

  /**
   * 嘉年华序列执行逻辑
   */
  const launchCarnivalWave = (s: AppSettings, c: FireworkConfig) => {
    const sequence = c.carnivalSequence || [];
    
    if (sequence.length === 0) {
      const count = 5 + Math.floor(Math.random() * 8);
      onLaunch?.(`随机波次: ${count} 枚`);
      launchGroup(LaunchFormation.RANDOM, count, 150, 0, (i, offS, offT) => {
         launchSingle(s, c);
      });
      return;
    }

    let totalDelay = 0;
    sequence.forEach((stage, sIdx) => {
      totalDelay += stage.delay;
      setTimeout(() => {
        onLaunch?.(`[大秀] ${stage.name}`);
        launchGroup(
            stage.formation || LaunchFormation.RANDOM,
            stage.count,
            stage.interval || 0,
            stage.duration || 0,
            (idx, offS, offT) => {
                launchSingle(s, c, {
                    trajectory: stage.trajectory,
                    shape: stage.shape,
                    combo: stage.combo,
                    duration: stage.duration,
                    targetX: offT.x * 1.5, 
                    targetZ: offT.z * 1.5, 
                    startX: offS.x,
                    startZ: offS.z,
                    skipLog: idx > 0 
                });
            }
        );
      }, totalDelay);
    });
  };

  const createBackgroundStars = (scene: THREE.Scene) => {
    const starGeo = new THREE.BufferGeometry();
    const count = 4000;
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const r = 3000 + Math.random() * 2000;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
      col[i * 3] = 0.8; col[i * 3 + 1] = 0.8; col[i * 3 + 2] = 1.0;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));

    const starMat = new THREE.PointsMaterial({
      size: 3, vertexColors: true, transparent: true, opacity: 0.5, sizeAttenuation: false
    });
    scene.add(new THREE.Points(starGeo, starMat));
  };

  const createReferenceGround = (scene: THREE.Scene) => {
    const grid = new THREE.GridHelper(8000, 80, 0x223344, 0x05101a);
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.1;
    grid.position.y = -10;
    scene.add(grid);
  };

  const updateStarsTwinkle = (time: number) => {
    const stars = sceneRef.current?.children.find(c => c instanceof THREE.Points && !(c.material as any).map);
    if (stars && stars instanceof THREE.Points) {
      const colors = stars.geometry.attributes.color.array as Float32Array;
      for (let i = 0; i < colors.length; i += 3) {
        const f = 0.7 + 0.3 * Math.sin(time + i);
        colors[i] = 0.8 * f;
        colors[i + 1] = 0.8 * f;
        colors[i + 2] = 1.0 * f;
      }
      stars.geometry.attributes.color.needsUpdate = true;
    }
  };

  // === 生命周期：初始化场景 ===
  useEffect(() => {
    if (!containerRef.current) return;

    // 1. 初始化场景容器
    containerRef.current.innerHTML = '';

    // 2. 创建场景 (Scene)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0e17);
    scene.fog = new THREE.FogExp2(0x0a0e17, 0.0006);
    sceneRef.current = scene;

    // 3. 创建相机 (Camera)
    const camera = new THREE.PerspectiveCamera(
        60,
        window.innerWidth / window.innerHeight,
        1,
        10000
    );
    camera.position.set(0, 150, 600);
    cameraRef.current = camera;

    // 4. 创建渲染器 (Renderer) - HDR 配置
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    // 使用 ACES Filmic 色调映射 - 电影级 HDR 渲染
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 5. 配置增强版后期处理 (EffectComposer)
    // 使用更强的 Bloom 效果实现 HDR 光溢出
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.8,   // 强度 - 增强到 1.8 实现更明显的光溢出
        0.5,   // 半径 - 增加到 0.5 让光晕更柔和
        0.15   // 阈值 - 降低到 0.15 让更多区域产生辉光
    );
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // 6. 配置轨道控制器 (OrbitControls)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 100;
    controls.maxDistance = 2000;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controlsRef.current = controls;

    // 7. 初始化粒子系统几何体
    const maxParticles = 30000;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(maxParticles * 3).fill(-10000);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const particleMaterial = new THREE.PointsMaterial({
      size: 8,
      map: createDetailedParticleTexture(),
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
    particlePoints.frustumCulled = false;
    scene.add(particlePoints);

    // 8. 创建背景元素
    createBackgroundStars(scene);

    // 具象化 XOZ 平面 (地面) - 极座标网格 + 标准网格
    const polarGrid = new THREE.PolarGridHelper(300, 16, 8, 0x059669, 0x064e3b);
    polarGrid.position.y = -50; // 下沉至地面
    (polarGrid.material as THREE.Material).transparent = true;
    (polarGrid.material as THREE.Material).opacity = 0.2;
    scene.add(polarGrid);

    const gridHelper = new THREE.GridHelper(800, 40, 0x334155, 0x0f172a);
    gridHelper.position.y = -50;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.15;
    scene.add(gridHelper);
    
    // createReferenceGround(scene); // Deprecated
    createReferenceGround(scene);

    // 9. 处理窗口缩放
    const onResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 10. 核心动画主循环
    const renderLoop = () => {
      requestRef.current = requestAnimationFrame(renderLoop);

      const tc = timeControllerRef.current;
      const currentSettings = settingsRef.current;
      const currentConfig = configRef.current;

      // 更新控制器
      if (controlsRef.current) {
        controlsRef.current.autoRotate = autoRotateRef.current;
        controlsRef.current.update();
      }

      // 如果未暂停，执行物理模拟
      if (!tc.isPaused) {
        tc.update();
        const dt = tc.deltaTime;
        const virtualNow = tc.virtualTime * 1000;

        // A. 自动嘉年华波次判定
        if (currentSettings.enableAutoCarnival) {
          if (virtualNow - lastCarnivalRef.current > currentSettings.carnivalInterval * 1000) {
            launchCarnivalWave(currentSettings, currentConfig);
            lastCarnivalRef.current = virtualNow;
          }
        }

        // === Sub-stepping 帧内多次物理计算 ===
        // 确保即使在低帧率下轨迹也丝滑平稳
        const SUB_STEPS = 4;  // 每帧进行 4 次物理更新
        const subDt = dt / SUB_STEPS;
        
        for (let step = 0; step < SUB_STEPS; step++) {
          // B. 烟花物理更新 (使用 Verlet 积分器自动处理)
          for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
            const fw = fireworksRef.current[i];
            fw.update(currentSettings, subDt);

            // 升空过程：生成尾焰粒子 (仅在最后一个子步骤生成，避免过多粒子)
            // 升空过程：生成尾焰粒子
            // 增强逻辑：对于复杂轨迹，在每个 sub-step 都生成粒子以获得平滑曲线
            // 对于直线/简单轨迹，仅在每帧生成一次以节省性能
            const isComplexTrail = Boolean(fw.ascension && fw.ascension.match(/(SPIRAL|HELIX|ZIGZAG|SINE|WOBBLE)/i));
            const shouldEmit = !fw.exploded && (isComplexTrail || step === SUB_STEPS - 1);

            if (shouldEmit) {
              const speed = fw.velocity.length();
              const t = fw.lifeTime;  // 时间用于动画效果
              
              // 根据轨迹类型确定尾焰参数
              const trajectoryType = fw.ascension;
              const trajectoryName = (fw.ascension || 'LINEAR').toUpperCase();
              
              // 基础参数
              let trailCount = 1;        // 每帧生成数量
              let trailSize = 6;         // 尾焰大小
              let trailDecay = 0.05;     // 衰减速度 (越小拖尾越长)
              let trailSpread = 1.0;     // 横向扩散
              let trailGravity = 0.01;   // 受重力影响
              let offsetX = 0, offsetZ = 0;
              let extraBrightness = 1.0; 
              let baseHue = fw.hue;
              
              // === 轨迹视觉强化 ===

              if (trajectoryName.includes('SPIRAL') || trajectoryName.includes('HELIX')) {
                // 螺旋/DNA：双股螺旋，高密度，色彩分离
                trailCount = 2; // 每步2个点 (双螺旋)
                trailSize = 5;
                trailDecay = 0.04;
                const spiralSpeed = 10;
                const spiralRadius = 12.0; // [VISIBILITY] 增加半径到 12 (原 3.5)
                
                // 计算螺旋偏移
                const angle = t * spiralSpeed;
                offsetX = Math.cos(angle) * spiralRadius;
                offsetZ = Math.sin(angle) * spiralRadius;
                
                // 颜色偏移：让两条螺旋线颜色稍微不同 (亮度区分)
                extraBrightness = 1.5;

              } else if (trajectoryName.includes('ZIGZAG') || trajectoryName.includes('SINE') || trajectoryName.includes('WOBBLE')) {
                // S型/摇摆：大幅度摆动，更宽的拖尾
                trailCount = 2;
                trailSize = 6;
                trailDecay = 0.03; 
                const waveAmp = 25.0; // [VISIBILITY] 增加幅度到 25
                const waveFreq = 6.0;
                
                // 垂直于运动方向的摆动
                offsetX = Math.sin(t * waveFreq) * waveAmp;
                // Z轴稍微错开增加立体感
                offsetZ = Math.cos(t * waveFreq * 0.7) * (waveAmp * 0.4);
                
                trailSpread = 2.0;

              } else if (trajectoryName.includes('ACCELERATE') || trajectoryName === '极速推进') {
                // 加速/火箭：细长，极为明亮的核心，伴随烟雾
                trailCount = 6;     // 更多粒子
                trailSize = 8;        // 核心很大
                trailDecay = 0.015;   // 极长拖尾
                trailSpread = 0.8;    // 收束
                extraBrightness = 4.0; // 爆亮
                trailGravity = 0;     // 无重力
                baseHue = 30;         // 强制偏向火焰色 (橙/黄) 如果不是 override
                if (Math.random() < 0.3) baseHue = fw.hue; // 偶尔混合原本颜色

              } else if (trajectoryName.includes('BEZIER') || trajectoryName.includes('CURVE')) {
                // 曲线：平滑，优雅
                trailCount = 1;
                trailSize = 5;
                trailDecay = 0.04;
                extraBrightness = 1.2;
              }

              // 生成粒子
              const spawnProbability = Math.min(1.0, speed / 10); 
              const alphaValue = Math.min(1, speed / 15) * extraBrightness;
              const emissiveBoost = (2.0 + speed * 0.2) * extraBrightness;

              for (let tc = 0; tc < trailCount; tc++) {
                if (Math.random() < spawnProbability) {
                  let finalOffX = offsetX;
                  let finalOffZ = offsetZ;
                  let pSize = trailSize;
                  let pHue = baseHue;

                  // 螺旋特殊处理：双股反相
                  if (trajectoryName.includes('SPIRAL') || trajectoryName.includes('HELIX')) {
                      // tc=0: 正相, tc=1: 反相 (PI)
                      const phase = (tc % 2) * Math.PI;
                      // 重算偏移以确保双股正确
                      finalOffX = Math.cos(t * 10 + phase) * 12.0;
                      finalOffZ = Math.sin(t * 10 + phase) * 12.0;
                      
                      // 双色
                      pHue = fw.hue + (tc % 2 === 0 ? 0 : 180); 
                      pSize = trailSize * 0.8;
                  }

                  const p = particlePoolRef.current.get({
                    x: fw.position.x + finalOffX + (Math.random() - 0.5) * trailSpread,
                    y: fw.position.y - 1.0, 
                    z: fw.position.z + finalOffZ + (Math.random() - 0.5) * trailSpread,
                    hue: pHue,  
                    speed: 0, 
                    size: pSize * (Math.random() * 0.4 + 0.8),
                    decay: trailDecay * (Math.random() * 0.4 + 0.8),
                    behavior: 'default',
                    gravity: trailGravity
                  });
                  
                  if (p) {
                    p.alpha = alphaValue; 
                    p.emissiveIntensity = emissiveBoost;
                    // 加速尾焰反推效果
                    if (trajectoryName.includes('ACCELERATE')) {
                       p.velocity.y = -speed * 0.15;
                       p.velocity.x *= 0.1;
                       p.velocity.z *= 0.1;
                    }
                  }
                }
              }
            }

            // 爆炸逻辑
            if (fw.exploded) {
              fw.createExplosion(currentSettings, (opts) => particlePoolRef.current.get(opts));
              fireworksRef.current.splice(i, 1);
            }
          }

          // C. 全局粒子物理更新 (Verlet 积分)
          particlePoolRef.current.update(subDt);
        }
      }

      // D. 同步粒子 Buffer 到 GPU
      const activeParticles = particlePoolRef.current.getActiveParticles();
      const posArray = particleGeometry.attributes.position.array as Float32Array;
      const colArray = particleGeometry.attributes.color.array as Float32Array;

      for (let i = 0; i < activeParticles.length; i++) {
        const p = activeParticles[i];
        const idx = i * 3;
        posArray[idx] = p.position.x;
        posArray[idx + 1] = p.position.y;
        posArray[idx + 2] = p.position.z;

        // HDR 颜色计算：基础色 × alpha × 发光强度
        // emissiveIntensity > 1.0 会产生 HDR 效果，与 Bloom 配合产生光溢出
        const color = p.getColor();
        const hdrMultiplier = p.alpha * Math.min(p.emissiveIntensity, 5.0);  // 限制最大强度避免过曝
        colArray[idx] = color.r * hdrMultiplier;
        colArray[idx + 1] = color.g * hdrMultiplier;
        colArray[idx + 2] = color.b * hdrMultiplier;
      }

      // 隐藏非活动粒子
      for (let i = activeParticles.length; i < maxParticles; i++) {
        const idx = i * 3;
        if (posArray[idx + 1] > -5000) {
          posArray[idx] = 0;
          posArray[idx + 1] = -10000;
          posArray[idx + 2] = 0;
        } else if (i > activeParticles.length + 200) {
          break; // 优化：如果已经是一块连续的隐藏区则停止
        }
      }

      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.color.needsUpdate = true;

      // E. 更新星星闪烁
      updateStarsTwinkle(performance.now() * 0.0005);

      // F. FPS 统计
      fpsRef.current.frames++;
      if (performance.now() - fpsRef.current.lastTime > 1000) {
        fpsRef.current.value = fpsRef.current.frames;
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = performance.now();
      }

      // G. 渲染
      composer.render();

      // H. 回调
      if (onTimeUpdate) onTimeUpdate(tc);
      if (onStatsUpdate) {
        onStatsUpdate({
          particles: activeParticles.length,
          fireworks: fireworksRef.current.length,
          fps: fpsRef.current.value
        });
      }
    };

    renderLoop();

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(requestRef.current);
      renderer.dispose();
      controls.dispose();
    };
  }, []);

  // 交互剧本索引指针
  const manualStepIndexRef = useRef<number>(0);

  // === 暴露接口给父组件 ===
  useImperativeHandle(ref, () => ({
    launchCarnival: () => launchCarnivalWave(settingsRef.current, configRef.current),
    launchAt: (x, y, z) => {
      const mc = manualConfigRef.current;
      const c = configRef.current;
      const settings = settingsRef.current;
      const manualSeq = c.manualSequence || [];

      // 如果配置了手动交互剧本，则按剧本顺序发射
      if (manualSeq.length > 0) {
        const stage = manualSeq[manualStepIndexRef.current];
        onLaunch?.(`[剧本] ${stage.name}`);
        
        launchGroup(
            stage.formation || LaunchFormation.SINGLE,
            stage.count,
            stage.interval || 100,
            stage.duration || 0,
            (idx, offS, offT) => {
               launchSingle(settings, c, {
                 trajectory: stage.trajectory,
                 shape: stage.shape,
                 combo: stage.combo,
                 duration: stage.duration,
                 targetX: x + offT.x,
                 targetY: y > 50 ? y : 220,
                 targetZ: z + offT.z,
                 startX: x + (Math.random() - 0.5) * 40 + offS.x,
                 startZ: z + (Math.random() - 0.5) * 40 + offS.z,
                 skipLog: idx > 0
               });
            }
        );

        manualStepIndexRef.current = (manualStepIndexRef.current + 1) % manualSeq.length;
      } else {
        // 回退逻辑：手动配置
        // 使用新参数 lockedFormation, lockedCount, lockedDuration
        const formation = mc.lockedFormation || LaunchFormation.SINGLE;
        const count = mc.lockedCount || 1;
        
        launchGroup(
            formation,
            count,
            mc.lockedInterval || 100,
            mc.lockedDuration || 0,
            (idx, offS, offT) => {
                launchSingle(settings, c, {
                  trajectory: mc.lockedTrajectory,
                  shape: mc.lockedShape,
                  combo: mc.lockedCombo,
                  duration: mc.lockedDuration,
                  targetX: x + offT.x,
                  targetY: y > 50 ? y + (Math.random()-0.5)*20 : 200 + (Math.random()-0.5)*20,
                  targetZ: z + offT.z,
                  startX: x + (Math.random() - 0.5) * 50 + offS.x,
                  startZ: z + (Math.random() - 0.5) * 50 + offS.z,
                  skipLog: idx > 0
                });
            }
        );
        
        if (count <= 1) onLaunch?.(`🎯 手动单发`);
        else onLaunch?.(`🎯 手动齐射: ${count}发 (${formation})`);
      }
    },
    getTimeController: () => timeControllerRef.current
  }));

  // === 鼠标交互事件 ===
  const handleInteraction = (e: React.MouseEvent) => {
    if (e.button === 0 && cameraRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouse = new THREE.Vector2(
          ((e.clientX - rect.left) / rect.width) * 2 - 1,
          -((e.clientY - rect.top) / rect.height) * 2 + 1
      );

      const ray = new THREE.Raycaster();
      ray.setFromCamera(mouse, cameraRef.current);
      const targetPoint = new THREE.Vector3();
      ray.ray.intersectPlane(planeRef.current, targetPoint);

      if (targetPoint) {
        // 通过 Ref 获取自身暴露的接口进行发射
        // @ts-ignore
        ref.current?.launchAt(targetPoint.x, targetPoint.y, targetPoint.z);
      }
    }
  };

  return (
      <div
          ref={containerRef}
          className="w-full h-full block cursor-crosshair outline-none"
          onMouseDown={(e) => {
            mouseDownPos.current = { x: e.clientX, y: e.clientY };
            mouseDownTime.current = performance.now();
          }}
          onMouseUp={(e) => {
            const dist = Math.sqrt(Math.pow(e.clientX - mouseDownPos.current.x, 2) + Math.pow(e.clientY - mouseDownPos.current.y, 2));
            if (dist < 5 && (performance.now() - mouseDownTime.current) < 300) {
              handleInteraction(e);
            }
          }}
      />
  );
};

// 封装导出
export const FireworkScene3D = memo(forwardRef(FireworkScene3DInner));