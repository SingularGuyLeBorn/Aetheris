// FILE: src/components/ui/ShapePreviewCard.tsx
// 形状预览卡片组件 - 点击时在顶部显示3D预览

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Shape3DFactory, Shape3DType, SHAPE_3D_INFO } from '../../core/shapes/Shape3DFactory';

interface ShapePreviewCardProps {
  type: Shape3DType;
  active: boolean;
  onClick: () => void;
  onPreview?: (type: Shape3DType) => void;
}

/**
 * 形状预览卡片
 * 支持悬停预览和点击选中
 */
export const ShapePreviewCard: React.FC<ShapePreviewCardProps> = ({
  type,
  active,
  onClick,
  onPreview
}) => {
  const info = SHAPE_3D_INFO[type];
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onPreview?.(type)}
      className={`
        group relative p-3 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden
        ${active 
          ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-lg scale-[1.02]' 
          : 'border-gray-100 bg-white/80 hover:border-emerald-200 hover:shadow-md'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {/* 图标 */}
        <div className={`
          w-10 h-10 rounded-xl flex items-center justify-center text-xl
          transition-all
          ${active ? 'bg-white shadow-sm' : 'bg-gray-50 group-hover:bg-emerald-50'}
        `}>
          {info.icon}
        </div>
        
        {/* 文字 */}
        <div className="flex flex-col flex-1 min-w-0">
          <span className={`
            text-[11px] font-bold truncate
            ${active ? 'text-emerald-700' : 'text-gray-700'}
          `}>
            {info.name}
          </span>
          <span className={`
            text-[9px] truncate
            ${active ? 'text-emerald-500' : 'text-gray-400'}
          `}>
            {info.category}
          </span>
        </div>
        
        {/* 选中标记 */}
        {active && (
          <div className="w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
      
      {/* 悬停提示 */}
      <div className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5
        bg-gray-900 text-white text-[10px] rounded-lg
        opacity-0 group-hover:opacity-100 transition-opacity
        pointer-events-none whitespace-nowrap z-50
      ">
        {info.description}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
};

/**
 * 3D 实时预览窗口
 */
interface ShapePreview3DProps {
  shapeType: Shape3DType | null;
  className?: string;
}

export const ShapePreview3D: React.FC<ShapePreview3DProps> = ({
  shapeType,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsRef = useRef<THREE.Points | null>(null);
  const frameRef = useRef<number>(0);
  
  // 初始化场景
  useEffect(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    // 场景
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8fafc);
    sceneRef.current = scene;
    
    // 相机
    const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
    camera.position.set(0, 0, 100);
    cameraRef.current = camera;
    
    // 渲染器
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // 粒子系统
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000 * 3);
    const colors = new Float32Array(3000 * 3);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const points = new THREE.Points(geometry, material);
    scene.add(points);
    pointsRef.current = points;
    
    // 动画
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      
      if (pointsRef.current) {
        pointsRef.current.rotation.y += 0.01;
        pointsRef.current.rotation.x += 0.003;
      }
      
      renderer.render(scene, camera);
    };
    animate();
    
    // 清理
    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      container.removeChild(renderer.domElement);
    };
  }, []);
  
  // 更新形状
  useEffect(() => {
    if (!pointsRef.current || !shapeType) return;
    
    // 生成点数据 (Float32Array)
    // 缩放比例设为 0.5 以适应小窗口
    const shape3DPoints = Shape3DFactory.generate(shapeType, 1000, 0.5);
    const geometry = pointsRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = geometry.attributes.color.array as Float32Array;
    
    // 获取形状基础颜色
    const hexColor = Shape3DFactory.getShapeColor(shapeType);
    const baseColor = new THREE.Color(hexColor);
    const baseHSL = { h: 0, s: 0, l: 0 };
    baseColor.getHSL(baseHSL);

    // 清空
    positions.fill(0);
    colors.fill(0);
    
    // 填充新点
    const pointCount = Math.floor(shape3DPoints.length / 3);
    const displayCount = Math.min(pointCount, 3000); // 限制显示数量
    
    for (let i = 0; i < displayCount; i++) {
      const idx = i * 3;
      
      positions[idx] = shape3DPoints[idx];
      positions[idx + 1] = shape3DPoints[idx + 1];
      positions[idx + 2] = shape3DPoints[idx + 2];
      
      // 颜色微调：让颜色有点变化，不至于太平板
      // 基于索引的轻微色相偏移和亮度变化
      const hueVar = baseHSL.h + (Math.random() - 0.5) * 0.05; 
      const lightVar = baseHSL.l + (Math.random() - 0.5) * 0.2;
      
      const pColor = new THREE.Color().setHSL(hueVar, baseHSL.s, Math.max(0, Math.min(1, lightVar)));
      
      colors[idx] = pColor.r;
      colors[idx + 1] = pColor.g;
      colors[idx + 2] = pColor.b;
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    
    // 自动清理
    geometry.setDrawRange(0, displayCount);
    
  }, [shapeType]);
  
  const info = shapeType ? SHAPE_3D_INFO[shapeType] : null;
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full" />
      
      {/* 信息覆盖 */}
      {info && (
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-white/90 to-transparent">
          <div className="flex items-center gap-2">
            <span className="text-xl">{info.icon}</span>
            <div>
              <div className="text-sm font-bold text-gray-800">{info.name}</div>
              <div className="text-[10px] text-gray-500">{info.description}</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 空状态 */}
      {!shapeType && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-300">
          <div className="text-center">
            <div className="text-3xl mb-2">✨</div>
            <div className="text-xs font-medium">悬停形状卡片以预览</div>
          </div>
        </div>
      )}
    </div>
  );
};

// HSL to RGB 转换
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  let r: number, g: number, b: number;
  
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  
  return { r, g, b };
}

// END OF FILE: src/components/ui/ShapePreviewCard.tsx
