// FILE: src/components/ui/FireworkInfoPanel.tsx
// 信息面板：显示当前烟花的形状和轨迹类型
// 当用户放慢速度时可以清楚地看到每个烟花的详细信息

import React from 'react';
import { Shape3DType, SHAPE_3D_INFO } from '../../core/shapes/Shape3DFactory';
import { TrajectoryType, TRAJECTORY_INFO } from '../../core/trajectories/TrajectoryFactory';

export interface FireworkInfo {
  id: string;
  shape: Shape3DType;
  trajectory: TrajectoryType;
  position: { x: number; y: number; z: number };
  velocity: number;
  particleCount: number;
  progress: number;  // 0-1, 生命进度
}

interface FireworkInfoPanelProps {
  fireworks: FireworkInfo[];
  timeScale: number;  // 当前时间缩放
  show: boolean;
}

/**
 * 烟花信息面板
 * 当时间放慢时显示每个烟花的详细信息
 */
export const FireworkInfoPanel: React.FC<FireworkInfoPanelProps> = ({
  fireworks,
  timeScale,
  show
}) => {
  // 只在慢速时显示（timeScale < 0.5）
  const shouldShow = show && timeScale < 0.5 && fireworks.length > 0;
  
  if (!shouldShow) return null;
  
  return (
    <div className="absolute left-8 top-1/2 -translate-y-1/2 z-20 pointer-events-none">
      <div className="bg-black/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
        {/* 标题 */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
          <span className="text-[9px] font-black text-cyan-400 uppercase tracking-wider">
            Slow Motion Analysis
          </span>
        </div>
        
        {/* 时间缩放指示器 */}
        <div className="mb-3 p-2 bg-white/5 rounded-lg">
          <div className="text-[8px] text-white/50 uppercase tracking-wider">Time Scale</div>
          <div className="text-lg font-black text-white">{(timeScale * 100).toFixed(0)}%</div>
        </div>
        
        {/* 烟花列表 */}
        <div className="space-y-2">
          {fireworks.slice(0, 5).map((fw, i) => (
            <div 
              key={fw.id}
              className="p-3 bg-white/5 rounded-xl border border-white/5 hover:border-white/20 transition-colors"
            >
              {/* 形状信息 */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{SHAPE_3D_INFO[fw.shape]?.icon || '✨'}</span>
                <div>
                  <div className="text-xs font-bold text-white">
                    {SHAPE_3D_INFO[fw.shape]?.name || fw.shape}
                  </div>
                  <div className="text-[8px] text-white/40">SHAPE</div>
                </div>
              </div>
              
              {/* 轨迹信息 */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{TRAJECTORY_INFO[fw.trajectory]?.icon || '🚀'}</span>
                <div>
                  <div className="text-xs font-bold text-emerald-400">
                    {TRAJECTORY_INFO[fw.trajectory]?.name || fw.trajectory}
                  </div>
                  <div className="text-[8px] text-white/40">TRAJECTORY</div>
                </div>
              </div>
              
              {/* 实时数据 */}
              <div className="grid grid-cols-2 gap-2 text-[8px] font-mono text-white/50">
                <div>
                  <span className="text-white/30">POS: </span>
                  <span className="text-cyan-300">
                    {fw.position.x.toFixed(0)}, {fw.position.y.toFixed(0)}
                  </span>
                </div>
                <div>
                  <span className="text-white/30">VEL: </span>
                  <span className="text-orange-300">{fw.velocity.toFixed(1)} m/s</span>
                </div>
                <div className="col-span-2">
                  <span className="text-white/30">PARTICLES: </span>
                  <span className="text-purple-300">{fw.particleCount}</span>
                </div>
              </div>
              
              {/* 进度条 */}
              <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                  style={{ width: `${fw.progress * 100}%` }}
                />
              </div>
            </div>
          ))}
          
          {fireworks.length > 5 && (
            <div className="text-center text-[9px] text-white/30 py-2">
              +{fireworks.length - 5} more fireworks...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 简化版：单个烟花标签（用于跟踪显示）
 */
export const FireworkLabel: React.FC<{
  shape: Shape3DType;
  trajectory: TrajectoryType;
  position: { x: number; y: number };
}> = ({ shape, trajectory, position }) => {
  return (
    <div 
      className="absolute pointer-events-none z-30"
      style={{ 
        left: position.x, 
        top: position.y,
        transform: 'translate(-50%, -100%) translateY(-10px)'
      }}
    >
      <div className="bg-black/80 backdrop-blur-sm rounded-lg px-2 py-1 border border-white/20 whitespace-nowrap">
        <div className="text-[10px] font-bold text-white flex items-center gap-1">
          <span>{SHAPE_3D_INFO[shape]?.icon}</span>
          <span>{SHAPE_3D_INFO[shape]?.name}</span>
        </div>
        <div className="text-[8px] text-emerald-400 flex items-center gap-1">
          <span>{TRAJECTORY_INFO[trajectory]?.icon}</span>
          <span>{TRAJECTORY_INFO[trajectory]?.name}</span>
        </div>
      </div>
    </div>
  );
};
