// FILE: src/components/ui/TimeControlPanel.tsx

import React from 'react';
import { TimeController } from '../../core/TimeController';

interface TimeControlPanelProps {
  timeController: TimeController | null;
  stats: {
    particles: number;
    fireworks: number;
    fps: number;
  };
  onTimeScaleChange: (scale: number) => void;
  onTogglePause: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

export const TimeControlPanel: React.FC<TimeControlPanelProps> = ({
                                                                    timeController,
                                                                    stats,
                                                                    onTimeScaleChange,
                                                                    onTogglePause,
                                                                    autoRotate,
                                                                    onToggleAutoRotate
                                                                  }) => {
  const timeScale = timeController?.timeScale ?? 1;
  const isPaused = timeController?.isPaused ?? false;

  return (
      <div className="absolute bottom-8 left-8 z-30 flex flex-col gap-3">
        {/* 现代化浅色卡片 */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-xl border border-white/50 w-64 transition-all hover:shadow-2xl hover:scale-[1.02]">

          {/* 标题栏 */}
          <div className="flex justify-between items-center mb-4">
          <span className="text-gray-800 text-xs font-bold tracking-wider flex items-center gap-2">
             <span className="text-lg">⚙️</span> ENGINE
          </span>
            <div className="flex gap-2 items-center bg-gray-100 px-2 py-1 rounded-lg">
              <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-amber-400 animate-pulse' : 'bg-green-500'}`}></div>
              <span className="text-[10px] font-mono text-gray-500 font-bold">{stats.fps} FPS</span>
            </div>
          </div>

          {/* 控制按钮网格 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <button
                onClick={onTogglePause}
                className={`py-2.5 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 border ${
                    isPaused
                        ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              {isPaused ? '▶ RESUME' : '⏸ PAUSE'}
            </button>

            <button
                onClick={onToggleAutoRotate}
                className={`py-2.5 rounded-xl font-bold text-[10px] transition-all flex items-center justify-center gap-1.5 border ${
                    autoRotate
                        ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50 hover:text-gray-600'
                }`}
            >
              {autoRotate ? '↺ ROTATING' : '⊘ STATIC'}
            </button>
          </div>

          {/* 速度滑块 */}
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
            <div className="flex justify-between text-[10px] text-gray-400 mb-2 font-bold uppercase">
              <span>Time Scale</span>
              <span className="text-gray-800">{timeScale.toFixed(1)}x</span>
            </div>
            <input
                type="range"
                min="0.1"
                max="3"
                step="0.1"
                value={timeScale}
                onChange={(e) => onTimeScaleChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-gray-700 hover:accent-blue-600 transition-all"
            />
            <div className="flex justify-between mt-1 text-[8px] text-gray-300 font-mono">
              <span>SLOW</span>
              <span>FAST</span>
            </div>
          </div>

          {/* 底部统计信息 */}
          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-[9px] text-gray-400 font-mono">
            <div>
              <span className="block text-gray-300 uppercase text-[8px]">Particles</span>
              <span className="font-bold text-gray-600">{(stats.particles/1000).toFixed(1)}k</span>
            </div>
            <div className="text-right">
              <span className="block text-gray-300 uppercase text-[8px]">Fireworks</span>
              <span className="font-bold text-gray-600">{stats.fireworks}</span>
            </div>
          </div>
        </div>
      </div>
  );
};

// END OF FILE: src/components/ui/TimeControlPanel.tsx