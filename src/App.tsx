/**
 * App.tsx - 主应用入口
 * 
 * 使用 Stream Architecture ("一切皆流") 烟花引擎
 * 配合暗色系五阶段生命周期配置器
 */

import React, { useState, useRef, useCallback } from 'react';
import { StreamFireworkScene, StreamFireworkSceneHandle } from './components/StreamFireworkScene';
import { LifecycleConfigPanel } from './components/ui/LifecycleConfigPanel';
import {
  FireworkLifecycleConfig,
  DEFAULT_LIFECYCLE_CONFIG,
  LIFECYCLE_PRESETS,
} from './types/lifecycle';

// ============================================================================
// 主组件
// ============================================================================

const App: React.FC = () => {
  const sceneRef = useRef<StreamFireworkSceneHandle>(null);
  
  // 生命周期配置状态
  const [lifecycleConfig, setLifecycleConfig] = useState<FireworkLifecycleConfig>(
    DEFAULT_LIFECYCLE_CONFIG
  );

  // 统计信息状态
  const [stats, setStats] = useState({
    particles: 0,
    fireworks: 0,
    fps: 60,
  });

  // 控制状态
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoRotate, setIsAutoRotate] = useState(true);

  // 发射预览
  const handleLaunch = useCallback(() => {
    sceneRef.current?.launch();
  }, []);

  // 发射嘉年华
  const handleLaunchCarnival = useCallback(() => {
    sceneRef.current?.launchCarnival();
  }, []);

  // 暂停切换
  const handlePauseToggle = useCallback(() => {
    setIsPaused(prev => {
      sceneRef.current?.togglePause?.();
      return !prev;
    });
  }, []);

  // 旋转切换
  const handleRotateToggle = useCallback(() => {
    setIsAutoRotate(prev => {
      sceneRef.current?.toggleAutoRotate?.();
      return !prev;
    });
  }, []);

  return (
    <div className="relative w-screen h-screen bg-slate-950 overflow-hidden font-sans">
      {/* 3D 烟花场景 */}
      <StreamFireworkScene
        ref={sceneRef}
        lifecycleConfig={lifecycleConfig}
        onStatsUpdate={setStats}
        isPaused={isPaused}
        isAutoRotate={isAutoRotate}
      />

      {/* 顶部标题栏 */}
      <header className="absolute top-0 left-0 right-0 z-40 pointer-events-none">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="pointer-events-auto">
            <h1 className="text-xl font-black text-white tracking-tight">
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 bg-clip-text text-transparent">
                Aetheris
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">Stream Architecture Engine</p>
          </div>

          {/* 嘉年华按钮 */}
          <button
            onClick={handleLaunchCarnival}
            className="
              pointer-events-auto
              group relative px-6 py-3
              bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500
              rounded-xl font-bold text-xs text-white tracking-wider
              hover:scale-105 active:scale-95
              transition-all duration-200
              shadow-lg shadow-orange-500/30
              border border-white/10
              overflow-hidden
            "
          >
            <span className="relative z-10 flex items-center gap-2">
              <span className="text-base">🎆</span>
              嘉年华
            </span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
          </button>
        </div>
      </header>

      {/* 左侧预设快捷切换 */}
      <div className="absolute top-20 left-6 z-30 flex flex-col gap-1.5">
        {LIFECYCLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => setLifecycleConfig(preset)}
            className={`
              px-3 py-1.5 rounded-lg text-[11px] font-medium
              backdrop-blur-md border transition-all duration-200
              ${lifecycleConfig.id === preset.id
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 shadow-lg shadow-cyan-500/10'
                : 'bg-slate-900/50 border-slate-700/30 text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
              }
            `}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* 右上角快捷键提示 */}
      <div className="absolute top-20 right-6 z-30 space-y-1.5 text-right">
        <div className="text-[10px] text-slate-600">
          <span className="inline-block px-1.5 py-0.5 bg-slate-800/50 rounded text-slate-500 font-mono mr-1.5 text-[9px]">点击</span>
          发射烟花
        </div>
        <div className="text-[10px] text-slate-600">
          <span className="inline-block px-1.5 py-0.5 bg-slate-800/50 rounded text-slate-500 font-mono mr-1.5 text-[9px]">拖拽</span>
          旋转视角
        </div>
        <div className="text-[10px] text-slate-600">
          <span className="inline-block px-1.5 py-0.5 bg-slate-800/50 rounded text-slate-500 font-mono mr-1.5 text-[9px]">滚轮</span>
          缩放视图
        </div>
      </div>

      {/* 暂停指示器 */}
      {isPaused && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none">
          <div className="px-6 py-3 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl">
            <span className="text-lg font-bold text-slate-300">⏸️ 已暂停</span>
          </div>
        </div>
      )}

      {/* 底部生命周期配置面板 */}
      <LifecycleConfigPanel
        config={lifecycleConfig}
        onConfigChange={setLifecycleConfig}
        onLaunch={handleLaunch}
        onPauseToggle={handlePauseToggle}
        onRotateToggle={handleRotateToggle}
        isPaused={isPaused}
        isAutoRotate={isAutoRotate}
        stats={stats}
      />

      {/* 全局样式 */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        ::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.3);
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.5);
        }

        .select-none {
          user-select: none;
          -webkit-user-select: none;
        }
      `}</style>
    </div>
  );
};

export default App;
