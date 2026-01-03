// FILE: src/components/ui/DirectionIndicator.tsx
// 主画面方向指示器 - 显示 XYZ 坐标轴方向
// 包含一个向上的箭头指示 +Z 方向

import React from 'react';

interface DirectionIndicatorProps {
  className?: string;
}

/**
 * 3D 方向指示器
 * 显示在主画面底部，指示当前的坐标系方向
 */
export const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({
  className = ''
}) => {
  return (
    <div className={`fixed left-8 bottom-72 z-20 pointer-events-none ${className}`}>
      {/* 3D 悬浮指示器容器 */}
      <div className="relative group">
        
        {/* ========= 核心：向上的指引箭头 ========= */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center animate-bounce-slow">
            <div className="relative">
                {/* 箭头主体 - 霓虹发光 */}
                <svg width="40" height="60" viewBox="0 0 40 60" className="drop-shadow-[0_0_15px_rgba(16,185,129,0.8)]">
                    <defs>
                        <linearGradient id="neonGradient" x1="0%" y1="100%" x2="0%" y2="0%">
                           <stop offset="0%" stopColor="#059669" stopOpacity="0" />
                           <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                           <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                        </linearGradient>
                    </defs>
                    <path d="M20 0 L35 25 L24 25 L24 60 L16 60 L16 25 L5 25 Z" fill="url(#neonGradient)" />
                </svg>
                {/* 顶端光点 */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-400 rounded-full blur-xl opacity-60"></div>
            </div>
            <div className="mt-1 text-[10px] font-black tracking-[0.2em] text-emerald-400 uppercase drop-shadow-md">UP</div>
        </div>

        {/* ========= 坐标轴 Gizmo ========= */}
        <div className="w-24 h-24 relative perspective-500">
            {/* 玻璃态背景圆盘 */}
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/80 to-slate-800/80 rounded-full border border-white/10 backdrop-blur-md shadow-2xl"></div>
            <div className="absolute inset-2 border border-dashed border-white/5 rounded-full animate-spin-slow-reverse"></div>
            
            {/* 坐标轴 SVG */}
            <svg viewBox="0 0 100 100" className="w-full h-full p-4 overflow-visible">
                {/* Y Axis (Up) */}
                <line x1="50" y1="50" x2="50" y2="10" stroke="#10b981" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                <text x="54" y="15" fill="#10b981" fontSize="10" fontWeight="900">Y+</text>

                {/* X Axis (Right) */}
                <line x1="50" y1="50" x2="90" y2="50" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" />
                <text x="92" y="54" fill="#f43f5e" fontSize="10" fontWeight="900">X+</text>

                {/* Z Axis (Forward - Projected) */}
                <line x1="50" y1="50" x2="20" y2="85" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" className="drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
                <text x="10" y="90" fill="#3b82f6" fontSize="10" fontWeight="900">Z+</text>

                {/* Center Point */}
                <circle cx="50" cy="50" r="4" fill="white" className="drop-shadow-[0_0_5px_rgba(255,255,255,1)]" />
            </svg>
        </div>
      </div>
      
      {/* 底部文字信息 */}
      <div className="mt-2 text-center">
        <div className="text-[9px] font-bold text-slate-400/80 tracking-widest uppercase">System Ready</div>
      </div>

      <style>{`
        .perspective-500 { perspective: 500px; }
        .animate-spin-slow-reverse { animation: spin 10s linear infinite reverse; }
        .animate-bounce-slow { animation: bounceSlow 3s infinite ease-in-out; }
        @keyframes bounceSlow {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -10px); }
        }
      `}</style>
    </div>
  );
};

/**
 * 简化版：仅显示坐标轴标识 (备用)
 */
export const AxisIndicator: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`fixed left-6 bottom-6 z-20 pointer-events-none ${className}`}>
     {/* 简单的指示器内容，保持原样或略微优化 */}
     <div className="w-12 h-12 bg-white/10 rounded-full border border-white/20"></div>
  </div>
);
