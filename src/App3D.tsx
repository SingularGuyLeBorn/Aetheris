// FILE: src/App3D.tsx
// 主应用入口 - 整合新架构的粒子模拟器

import React, { useState, useRef } from 'react';
import { FireworkScene3D, FireworkScene3DHandle } from './components/FireworkScene3D';
import { ModernSettingsPanel } from './components/ui/ModernSettingsPanel';
import { TimeControlPanel } from './components/ui/TimeControlPanel';
import { HUD3D } from './components/ui/HUD3D';
import { TutorialOverlay, useTutorial } from './components/ui/TutorialOverlay';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  FireworkConfig,
  DEFAULT_CONFIG,
  ManualConfig,
  DEFAULT_MANUAL_CONFIG,
  LaunchFormation
} from './types';
import { TimeController } from './core/TimeController';

const App3D: React.FC = () => {
  const sceneRef = useRef<FireworkScene3DHandle>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [timeController, setTimeController] = useState<TimeController | null>(null);
  const [stats, setStats] = useState({ particles: 0, fireworks: 0, fps: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  // --- 状态管理 ---
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [config, setConfig] = useState<FireworkConfig>(DEFAULT_CONFIG);
  const [manualConfig, setManualConfig] = useState<ManualConfig>(DEFAULT_MANUAL_CONFIG);
  const [logs, setLogs] = useState<string[]>([]);
  const [isLogCollapsed, setIsLogCollapsed] = useState(true);
  
  // --- 教程系统 ---
  const { showTutorial, completeTutorial, resetTutorial } = useTutorial();

  // --- 逻辑处理 ---
  const updateSetting = (key: keyof AppSettings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleTimeScaleChange = (scale: number) => {
    const currentScene = sceneRef.current;
    if (currentScene) {
      const tc = currentScene.getTimeController();
      tc.timeScale = scale;
    }
  };

  const handleTogglePause = () => {
    const currentScene = sceneRef.current;
    if (currentScene) {
      currentScene.getTimeController().togglePause();
    }
  };

  const handleRandomize = () => {
    // 随机物理参数
    setSettings(prev => ({
      ...prev,
      gravity: 0.05 + Math.random() * 0.15,
      friction: 0.90 + Math.random() * 0.08,
      particleCountMultiplier: 0.5 + Math.random() * 1.5,
      explosionSizeMultiplier: 0.8 + Math.random() * 0.8,
    }));

    // 重置锁定样式为随机
    setManualConfig({
      lockedShape: 'RANDOM',
      lockedColor: 'RANDOM',
      lockedTrajectory: 'RANDOM',
      lockedCombo: 'RANDOM',
      lockedFormation: LaunchFormation.RANDOM,
      lockedCount: 1,
      lockedDuration: 0,
      lockedInterval: 100
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    setConfig(DEFAULT_CONFIG);
    setManualConfig(DEFAULT_MANUAL_CONFIG);
    setLogs([]);
  };

  const handleLaunchLog = (log: string) => {
    setLogs(prev => [log, ...prev].slice(0, 10));
  };

  const handleLaunchCarnival = () => {
    sceneRef.current?.launchCarnival();
  };

  return (
    <div className="relative w-screen h-screen bg-slate-50 overflow-hidden font-sans text-gray-800 select-none">
      {/* 全局样式 */}
      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #10b981;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(16, 185, 129, 0.3);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>

      {/* HUD 信息显示 */}
      <HUD3D />

      {/* 发射日志显示 (响应用户需求: 默认折叠，视觉精简) */}
      <div className="absolute bottom-10 left-6 z-50 pointer-events-none flex flex-col gap-2 max-w-sm">
        <div 
          className="pointer-events-auto flex items-center gap-2 mb-1 group cursor-pointer"
          onClick={() => setIsLogCollapsed(!isLogCollapsed)}
        >
          <div className={`px-2 py-1 rounded bg-black/20 backdrop-blur-sm text-[9px] font-bold text-white/50 transition-all ${isLogCollapsed ? 'opacity-100' : 'opacity-0'}`}>
            {logs.length} 条记录
          </div>
          <button className="w-6 h-6 rounded-full bg-slate-800/80 text-white/80 border border-white/10 flex items-center justify-center text-[10px] hover:bg-emerald-600 transition-all">
            {isLogCollapsed ? '＋' : '×'}
          </button>
        </div>

        {!isLogCollapsed && logs.slice(0, 5).map((log, i) => (
          <div 
            key={`${i}-${log}`} 
            className="
              px-4 py-2
              bg-white/90 backdrop-blur-xl
              border border-emerald-100/50 
              rounded-2xl shadow-lg
              text-[11px] font-black text-emerald-800
              animate-slideUp
            "
            style={{ 
              opacity: 1 - i * 0.18,
              transform: `scale(${1 - i * 0.05})`,
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)'
            }}
          >
            <span className="mr-2 text-emerald-500">◆</span>
            {log}
          </div>
        ))}
      </div>

      {/* 控制按钮区域 */}
      <div className="absolute top-6 right-6 z-20 flex flex-col gap-3 items-end">
        {/* 只保留创意工坊入口，嘉年华按钮移入内部 */}
        <button
          onClick={() => setShowSettings(true)}
          className="
            group flex items-center gap-3 px-5 py-3.5 
            bg-white/90 backdrop-blur-xl border border-white/20
            rounded-2xl shadow-xl hover:shadow-emerald-200/40 
            hover:-translate-y-0.5 active:scale-95 transition-all
          "
        >
          <div className="text-right">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Workshop</div>
            <div className="text-sm font-black text-gray-800 leading-none">创意工坊</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:rotate-12 transition-all">
            🎨
          </div>
        </button>
        
        {/* 工具按钮组 */}
        <div className="flex gap-2">
          {/* 教程按钮 */}
          <button
            onClick={resetTutorial}
            className="
              p-3.5 rounded-xl
              bg-white/90 backdrop-blur
              text-gray-600 hover:text-blue-600
              shadow-lg border border-gray-100
              transition-all
            "
            title="查看教程"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* 3D 烟花场景 */}
      <FireworkScene3D
        ref={sceneRef}
        settings={settings}
        config={config}
        manualConfig={manualConfig}
        autoRotate={autoRotate}
        onTimeUpdate={(tc) => setTimeController(tc)}
        onStatsUpdate={(st) => setStats(st)}
        onLaunch={handleLaunchLog}
      />

      {/* 时间控制面板 */}
      <TimeControlPanel
        timeController={timeController}
        stats={stats}
        onTimeScaleChange={handleTimeScaleChange}
        onTogglePause={handleTogglePause}
        autoRotate={autoRotate}
        onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
      />

      {/* 设置面板 & 点击外部关闭遮罩 */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-30 bg-black/5 backdrop-blur-[1px]"
          onClick={() => setShowSettings(false)}
        />
      )}

      <ModernSettingsPanel
        show={showSettings}
        settings={settings}
        config={config}
        manualConfig={manualConfig}
        onClose={() => setShowSettings(false)}
        onUpdate={updateSetting}
        onUpdateConfig={setConfig}
        onUpdateManual={setManualConfig}
        onRandomize={handleRandomize}
        onReset={handleReset}
        onLaunchCarnival={handleLaunchCarnival}
      />
      
      {/* 引导教程 */}
      {showTutorial && (
        <TutorialOverlay onComplete={completeTutorial} />
      )}

      {/* 底部品牌标识 */}
      <div className="absolute bottom-4 right-4 text-[10px] text-gray-300 font-medium">
        <span className="font-bold text-gray-400">AETHERIS</span>
        <span className="mx-2 opacity-50">/</span>
        UNIVERSAL PARTICLE ENGINE v2.0
      </div>
    </div>
  );
};

export default App3D;

// END OF FILE: src/App3D.tsx