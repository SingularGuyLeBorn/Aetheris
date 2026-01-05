/**
 * StreamFireworkDemo.tsx
 * 
 * 演示组件：展示"一切皆流"架构的烟花效果
 * 
 * 特性：
 * - 点击空中发射烟花
 * - 支持多种预设清单
 * - 实时统计显示
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Director, StreamRenderer, globalDirector } from '../core/stream';
import { Vector3 } from '../core/Vector3';

interface StreamFireworkDemoProps {
  width?: number;
  height?: number;
}

interface Stats {
  activeFireworks: number;
  totalParticles: number;
  trailParticles: number;
  fps: number;
}

const StreamFireworkDemo: React.FC<StreamFireworkDemoProps> = ({
  width = window.innerWidth,
  height = window.innerHeight
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const streamRendererRef = useRef<StreamRenderer | null>(null);
  const directorRef = useRef<Director | null>(null);
  const animationIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);

  const [stats, setStats] = useState<Stats>({
    activeFireworks: 0,
    totalParticles: 0,
    trailParticles: 0,
    fps: 60
  });
  const [selectedManifest, setSelectedManifest] = useState<string>('phoenix_rebirth');
  const [isPaused, setIsPaused] = useState(false);

  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;

    // === 创建场景 ===
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050510);
    sceneRef.current = scene;

    // === 创建相机 ===
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.set(0, 50, 150);
    camera.lookAt(0, 50, 0);
    cameraRef.current = camera;

    // === 创建渲染器 ===
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.5;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // === 轨道控制器 ===
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.target.set(0, 50, 0);
    controls.minDistance = 50;
    controls.maxDistance = 500;
    controlsRef.current = controls;

    // === 环境光 ===
    const ambientLight = new THREE.AmbientLight(0x111122, 0.3);
    scene.add(ambientLight);

    // === 添加星空背景 ===
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount; i++) {
      const radius = 500 + Math.random() * 500;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      starPositions[i * 3 + 1] = radius * Math.cos(phi);
      starPositions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
      
      const brightness = 0.3 + Math.random() * 0.7;
      starColors[i * 3] = brightness;
      starColors[i * 3 + 1] = brightness;
      starColors[i * 3 + 2] = brightness + Math.random() * 0.1;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      size: 1.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // === 添加地平线网格 ===
    const gridHelper = new THREE.GridHelper(400, 40, 0x222244, 0x111133);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // === 创建导演和渲染器 ===
    const director = new Director({ debug: true, maxActiveFireworks: 30 });
    directorRef.current = director;

    const streamRenderer = new StreamRenderer(scene, director, {
      maxParticles: 50000,
      maxTrailParticles: 10000,
      particleTexture: 'soft',
      glowMultiplier: 2
    });
    streamRendererRef.current = streamRenderer;

    // === 动画循环 ===
    let lastTime = performance.now();
    
    const animate = (currentTime: number) => {
      animationIdRef.current = requestAnimationFrame(animate);
      
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      // FPS 计算
      frameCountRef.current++;
      if (currentTime - fpsTimeRef.current >= 1000) {
        setStats(prev => ({ ...prev, fps: frameCountRef.current }));
        frameCountRef.current = 0;
        fpsTimeRef.current = currentTime;
      }
      
      // 更新控制器
      controls.update();
      
      // 更新导演和渲染器
      director.update(deltaTime);
      streamRenderer.update(deltaTime);
      
      // 更新统计
      const directorStats = director.getStats();
      setStats(prev => ({
        ...prev,
        activeFireworks: directorStats.activeFireworks,
        totalParticles: directorStats.totalParticles,
        trailParticles: directorStats.trailParticles
      }));
      
      // 渲染场景
      renderer.render(scene, camera);
    };
    
    animationIdRef.current = requestAnimationFrame(animate);

    // === 清理 ===
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      streamRenderer.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [width, height]);

  // 处理点击发射
  const handleClick = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!cameraRef.current || !directorRef.current || !sceneRef.current) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    // 创建射线
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    // 计算在 Y=80 平面上的交点作为目标位置
    const targetY = 60 + Math.random() * 40;
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -targetY);
    const target = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, target);

    if (!target) return;

    // 发射位置在地面
    const launchX = target.x + (Math.random() - 0.5) * 20;
    const launchZ = target.z + (Math.random() - 0.5) * 20;

    const launchPos = new Vector3(launchX, 0, launchZ);
    const targetPos = new Vector3(target.x, target.y, target.z);

    // 发射烟花
    directorRef.current.launch(
      selectedManifest,
      launchPos,
      targetPos,
      Math.random() * 360
    );
  }, [selectedManifest]);

  // 自动发射
  const handleAutoLaunch = useCallback(() => {
    if (!directorRef.current) return;

    const x = (Math.random() - 0.5) * 100;
    const z = (Math.random() - 0.5) * 100;
    const y = 60 + Math.random() * 40;

    const launchPos = new Vector3(x, 0, z);
    const targetPos = new Vector3(x + (Math.random() - 0.5) * 20, y, z + (Math.random() - 0.5) * 20);

    const manifests = directorRef.current.getAllManifests();
    const randomManifest = manifests[Math.floor(Math.random() * manifests.length)];
    
    directorRef.current.launch(
      randomManifest.id,
      launchPos,
      targetPos,
      Math.random() * 360
    );
  }, []);

  // 暂停/继续
  const togglePause = useCallback(() => {
    if (!directorRef.current) return;
    
    if (isPaused) {
      directorRef.current.resume();
    } else {
      directorRef.current.pause();
    }
    setIsPaused(!isPaused);
  }, [isPaused]);

  // 重置
  const handleReset = useCallback(() => {
    directorRef.current?.reset();
  }, []);

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
      <div
        ref={containerRef}
        onClick={handleClick}
        style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
      />
      
      {/* 控制面板 */}
      <div style={{
        position: 'absolute',
        top: 20,
        left: 20,
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 12,
        padding: 20,
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        minWidth: 200
      }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: 18, fontWeight: 600 }}>
          🎆 Stream Architecture Demo
        </h3>
        
        {/* 统计信息 */}
        <div style={{ marginBottom: 15, fontSize: 13, opacity: 0.9 }}>
          <div>FPS: <span style={{ color: stats.fps > 30 ? '#4ade80' : '#f87171' }}>{stats.fps}</span></div>
          <div>Active Fireworks: {stats.activeFireworks}</div>
          <div>Particles: {stats.totalParticles.toLocaleString()}</div>
          <div>Trail Particles: {stats.trailParticles.toLocaleString()}</div>
        </div>
        
        {/* 清单选择 */}
        <div style={{ marginBottom: 15 }}>
          <label style={{ display: 'block', marginBottom: 5, fontSize: 12, opacity: 0.7 }}>
            Select Manifest:
          </label>
          <select
            value={selectedManifest}
            onChange={(e) => setSelectedManifest(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 14,
              cursor: 'pointer'
            }}
          >
            <option value="phoenix_rebirth">🔥 凤凰涅槃</option>
            <option value="simple_sphere">💥 经典球形</option>
            <option value="heart_morph">❤️ 心心相印</option>
            <option value="galaxy_spiral">🌌 银河诞生</option>
          </select>
        </div>
        
        {/* 控制按钮 */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleAutoLaunch}
            style={{
              flex: 1,
              padding: '10px',
              borderRadius: 6,
              border: 'none',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🚀 Launch
          </button>
          
          <button
            onClick={togglePause}
            style={{
              padding: '10px 15px',
              borderRadius: 6,
              border: 'none',
              background: isPaused ? '#22c55e' : '#eab308',
              color: '#000',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {isPaused ? '▶️' : '⏸️'}
          </button>
          
          <button
            onClick={handleReset}
            style={{
              padding: '10px 15px',
              borderRadius: 6,
              border: 'none',
              background: '#ef4444',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            🔄
          </button>
        </div>
        
        {/* 提示 */}
        <p style={{ marginTop: 15, fontSize: 11, opacity: 0.6, marginBottom: 0 }}>
          Click anywhere in the sky to launch!
        </p>
      </div>
      
      {/* 架构说明 */}
      <div style={{
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
        background: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 8,
        padding: 15,
        color: '#fff',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 12,
        backdropFilter: 'blur(5px)'
      }}>
        <strong>Architecture: </strong>
        Director → CarrierSystem (launch) → ParticleStream (explosion/morph) → StreamRenderer (GPU)
        <span style={{ opacity: 0.6, marginLeft: 10 }}>
          | ForceFieldSystem (physics) | MorphingEngine (shape transitions)
        </span>
      </div>
    </div>
  );
};

export default StreamFireworkDemo;
