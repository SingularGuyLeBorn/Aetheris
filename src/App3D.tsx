// FILE: src/App3D.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FireworkScene3D, FireworkScene3DHandle } from './components/FireworkScene3D';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { TimeControlPanel } from './components/ui/TimeControlPanel';
import { HUD3D } from './components/ui/HUD3D';
import { AppSettings, DEFAULT_SETTINGS } from './types';
import { TimeController } from './core/TimeController';

const STORAGE_KEY = 'celestial_fireworks_v5_settings';

const App3D: React.FC = () => {
  const sceneRef = useRef<FireworkScene3DHandle>(null);
  const [showSettings, setShowSettings] = useState(false);

  // 状态管理
  const [timeController, setTimeController] = useState<TimeController | null>(null);
  const [stats, setStats] = useState({ particles: 0, fireworks: 0, fps: 0 });
  const [autoRotate, setAutoRotate] = useState(true);

  // 设置管理
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && 'gravity' in parsed) {
          return { ...DEFAULT_SETTINGS, ...parsed };
        }
      }
    } catch (e) {
      console.error('Failed to load settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const randomizeSettings = () => {
    setSettings({
      gravity: Number((Math.random() * 0.12 + 0.04).toFixed(3)),
      friction: Number((0.92 + Math.random() * 0.07).toFixed(3)),
      autoLaunchDelay: Math.floor(1000 + Math.random() * 4000),
      particleCountMultiplier: Number((0.6 + Math.random() * 1.0).toFixed(2)),
      explosionSizeMultiplier: Number((0.8 + Math.random() * 1.2).toFixed(2)),
      starBlinkSpeed: Number((0.0003 + Math.random() * 0.002).toFixed(5)),
      trailLength: Math.floor(5 + Math.random() * 20)
    });
  };

  const handleTimeUpdate = useCallback((tc: TimeController) => {
    setTimeController(tc);
  }, []);

  const handleStatsUpdate = useCallback((newStats: { particles: number; fireworks: number; fps: number }) => {
    setStats(newStats);
  }, []);

  const handleTimeScaleChange = (scale: number) => {
    const tc = sceneRef.current?.getTimeController();
    if (tc) tc.timeScale = scale;
  };

  const handleTogglePause = () => {
    const tc = sceneRef.current?.getTimeController();
    if (tc) tc.togglePause();
  };

  return (
      <div className="relative w-screen h-screen bg-gray-50 overflow-hidden font-sans text-gray-800 select-none">
        <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none;
          width: 14px; height: 14px;
          border-radius: 50%;
          background: #4B5563;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
      `}</style>

        {/* 抬头显示层 */}
        <HUD3D />

        {/* 右上角主控按钮 */}
        <div className="absolute top-8 right-8 z-20 flex flex-col gap-4 items-end">
          <button
              onClick={() => sceneRef.current?.launchCarnival()}
              className="group relative px-6 py-3 bg-white/80 backdrop-blur-md rounded-xl font-bold text-xs tracking-[0.15em] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-gray-200 border border-white/50 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <span className="relative z-10 flex items-center gap-2 text-gray-800 group-hover:text-purple-700">
            <span>🎉</span> GRAND CARNIVAL
          </span>
          </button>
          <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-white/80 hover:bg-white rounded-xl shadow-lg border border-white/50 transition-all text-gray-500 hover:text-blue-600 active:scale-95"
              title="Settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* 3D 场景层 */}
        <FireworkScene3D
            ref={sceneRef}
            settings={settings}
            autoRotate={autoRotate}
            onTimeUpdate={handleTimeUpdate}
            onStatsUpdate={handleStatsUpdate}
        />

        {/* 底部控制面板 */}
        <TimeControlPanel
            timeController={timeController}
            stats={stats}
            onTimeScaleChange={handleTimeScaleChange}
            onTogglePause={handleTogglePause}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
        />

        {/* 设置侧边栏 */}
        <SettingsPanel
            show={showSettings}
            settings={settings}
            onClose={() => setShowSettings(false)}
            onUpdate={updateSetting}
            onRandomize={randomizeSettings}
            onReset={() => setSettings(DEFAULT_SETTINGS)}
        />
      </div>
  );
};

export default App3D;

// END OF FILE: src/App3D.tsx