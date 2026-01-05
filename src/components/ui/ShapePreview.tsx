/**
 * ShapePreview.tsx - 微型 3D 形状预览器
 * 
 * 用于在鼠标悬停时，实时渲染该形状的动态 3D 粒子预览
 */

import React, { useEffect, useRef, memo } from 'react';

// 简化的形状生成器（独立于主引擎，避免导入问题）
import { Shape3DGenerator, Shape3DType } from '../../core/shapes/Shape3DFactory';

// 使用核心引擎生成形状点，确保预览与实际效果一致
function generateShapePoints(shapeType: string, count: number = 200): Array<{x: number, y: number, z: number}> {
  const points: Array<{x: number, y: number, z: number}> = [];
  
  // --- A. 真正的 3D 形状处理 ---
  if (Object.values(Shape3DType).includes(shapeType as Shape3DType)) {
    const rawPoints = Shape3DGenerator.generate(shapeType as Shape3DType, 400, 1.0); // 增加预览点数
    for (let i = 0; i < rawPoints.length; i += 3) {
      points.push({ x: rawPoints[i], y: rawPoints[i+1], z: rawPoints[i+2] });
    }
    return points;
  }

  // --- B. 语义化预览映射 (用于非形状阶段) ---
  // 根据不同的效果名称生成代表性的 3D 点阵图案，提升美观度
  switch(shapeType) {
    // 1. 上升/轨迹类 - 表现为竖直向上的特征
    case 'simple_trail':
    case 'comet_tail':
    case 'rocket_thrust':
    case 'fast_beam':
      for(let i=0; i<count; i++) {
        const r = Math.random() * 2;
        points.push({ x: (Math.random()-0.5)*r, y: (i/count - 0.5) * 60, z: (Math.random()-0.5)*r });
      }
      break;
    case 'dna_helix':
    case 'sine_wave':
    case 'gentle_snake':
    case 'tight_spiral':
    case 'double_helix':
      for(let i=0; i<count; i++) {
        const t = i/count * Math.PI * 6;
        const r = 8;
        points.push({ x: Math.sin(t)*r, y: (i/count-0.5)*60, z: Math.cos(t)*r });
      }
      break;

    // 2. 动作/表演类 - 表现为旋转或膨胀的特征
    case 'rotate':
    case 'orbit':
    case 'swirl':
    case 'tornado_spin':
      for(let i=0; i<count; i++) {
        const t = i/count * Math.PI * 2;
        const r = 30 + Math.sin(t*3)*5;
        points.push({ x: Math.sin(t)*r, y: (Math.random()-0.5)*10, z: Math.cos(t)*r });
      }
      break;
    case 'expand':
    case 'explode':
    case 'shockwave':
      for(let i=0; i<count; i++) {
        const r = 30;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        points.push({ 
          x: r * Math.sin(theta) * Math.cos(phi), 
          y: r * Math.sin(theta) * Math.sin(phi), 
          z: r * Math.cos(theta) 
        });
      }
      break;

    // 3. 悬停/中继类 - 表现为凝聚或漂浮的特征
    case 'anchor':
    case 'freeze':
    case 'levitate':
      for(let i=0; i<count; i++) {
        const r = 15;
        const phi = Math.random() * Math.PI * 2;
        const theta = Math.acos(2 * Math.random() - 1);
        const dist = Math.pow(Math.random(), 0.5) * r;
        points.push({ 
          x: dist * Math.sin(theta) * Math.cos(phi), 
          y: dist * Math.sin(theta) * Math.sin(phi), 
          z: dist * Math.cos(theta) 
        });
      }
      break;

    // 4. 消亡/余烬类 - 表现为下沉或破碎的特征
    case 'ash_drift':
    case 'snow_settle':
    case 'rain_fall':
    case 'none': // 默认背景或空状态
      for(let i=0; i<count; i++) {
        points.push({ x: (Math.random()-0.5)*60, y: -20 + Math.random()*5, z: (Math.random()-0.5)*60 });
        if(i < count/2) points.push({ x: (Math.random()-0.5)*60, y: 20 - Math.random()*5, z: (Math.random()-0.5)*60 });
      }
      break;

    default:
      // 通用立方体点阵预览
      for (let i = 0; i < 5; i++) {
        for (let j = 0; j < 5; j++) {
          for (let k = 0; k < 5; k++) {
            points.push({ x: (i-2)*10, y: (j-2)*10, z: (k-2)*10 });
          }
        }
      }
  }
  
  return points;
}


interface ShapePreviewProps {
  shapeType: string;
  color: string;
  size?: number;
}

export const ShapePreview: React.FC<ShapePreviewProps> = memo(({ 
  shapeType, 
  color, 
  size = 100 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  const angleRef = useRef<number>(0);
  const pointsRef = useRef<Array<{x: number, y: number, z: number}>>([]);

  useEffect(() => {
    // 生成形状点
    pointsRef.current = generateShapePoints(shapeType, 200);
  }, [shapeType]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const animate = () => {
      ctx.clearRect(0, 0, size, size);
      
      const cx = size / 2;
      const cy = size / 2;
      
      angleRef.current += 0.03;
      const cos = Math.cos(angleRef.current);
      const sin = Math.sin(angleRef.current);

      // 1. 先找到当前点集的最大范围，用于自动缩放使其撑满预览框
      let maxRange = 0.1;
      pointsRef.current.forEach(p => {
        const d = Math.max(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
        if (d > maxRange) maxRange = d;
      });

      // 2. 计算缩放因子：希望 90% 的画布被占满
      const autoScale = (size * 0.4) / maxRange;

      // 排序以实现深度效果
      const sortedPoints = [...pointsRef.current].sort((a, b) => {
        const za = a.x * sin + a.z * cos;
        const zb = b.x * sin + b.z * cos;
        return za - zb;
      });

      sortedPoints.forEach(p => {
        const x = p.x * cos - p.z * sin;
        const z = p.x * sin + p.z * cos;
        const y = p.y;

        // 透视投影
        const perspective = 200 / (200 + z);
        const screenX = cx + x * autoScale * perspective;
        const screenY = cy - y * autoScale * perspective; // 注意Y轴翻转
        const pointSize = Math.max(2, 4.0 * perspective); // 增大粒子，使其看清

        const alpha = 0.6 + (z / maxRange) * 0.4; // 提高基础不透明度
        ctx.globalAlpha = Math.max(0.4, Math.min(1, alpha)); // 最低 0.4 透明度
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, pointSize, 0, Math.PI * 2);
        ctx.fill();
      });


      requestRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [shapeType, color, size]);

  return (
    <canvas 
      ref={canvasRef} 
      width={size} 
      height={size}
      style={{ width: size, height: size }}
    />
  );
});

ShapePreview.displayName = 'ShapePreview';
export default ShapePreview;
