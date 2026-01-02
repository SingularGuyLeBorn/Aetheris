// FILE: src/components/FireworkScene3D.tsx

import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';

import { ParticlePool3D } from '../core/ParticlePool3D';
import { Firework3D } from '../core/Firework3D';
import { TimeController } from '../core/TimeController';
import { AppSettings, CameraMode, ExplosionType } from '../types';

const createSoftParticleTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const texture = new THREE.CanvasTexture(canvas);
  texture.premultiplyAlpha = true;
  return texture;
};

interface FireworkScene3DProps {
  settings: AppSettings;
  autoRotate: boolean;
  onTimeUpdate?: (timeController: TimeController) => void;
  onStatsUpdate?: (stats: { particles: number; fireworks: number; fps: number }) => void;
}

export interface FireworkScene3DHandle {
  launchCarnival: () => void;
  launchAt: (x: number, y: number, z: number) => void;
  getTimeController: () => TimeController;
  setCameraMode: (mode: CameraMode) => void;
}

export const FireworkScene3D = forwardRef<FireworkScene3DHandle, FireworkScene3DProps>(
    ({ settings, autoRotate, onTimeUpdate, onStatsUpdate }, ref) => {
      const containerRef = useRef<HTMLDivElement>(null);
      const sceneRef = useRef<THREE.Scene | null>(null);
      const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
      const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
      const controlsRef = useRef<OrbitControls | null>(null);
      const requestRef = useRef<number | undefined>(undefined);

      const settingsRef = useRef(settings);
      const autoRotateRef = useRef(autoRotate);
      const onTimeUpdateRef = useRef(onTimeUpdate);
      const onStatsUpdateRef = useRef(onStatsUpdate);

      useEffect(() => { settingsRef.current = settings; }, [settings]);
      useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);
      useEffect(() => { onTimeUpdateRef.current = onTimeUpdate; }, [onTimeUpdate]);
      useEffect(() => { onStatsUpdateRef.current = onStatsUpdate; }, [onStatsUpdate]);

      const fireworksRef = useRef<Firework3D[]>([]);
      const particlePoolRef = useRef<ParticlePool3D | null>(null);
      const timeControllerRef = useRef<TimeController>(new TimeController());

      const particleGeometryRef = useRef<THREE.BufferGeometry | null>(null);
      const starsRef = useRef<THREE.Points | null>(null);

      const lastAutoLaunchRef = useRef<number>(0);
      const fpsRef = useRef({ frames: 0, lastTime: 0, fps: 0 });

      const raycasterRef = useRef(new THREE.Raycaster());
      const planeRef = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

      const mouseDownPos = useRef({ x: 0, y: 0 });
      const mouseDownTime = useRef(0);

      useEffect(() => {
        if (!containerRef.current) return;
        containerRef.current.innerHTML = '';

        const scene = new THREE.Scene();
        const bgColor = new THREE.Color(0x0a0e17);
        scene.background = bgColor;
        scene.fog = new THREE.FogExp2(0x0a0e17, 0.0006);
        sceneRef.current = scene;

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
        camera.position.set(0, 150, 600);
        cameraRef.current = camera;

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

        const renderScene = new RenderPass(scene, camera);
        const bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            1.2, 0.4, 0.1
        );
        const composer = new EffectComposer(renderer);
        composer.addPass(renderScene);
        composer.addPass(bloomPass);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.minDistance = 100;
        controls.maxDistance = 1500;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.minPolarAngle = 0.2;
        controls.autoRotate = autoRotateRef.current;
        controls.autoRotateSpeed = 0.8;
        controlsRef.current = controls;

        particlePoolRef.current = new ParticlePool3D(18000);

        const particleGeometry = new THREE.BufferGeometry();
        const maxParticles = 18000;
        const positions = new Float32Array(maxParticles * 3);
        const colors = new Float32Array(maxParticles * 3);
        const sizes = new Float32Array(maxParticles);

        for(let i=0; i<maxParticles * 3; i++) positions[i] = 0;
        for(let i=1; i<maxParticles * 3; i+=3) positions[i] = -10000;

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        particleGeometryRef.current = particleGeometry;

        const particleMaterial = new THREE.PointsMaterial({
          size: 8,
          map: createSoftParticleTexture(),
          vertexColors: true,
          transparent: true,
          opacity: 1,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          sizeAttenuation: true
        });

        const particlePoints = new THREE.Points(particleGeometry, particleMaterial);
        particlePoints.frustumCulled = false;
        scene.add(particlePoints);

        createStars(scene);
        createGround(scene);

        const handleResize = () => {
          if (!cameraRef.current || !rendererRef.current) return;
          const width = window.innerWidth;
          const height = window.innerHeight;
          cameraRef.current.aspect = width / height;
          cameraRef.current.updateProjectionMatrix();
          rendererRef.current.setSize(width, height);
          composer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        const animate = () => {
          requestRef.current = requestAnimationFrame(animate);

          const timeController = timeControllerRef.current;
          const currentSettings = settingsRef.current;

          if (controlsRef.current) {
            controlsRef.current.autoRotate = autoRotateRef.current;
            controlsRef.current.update();
          }

          if (!timeController.isPaused) {
            timeController.update();
            const deltaTime = timeController.deltaTime;
            const virtualTime = timeController.virtualTime * 1000;

            if (virtualTime - lastAutoLaunchRef.current > currentSettings.autoLaunchDelay) {
              launchFireworkInternal(
                  (Math.random() - 0.5) * 500,
                  180 + Math.random() * 120,
                  (Math.random() - 0.5) * 500,
                  undefined,
                  undefined,
                  currentSettings
              );
              lastAutoLaunchRef.current = virtualTime;
            }

            for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
              const fw = fireworksRef.current[i];
              fw.update(currentSettings, deltaTime);

              // === 升空形态逻辑 (Shaped Ascension) ===
              if (!fw.exploded) {
                // 通用尾焰参数
                const trailHue = fw.hue; // 修复：使用烟花本身的颜色

                // 根据类型产生不同的升空粒子
                if (fw.type === ExplosionType.DRAGON) {
                  // 游龙：螺旋上升
                  const spinSpeed = 10;
                  const radius = 3;
                  const angle = fw.lifeTime * spinSpeed;
                  const tx = Math.cos(angle) * radius;
                  const tz = Math.sin(angle) * radius;

                  particlePoolRef.current?.get({
                    x: fw.position.x + tx,
                    y: fw.position.y,
                    z: fw.position.z + tz,
                    hue: 45, // 金龙
                    speed: 0,
                    size: 6,
                    decay: 0.1,
                    behavior: 'glitter' // 闪烁龙鳞
                  });
                } else if (fw.type === ExplosionType.BUTTERFLY) {
                  // 蝴蝶：两侧摆动
                  const wingSpan = 4 * Math.abs(Math.sin(fw.lifeTime * 15));
                  particlePoolRef.current?.get({
                    x: fw.position.x + wingSpan,
                    y: fw.position.y,
                    z: fw.position.z,
                    hue: trailHue,
                    size: 5, decay: 0.15
                  });
                  particlePoolRef.current?.get({
                    x: fw.position.x - wingSpan,
                    y: fw.position.y,
                    z: fw.position.z,
                    hue: trailHue,
                    size: 5, decay: 0.15
                  });
                } else if (fw.type === ExplosionType.HELIX || fw.type === ExplosionType.ZODIAC) {
                  // 螺旋：DNA上升
                  const angle = fw.lifeTime * 8;
                  const r = 2;
                  particlePoolRef.current?.get({
                    x: fw.position.x + Math.cos(angle)*r, y: fw.position.y, z: fw.position.z + Math.sin(angle)*r,
                    hue: trailHue, size: 4, decay: 0.1
                  });
                  particlePoolRef.current?.get({
                    x: fw.position.x - Math.cos(angle)*r, y: fw.position.y, z: fw.position.z - Math.sin(angle)*r,
                    hue: (trailHue+180)%360, size: 4, decay: 0.1
                  });
                } else {
                  // 默认：强力火箭尾焰
                  // 增加密集度，防止断层
                  for(let k=0; k<3; k++) {
                    particlePoolRef.current?.get({
                      x: fw.position.x + (Math.random()-0.5) * 1.0,
                      y: fw.position.y - k*1.5,
                      z: fw.position.z + (Math.random()-0.5) * 1.0,
                      hue: trailHue,
                      speed: 0,
                      size: 5,
                      decay: 0.08,
                      behavior: 'default',
                      gravity: 0.02
                    });
                  }
                }
              }

              if (fw.exploded) {
                fw.createExplosion(currentSettings, (opts) => particlePoolRef.current!.get(opts));
                fireworksRef.current.splice(i, 1);
              }
            }

            particlePoolRef.current?.update(deltaTime);
          }

          updateParticleGeometry();
          updateStars(performance.now() * 0.0005);

          fpsRef.current.frames++;
          const now = performance.now();
          if (now - fpsRef.current.lastTime >= 1000) {
            fpsRef.current.fps = fpsRef.current.frames;
            fpsRef.current.frames = 0;
            fpsRef.current.lastTime = now;
          }

          composer.render();

          if (onTimeUpdateRef.current) onTimeUpdateRef.current(timeController);
          if (onStatsUpdateRef.current) {
            onStatsUpdateRef.current({
              particles: particlePoolRef.current?.activeCount ?? 0,
              fireworks: fireworksRef.current.length,
              fps: fpsRef.current.fps
            });
          }
        };

        requestRef.current = requestAnimationFrame(animate);

        return () => {
          window.removeEventListener('resize', handleResize);
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
          if (controlsRef.current) controlsRef.current.dispose();
          if (rendererRef.current) {
            rendererRef.current.dispose();
            rendererRef.current.forceContextLoss();
            if(containerRef.current && rendererRef.current.domElement && containerRef.current.contains(rendererRef.current.domElement)) {
              containerRef.current.removeChild(rendererRef.current.domElement);
            }
          }
        };
      }, []);

      const launchFireworkInternal = (x: number, y: number, z: number, hue?: number, charge?: number, currentSettings?: AppSettings) => {
        const s = currentSettings || settingsRef.current;
        const startX = (Math.random() - 0.5) * 400;
        const startZ = (Math.random() - 0.5) * 400;

        fireworksRef.current.push(new Firework3D({
          startX,
          startZ,
          targetX: x,
          targetY: y,
          targetZ: z,
          hue: hue ?? Math.random() * 360,
          charge: charge ?? 0.4 + Math.random() * 0.6
        }, s));
      };

      const createStars = (scene: THREE.Scene) => {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 3000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        const sizes = new Float32Array(starCount);

        for (let i = 0; i < starCount; i++) {
          const r = 2000 + Math.random() * 3000;
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.acos(2 * Math.random() - 1);
          positions[i*3] = r * Math.sin(phi) * Math.cos(theta);
          positions[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
          positions[i*3+2] = r * Math.cos(phi);

          colors[i*3] = 0.8; colors[i*3+1] = 0.9; colors[i*3+2] = 1.0;
          sizes[i] = Math.random() * 2;
        }
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const stars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
          size: 3, vertexColors: true, transparent: true, opacity: 0.6, sizeAttenuation: false
        }));
        scene.add(stars);
        starsRef.current = stars;
      };

      const createGround = (scene: THREE.Scene) => {
        const grid = new THREE.GridHelper(6000, 60, 0x334455, 0x111e2f);
        (grid.material as THREE.Material).transparent = true;
        (grid.material as THREE.Material).opacity = 0.15;
        grid.position.y = -5;
        scene.add(grid);
      };

      const updateParticleGeometry = () => {
        if (!particleGeometryRef.current || !particlePoolRef.current) return;
        const particles = particlePoolRef.current.getActiveParticles();
        const positions = particleGeometryRef.current.attributes.position.array as Float32Array;
        const colors = particleGeometryRef.current.attributes.color.array as Float32Array;
        const sizes = particleGeometryRef.current.attributes.size.array as Float32Array;

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const i3 = i * 3;
          positions[i3] = p.position.x;
          positions[i3+1] = p.position.y;
          positions[i3+2] = p.position.z;

          const col = p.getColor();
          colors[i3] = col.r * p.alpha;
          colors[i3+1] = col.g * p.alpha;
          colors[i3+2] = col.b * p.alpha;

          sizes[i] = p.size * (p.behavior === 'glitter' && p.twinkleFactor > 0.5 ? 0.3 : 1);
        }

        for (let i = particles.length; i < 18000; i++) {
          if (positions[i*3+1] > -5000) {
            positions[i*3] = 0; positions[i*3+1] = -10000; positions[i*3+2] = 0;
            sizes[i] = 0;
          } else {
            if (i > particles.length + 500) break;
          }
        }

        particleGeometryRef.current.attributes.position.needsUpdate = true;
        particleGeometryRef.current.attributes.color.needsUpdate = true;
        particleGeometryRef.current.attributes.size.needsUpdate = true;
      };

      const updateStars = (time: number) => {
        if (!starsRef.current) return;
        const colors = starsRef.current.geometry.attributes.color.array as Float32Array;
        for(let i=0; i<colors.length; i+=3) {
          const flicker = 0.8 + 0.2 * Math.sin(time + i);
          colors[i] = 0.8 * flicker;
          colors[i+1] = 0.9 * flicker;
          colors[i+2] = 1.0 * flicker;
        }
        starsRef.current.geometry.attributes.color.needsUpdate = true;
      };

      useImperativeHandle(ref, () => ({
        launchCarnival: () => {
          const burst = (c:number) => {
            for(let i=0; i<c; i++) {
              setTimeout(() => launchFireworkInternal(
                  (Math.random()-0.5)*600, 200+Math.random()*100, (Math.random()-0.5)*600
              ), i * 150);
            }
          };
          burst(10);
          setTimeout(() => burst(15), 2000);
        },
        launchAt: (x, y, z) => launchFireworkInternal(x, y, z),
        getTimeController: () => timeControllerRef.current,
        setCameraMode: () => {}
      }));

      // === 修复后的鼠标事件逻辑 (无需 Shift) ===
      const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
          mouseDownPos.current = { x: e.clientX, y: e.clientY };
          mouseDownTime.current = performance.now();
        }
      };

      const handleMouseUp = (e: React.MouseEvent) => {
        if (e.button === 0 && cameraRef.current) {
          // 计算移动距离
          const dist = Math.sqrt(
              Math.pow(e.clientX - mouseDownPos.current.x, 2) +
              Math.pow(e.clientY - mouseDownPos.current.y, 2)
          );
          const timeDiff = performance.now() - mouseDownTime.current;

          // 阈值判断：移动小于 5 像素且时间小于 300ms 视为点击，否则视为拖拽旋转
          if (dist < 5 && timeDiff < 300) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const mouse = new THREE.Vector2(
                ((e.clientX - rect.left) / rect.width) * 2 - 1,
                -((e.clientY - rect.top) / rect.height) * 2 + 1
            );
            raycasterRef.current.setFromCamera(mouse, cameraRef.current);
            const target = new THREE.Vector3();
            raycasterRef.current.ray.intersectPlane(planeRef.current, target);

            if (target) {
              launchFireworkInternal(target.x, 200, target.z, undefined, 0.8);
            }
          }
        }
      };

      return (
          <div
              ref={containerRef}
              className="w-full h-full block cursor-pointer outline-none"
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              title="Left Click: Launch | Drag: Rotate"
          />
      );
    }
);

// END OF FILE: src/components/FireworkScene3D.tsx