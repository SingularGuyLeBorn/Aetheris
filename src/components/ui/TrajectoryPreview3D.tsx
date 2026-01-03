// FILE: src/components/ui/TrajectoryPreview3D.tsx
// 重写：轨迹预览组件 - 带箭头的路径可视化 + 速度向量显示
// 每种轨迹类型有明显不同的视觉表现

import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { TrajectoryType, TrajectoryFactory, TrajectoryCalculator, TRAJECTORY_INFO } from '../../core/trajectories/TrajectoryFactory';
import { Vector3 } from '../../core/Vector3';

// ============ 主组件：3D 轨迹预览 ============
interface TrajectoryPreview3DProps {
  trajectoryType: TrajectoryType | null;
  className?: string;
  // 自定义参数
  speed?: number;       // 初始速度 (1-30)
  height?: number;      // 目标高度 (100-500)
  angle?: number;       // 发射角度 (-45 to 45 度)
}

export const TrajectoryPreview3D: React.FC<TrajectoryPreview3DProps> = ({
  trajectoryType,
  className = '',
  speed = 15,
  height = 300,
  angle = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const frameRef = useRef<number>(0);
  
  // 轨迹线和箭头的引用
  const pathLineRef = useRef<THREE.Line | null>(null);
  const arrowsRef = useRef<THREE.Group | null>(null);
  const projectileRef = useRef<THREE.Mesh | null>(null);
  const animationTimeRef = useRef<number>(0);
  const pathPointsRef = useRef<THREE.Vector3[]>([]);
  
  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    
    // 场景
    const scene = new THREE.Scene();
    scene.background = null;  // 透明背景
    sceneRef.current = scene;
    
    // 相机
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 12, 35);
    camera.lookAt(0, 10, 0);
    cameraRef.current = camera;
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 地面网格
    const gridHelper = new THREE.GridHelper(40, 20, 0x333333, 0x1a1a1a);
    gridHelper.position.y = -2;
    scene.add(gridHelper);
    
    // 坐标轴 (小型)
    const axesHelper = new THREE.AxesHelper(3);
    axesHelper.position.set(-15, -2, -15);
    scene.add(axesHelper);
    
    // 粒子发射体
    const projGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const projMat = new THREE.MeshBasicMaterial({ 
      color: 0x4ade80,
      transparent: true,
      opacity: 0.9
    });
    const projectile = new THREE.Mesh(projGeo, projMat);
    scene.add(projectile);
    projectileRef.current = projectile;
    
    // 路径线
    const lineMat = new THREE.LineBasicMaterial({ 
      color: 0x4ade80, 
      transparent: true, 
      opacity: 0.6,
      linewidth: 2
    });
    const lineGeo = new THREE.BufferGeometry();
    const pathLine = new THREE.Line(lineGeo, lineMat);
    scene.add(pathLine);
    pathLineRef.current = pathLine;
    
    // 箭头组
    const arrowsGroup = new THREE.Group();
    scene.add(arrowsGroup);
    arrowsRef.current = arrowsGroup;
    
    // 动画循环
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        animationTimeRef.current += 0.016;
        
        // 沿路径移动粒子
        if (pathPointsRef.current.length > 0 && projectileRef.current) {
          const totalPoints = pathPointsRef.current.length;
          const loopTime = 2.5;  // 2.5秒完成一个循环
          const t = (animationTimeRef.current % loopTime) / loopTime;
          const idx = Math.min(Math.floor(t * totalPoints), totalPoints - 1);
          
          const point = pathPointsRef.current[idx];
          projectileRef.current.position.copy(point);
          
          // 粒子在路径末尾渐隐
          const fadeStart = 0.8;
          if (t > fadeStart) {
            (projectileRef.current.material as THREE.MeshBasicMaterial).opacity = 
              1 - ((t - fadeStart) / (1 - fadeStart));
          } else {
            (projectileRef.current.material as THREE.MeshBasicMaterial).opacity = 0.9;
          }
        }
        
        // 缓慢旋转相机
        const camAngle = animationTimeRef.current * 0.15;
        cameraRef.current.position.x = Math.sin(camAngle) * 35;
        cameraRef.current.position.z = Math.cos(camAngle) * 35;
        cameraRef.current.lookAt(0, 8, 0);
        
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    animate();
    
    // Resize
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
  
  // 当轨迹类型或参数变化时，重新生成路径
  useEffect(() => {
    if (!sceneRef.current || !pathLineRef.current || !arrowsRef.current) return;
    
    // 清理旧箭头
    while (arrowsRef.current.children.length > 0) {
      arrowsRef.current.remove(arrowsRef.current.children[0]);
    }
    
    if (!trajectoryType) {
      pathPointsRef.current = [];
      pathLineRef.current.geometry.setFromPoints([]);
      if (projectileRef.current) projectileRef.current.visible = false;
      return;
    }
    
    if (projectileRef.current) projectileRef.current.visible = true;
    
    // 生成完整轨迹路径
    const points = generateTrajectoryPath(trajectoryType, speed, height, angle);
    pathPointsRef.current = points;
    
    // 更新路径线
    pathLineRef.current.geometry.setFromPoints(points);
    
    // 添加速度箭头 (每隔一定距离)
    const arrowInterval = Math.ceil(points.length / 8);
    for (let i = arrowInterval; i < points.length - 5; i += arrowInterval) {
      const point = points[i];
      const nextPoint = points[Math.min(i + 5, points.length - 1)];
      
      // 计算方向
      const direction = new THREE.Vector3()
        .subVectors(nextPoint, point)
        .normalize();
      
      // 计算速度大小 (用于箭头长度)
      const velocity = new THREE.Vector3().subVectors(nextPoint, point).length();
      const arrowLength = Math.min(velocity * 0.8, 3);
      
      // 创建箭头
      const arrow = createArrow(direction, arrowLength, i / points.length);
      arrow.position.copy(point);
      arrowsRef.current.add(arrow);
    }
    
    // 重置动画时间
    animationTimeRef.current = 0;
    
  }, [trajectoryType, speed, height, angle]);
  
  // 获取轨迹信息
  const info = trajectoryType ? TRAJECTORY_INFO[trajectoryType] : null;
  
  return (
    <div className={`relative w-full h-full overflow-hidden ${className}`}>
      {/* 3D Canvas */}
      <div ref={containerRef} className="absolute inset-0 z-0" />
      
      {/* 参数显示 */}
      {trajectoryType && (
        <div className="absolute top-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg p-2 text-right">
          <div className="text-[8px] text-white/50 font-mono">
            <div>Speed: {speed.toFixed(1)}</div>
            <div>Height: {(height/10).toFixed(0)}m</div>
            <div>Angle: {angle}°</div>
          </div>
        </div>
      )}
      
      {/* 底部信息 */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end pb-3 pointer-events-none z-10">
        {!trajectoryType ? (
          <div className="text-white/40 text-xs font-bold uppercase tracking-widest bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
            Select a Path
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <div className="flex items-center gap-2 animate-pulse">
              <span className="text-lg">{info?.icon}</span>
            </div>
            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.15em] drop-shadow-md bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
              {info?.name}
            </div>
            <div className="text-[8px] text-white/50 font-medium max-w-[180px] text-center">
              {info?.description}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============ 2D Canvas 预览 (用于下拉框侧边预览) ============
interface TrajectoryPreviewCanvasProps {
  trajectoryType: TrajectoryType | null;
  className?: string;
}

export const TrajectoryPreviewCanvas: React.FC<TrajectoryPreviewCanvasProps> = ({
  trajectoryType,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const width = canvas.width = 192;
    const height = canvas.height = 192;
    
    // 生成2D路径点
    const path2D = trajectoryType ? generate2DPath(trajectoryType) : [];
    
    const animate = () => {
      animationRef.current = requestAnimationFrame(animate);
      timeRef.current += 0.02;
      
      // 清空
      ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      ctx.fillRect(0, 0, width, height);
      
      if (path2D.length === 0) {
        // 无轨迹时显示提示
        ctx.fillStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Hover to Preview', width / 2, height / 2);
        return;
      }
      
      // 绘制路径
      ctx.strokeStyle = 'rgba(74, 222, 128, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      path2D.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
      
      // 绘制箭头
      const arrowInterval = Math.ceil(path2D.length / 6);
      ctx.fillStyle = 'rgba(74, 222, 128, 0.8)';
      for (let i = arrowInterval; i < path2D.length - 3; i += arrowInterval) {
        const p = path2D[i];
        const next = path2D[Math.min(i + 3, path2D.length - 1)];
        const angle = Math.atan2(next.y - p.y, next.x - p.x);
        drawArrow(ctx, p.x, p.y, angle, 6);
      }
      
      // 动画粒子
      const loopTime = 2.0;
      const t = (timeRef.current % loopTime) / loopTime;
      const idx = Math.floor(t * path2D.length);
      if (idx < path2D.length) {
        const pos = path2D[idx];
        
        // 发光效果
        const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 15);
        gradient.addColorStop(0, 'rgba(74, 222, 128, 1)');
        gradient.addColorStop(0.5, 'rgba(74, 222, 128, 0.3)');
        gradient.addColorStop(1, 'rgba(74, 222, 128, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心点
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // 起点标记
      if (path2D.length > 0) {
        ctx.strokeStyle = 'rgba(251, 146, 60, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const start = path2D[0];
        ctx.arc(start.x, start.y, 6, 0, Math.PI * 2);
        ctx.stroke();
      }
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [trajectoryType]);
  
  return (
    <canvas 
      ref={canvasRef} 
      className={`${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};

// ============ 辅助函数 ============

/**
 * 生成3D轨迹路径点 - 增强版，让不同轨迹类型的视觉差异更明显
 */
function generateTrajectoryPath(
  type: TrajectoryType,
  speed: number,
  height: number,
  angle: number
): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const calculator = TrajectoryFactory.create(type);
  
  // 初始条件
  const startPos = { x: 0, y: -2, z: 0 };
  const angleRad = (angle * Math.PI) / 180;
  let pos = new Vector3(startPos.x, startPos.y, startPos.z);
  let vel = new Vector3(
    Math.sin(angleRad) * speed * 0.3,  // 增加横向速度的影响
    speed * 1.2,  // 增加初始上升速度
    0
  );
  
  const maxTime = 4.0;  // 增加模拟时间
  const dt = 0.015;     // 更细致的步长
  const gravity = 0.04; // 大幅降低重力，让轨迹更完整
  
  // 放大因子：让轨迹在预览中更大
  const scaleFactor = 5;
  
  for (let t = 0; t < maxTime; t += dt) {
    // 记录点（放大坐标）
    points.push(new THREE.Vector3(
      pos.x * scaleFactor, 
      pos.y * scaleFactor, 
      pos.z * scaleFactor
    ));
    
    // 使用轨迹计算器更新速度
    vel = calculator.calculate(vel, gravity, dt);
    
    // 更新位置
    pos.x += vel.x * dt * 2;  // 增加位置变化的灵敏度
    pos.y += vel.y * dt * 2;
    pos.z += vel.z * dt * 2;
    
    // 检查是否到达目标高度或开始下落太快
    if (pos.y > height / 8 || vel.y < -5) break;
  }
  
  return points;
}

/**
 * 生成2D路径点 (用于Canvas预览) - 增强版
 */
function generate2DPath(type: TrajectoryType): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const calculator = TrajectoryFactory.create(type);
  
  // 2D坐标映射
  const width = 192;
  const height = 192;
  const startX = width / 2;
  const startY = height - 15;
  
  let posX = 0;
  let posY = 0;
  let vel = new Vector3(0, 25, 0);  // 增加初始速度
  
  const maxTime = 3.5;   // 增加模拟时间
  const dt = 0.02;
  const gravity = 0.05;  // 降低重力让轨迹更完整
  
  // 增大坐标缩放因子，让不同轨迹的差异更明显
  const scaleFactor = 8;
  
  for (let t = 0; t < maxTime; t += dt) {
    const screenX = startX + posX * scaleFactor;
    const screenY = startY - posY * scaleFactor;
    
    if (screenY > 5 && screenY < height - 5 && screenX > 5 && screenX < width - 5) {
      points.push({ x: screenX, y: screenY });
    }
    
    // 更新物理
    vel = calculator.calculate(vel, gravity, dt);
    posX += vel.x * dt * 1.5;
    posY += vel.y * dt * 1.5;
    
    if (screenY < 8 || vel.y < -6) break;
  }
  
  return points;
}

/**
 * 创建3D箭头
 */
function createArrow(direction: THREE.Vector3, length: number, progress: number): THREE.Group {
  const group = new THREE.Group();
  
  // 箭头颜色随进度变化
  const hue = 160 - progress * 60;  // 从青色到绿色
  const color = new THREE.Color(`hsl(${hue}, 80%, 60%)`);
  
  // 箭头头部 (锥形)
  const coneGeo = new THREE.ConeGeometry(0.3, 0.8, 8);
  const coneMat = new THREE.MeshBasicMaterial({ 
    color,
    transparent: true,
    opacity: 0.8
  });
  const cone = new THREE.Mesh(coneGeo, coneMat);
  
  // 对齐方向
  cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  
  group.add(cone);
  
  return group;
}

/**
 * 在Canvas上绘制箭头
 */
function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, size: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size * 0.5, -size * 0.5);
  ctx.lineTo(-size * 0.5, size * 0.5);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}
