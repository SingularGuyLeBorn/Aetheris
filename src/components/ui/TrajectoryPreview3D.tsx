// FILE: src/components/ui/TrajectoryPreview3D.tsx
// 3D 轨迹预览组件

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
  const lineRef = useRef<THREE.Line | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameRef = useRef<number>(0);
  
  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // 场景
    const scene = new THREE.Scene();
    scene.background = null; // 透明背景
    sceneRef.current = scene;
    
    // 相机
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 40);
    cameraRef.current = camera;
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 增加一点环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // 动画循环
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (lineRef.current) {
        // 让线条微微旋转
        lineRef.current.rotation.y += 0.005;
      }
      
      if (particlesRef.current) {
         particlesRef.current.rotation.y += 0.005;
      }

      renderer.render(scene, camera);
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
  
  // 更新轨迹
  useEffect(() => {
    if (!sceneRef.current || !trajectoryType) return;
    
    // 清理旧对象
    if (lineRef.current) {
      sceneRef.current.remove(lineRef.current);
      lineRef.current.geometry.dispose();
      (lineRef.current.material as THREE.Material).dispose();
      lineRef.current = null;
    }
    if (particlesRef.current) {
        sceneRef.current.remove(particlesRef.current);
        particlesRef.current.geometry.dispose();
        (particlesRef.current.material as THREE.Material).dispose();
        particlesRef.current = null;
    }

    // 模拟轨迹点
    const points: THREE.Vector3[] = [];
    const calculator = TrajectoryFactory.create(trajectoryType);
    
    // 初始状态
    let pos = new Vector3(0, -10, 0); // 从下方开始
    let vel = new Vector3(0, 15, 0);  // 初始向上速度
    const dt = 0.016; // 60fps step
    const gravity = 0.05; // 模拟重力
    
    // 模拟约 100 帧
    for (let i = 0; i < 150; i++) {
      // 记录点 (转换为 THREE.Vector3)
      points.push(new THREE.Vector3(pos.x, pos.y, pos.z));
      
      // 计算下一步
      vel = calculator.calculate(vel, gravity, dt);
      
      // 更新位置 (简单的欧拉积分)
      pos.x += vel.x * dt * 5; // 缩放系数调整视觉大小
      pos.y += vel.y * dt * 5;
      pos.z += vel.z * dt * 5;
    }
    
    // 创建线条几何体
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    
    // 创建材质 (发光线条)
    const material = new THREE.LineBasicMaterial({ 
      color: 0x60a5fa, // 蓝色
      linewidth: 2,
      opacity: 0.8,
      transparent: true
    });
    
    const line = new THREE.Line(geometry, material);
    sceneRef.current.add(line);
    lineRef.current = line;

    // 添加粒子点缀 (在轨迹上随机撒点)
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = [];
    for(let i=0; i<points.length; i+=3) { // 每隔几个点放一个粒子
        particlePos.push(points[i].x, points[i].y, points[i].z);
    }
    particleGeo.setAttribute('position', new THREE.Float32BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.5,
        transparent: true,
        opacity: 0.6
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    sceneRef.current.add(particles);
    particlesRef.current = particles;

  }, [trajectoryType]);
  
  // 获取当前轨迹信息
  const info = trajectoryType ? TRAJECTORY_INFO[trajectoryType] : null;

  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 3D Canvas 容器 */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* 装饰背景 */}
      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent pointer-events-none" />
      
      {/* 信息展示 (悬浮在 3D 场景之上) */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
        {!trajectoryType ? (
           <div className="text-center text-white/50">
             <div className="text-2xl mb-2">🚀</div>
             <div className="text-xs font-bold uppercase tracking-widest">Select to Preview</div>
           </div>
        ) : (
           <div className="mt-auto mb-4 text-center">
             <div className="px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10 shadow-xl inline-block">
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] drop-shadow-sm">
                   3D PREVIEW: {info?.name}
                </span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
