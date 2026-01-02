// FILE: src/components/FireworkScene3D.tsx

import React, { useEffect, useRef, useImperativeHandle, forwardRef, memo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { ParticlePool3D } from '../core/ParticlePool3D';
import { Firework3D } from '../core/Firework3D';
import { TimeController } from '../core/TimeController';
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
 * 内部辅助函数：创建一个发光的粒子贴图
 */
const createDetailedParticleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);

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

    // 4. 创建渲染器 (Renderer)
    const renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ReinhardToneMapping;
    renderer.toneMappingExposure = 1.8;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 5. 配置后期处理 (EffectComposer) 实现辉光
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.2, // 强度
        0.4, // 半径
        0.1  // 阈值
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

        // B. 烟花物理更新
        for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
          const fw = fireworksRef.current[i];
          fw.update(currentSettings, dt);

          // 升空过程：生成尾焰粒子
          if (!fw.exploded) {
            const speed = fw.velocity.length();
            // 解决“太亮”问题：根据速度动态调节透明度和密度
            const spawnProbability = Math.min(1, speed / 15);
            const alphaValue = Math.min(1, speed / 20);

            if (Math.random() < spawnProbability) {
              const p = particlePoolRef.current.get({
                x: fw.position.x + (Math.random() - 0.5) * 1.5,
                y: fw.position.y - 1,
                z: fw.position.z + (Math.random() - 0.5) * 1.5,
                hue: fw.hue,
                speed: 0,
                size: 5 * (speed / 30 + 0.5),
                decay: 0.08,
                behavior: 'default',
                gravity: 0.02
              });
              if (p) p.alpha = alphaValue;
            }
          }

          // 爆炸逻辑
          if (fw.exploded) {
            fw.createExplosion(currentSettings, (opts) => particlePoolRef.current.get(opts));
            fireworksRef.current.splice(i, 1);
          }
        }

        // C. 全局粒子物理更新
        particlePoolRef.current.update(dt);
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

        const color = p.getColor();
        colArray[idx] = color.r * p.alpha;
        colArray[idx + 1] = color.g * p.alpha;
        colArray[idx + 2] = color.b * p.alpha;
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