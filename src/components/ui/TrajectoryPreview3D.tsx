// FILE: src/components/ui/TrajectoryPreview3D.tsx
// 3D 轨迹预览组件 - 动态粒子路径演示版本

import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { TrajectoryType, TrajectoryFactory, TRAJECTORY_INFO } from '../../core/trajectories/TrajectoryFactory';
import { Vector3 } from '../../core/Vector3';

interface TrajectoryPreview3DProps {
  trajectoryType: TrajectoryType | null;
  className?: string;
}

export const TrajectoryPreview3D: React.FC<TrajectoryPreview3DProps> = ({
  trajectoryType,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  
  // 动画状态引用
  const projectileRef = useRef<THREE.Mesh | null>(null);
  const trailRef = useRef<THREE.Line | null>(null);
  const trailPointsRef = useRef<THREE.Vector3[]>([]);
  const frameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const calculatorRef = useRef<any>(null); // TrajectoryCalculator
  const currentPosRef = useRef<Vector3>(new Vector3(0, -10, 0));
  const currentVelRef = useRef<Vector3>(new Vector3(0, 15, 0));
  
  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // 场景
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    // 相机 (正交相机可能更适合简单的路径展示，但透视更真实)
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 5, 50); // 拉远一点
    cameraRef.current = camera;
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 辅助网格 (地板)
    const grid = new THREE.GridHelper(30, 20, 0x444444, 0x222222);
    grid.position.y = -15;
    scene.add(grid);

    // 动画循环
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
         updatePhysics();
         
         // 简单的相机旋转
         camera.position.x = Math.sin(Date.now() * 0.0005) * 45;
         camera.position.z = Math.cos(Date.now() * 0.0005) * 45;
         camera.lookAt(0, 5, 0);

         rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
    
    // Resize Observer
    const handleResize = () => {
      if (containerRef.current && cameraRef.current && rendererRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      }
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  const resetSimulation = () => {
      timeRef.current = 0;
      currentPosRef.current = new Vector3(0, -15, 0); // 底部开始
      currentVelRef.current = new Vector3(0, 20, 0); // 初始向上速度
      trailPointsRef.current = [];
      
      if (calculatorRef.current && projectileRef.current) {
          // Reset projectile pos
          projectileRef.current.position.set(0, -15, 0);
          projectileRef.current.visible = true;
          (projectileRef.current.material as THREE.MeshBasicMaterial).opacity = 1;
      }
      
      // Reset Calculator state
      if (trajectoryType) {
          calculatorRef.current = TrajectoryFactory.create(trajectoryType);
      }
  };
  
  // 更新轨迹类型
  useEffect(() => {
    if (!sceneRef.current) return;
    
    // 清理
    if (projectileRef.current) sceneRef.current.remove(projectileRef.current);
    if (trailRef.current) sceneRef.current.remove(trailRef.current);
    
    if (trajectoryType) {
        // 创建新的发射物 (Glowing Orb)
        const geometry = new THREE.SphereGeometry(0.8, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0x4ade80 });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Add Glow Sprite?? Maybe too complex used simplified sphere
        
        sceneRef.current.add(mesh);
        projectileRef.current = mesh;
        
        // 创建拖尾线条对象
        const lineGeo = new THREE.BufferGeometry();
        const lineMat = new THREE.LineBasicMaterial({ 
            color: 0x4ade80, 
            transparent: true, 
            opacity: 0.5,
            linewidth: 2 
        });
        const line = new THREE.Line(lineGeo, lineMat);
        sceneRef.current.add(line);
        trailRef.current = line;

        resetSimulation();
    }
  }, [trajectoryType]);

  const updatePhysics = () => {
      if (!calculatorRef.current || !projectileRef.current || !trailRef.current) return;

      const dt = 0.016; // Fixed step
      timeRef.current += dt;

      // 模拟重力
      const gravity = 0.1;
      
      // 1. Calculate next velocity
      let oldVel = currentVelRef.current.clone();
      let newVel = calculatorRef.current.calculate(oldVel, gravity, dt); // calculate modifies internal state
      currentVelRef.current = newVel;
      
      // 2. Update position
      // Add some scaling for visualization
      const speedScale = 0.8;
      currentPosRef.current.x += newVel.x * dt * 5 * speedScale;
      currentPosRef.current.y += newVel.y * dt * 5 * speedScale;
      currentPosRef.current.z += newVel.z * dt * 5 * speedScale; // 3D depth

      // 3. Update Visuals
      projectileRef.current.position.set(
          currentPosRef.current.x,
          currentPosRef.current.y,
          currentPosRef.current.z
      );

      // Track trail
      trailPointsRef.current.push(new THREE.Vector3(
          currentPosRef.current.x,
          currentPosRef.current.y,
          currentPosRef.current.z
      ));
      
      // Limit trail length
      if (trailPointsRef.current.length > 100) {
          trailPointsRef.current.shift();
      }
      
      // Update trail geometry
      trailRef.current.geometry.setFromPoints(trailPointsRef.current);
      
      // Reset if too high or too long
      if (currentPosRef.current.y > 20 || timeRef.current > 3.0) {
          // Fade out then reset? Just reset for now
          resetSimulation();
      }
  };
  
  // 获取当前轨迹信息
  const info = trajectoryType ? TRAJECTORY_INFO[trajectoryType] : null;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* Info Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none z-10">
        {!trajectoryType ? (
           <div className="text-white/40 text-xs font-bold uppercase tracking-widest bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm">
             Select a Path
           </div>
        ) : (
           <div className="flex flex-col items-center gap-1 animate-slideUp">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping absolute -top-4" />
             <div className="text-[10px] font-black text-emerald-300 uppercase tracking-[0.2em] drop-shadow-md bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
                Simulating: {info?.name}
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
