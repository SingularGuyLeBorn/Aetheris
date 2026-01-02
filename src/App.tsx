
import React, { useState, useEffect, useRef } from 'react';
import { FireworkCanvas, FireworkCanvasHandle } from './components/FireworkCanvas';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { HUD } from './components/ui/HUD';
import { 
  AppSettings, 
  DEFAULT_SETTINGS, 
  FireworkConfig, 
  DEFAULT_CONFIG, 
  ManualConfig, 
  DEFAULT_MANUAL_CONFIG 
} from './types';

const STORAGE_KEY = 'celestial_fireworks_v4_settings';

const App: React.FC = () => {
  const canvasRef = useRef<FireworkCanvasHandle>(null);
  const [showSettings, setShowSettings] = useState(false);
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
      console.error('Failed to load settings from localStorage', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [config, setConfig] = useState<FireworkConfig>(DEFAULT_CONFIG);
  const [manualConfig, setManualConfig] = useState<ManualConfig>(DEFAULT_MANUAL_CONFIG);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key: keyof AppSettings, value: number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const randomizeSettings = () => {
    setSettings(prev => ({
      ...prev,
      gravity: Number((Math.random() * 0.12 + 0.04).toFixed(3)),
      friction: Number((0.92 + Math.random() * 0.07).toFixed(3)),
      autoLaunchDelay: Math.floor(1000 + Math.random() * 6000),
      particleCountMultiplier: Number((0.6 + Math.random() * 1.6).toFixed(2)),
      explosionSizeMultiplier: Number((0.6 + Math.random() * 1.6).toFixed(2)),
      starBlinkSpeed: Number((0.0003 + Math.random() * 0.002).toFixed(5)),
      trailLength: Math.floor(5 + Math.random() * 30)
    }));
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden font-sans text-white select-none">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(6, 182, 212, 0.5); }
      `}</style>

      <HUD />

      {/* 主控按钮 */}
      <div className="absolute top-10 right-10 z-20 flex flex-col gap-5 items-end">
        <button 
          onClick={() => canvasRef.current?.launchCarnival()}
          className="group relative px-10 py-5 bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 rounded-2xl font-black text-sm tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-orange-500/40 overflow-hidden border border-white/10"
        >
          <span className="relative z-10 flex items-center gap-3">
            <span className="animate-bounce">🏮</span> 开启盛大嘉年华 🏮
          </span>
          <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
        </button>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-4 bg-white/5 hover:bg-white/15 rounded-2xl border border-white/10 transition-all backdrop-blur-xl shadow-2xl flex items-center gap-2 group"
        >
          <SettingsIcon className="w-6 h-6 text-cyan-400 group-hover:rotate-90 transition-transform" />
          <span className="text-xs font-bold tracking-widest text-cyan-400/80 pr-1">引擎配置</span>
        </button>
      </div>

      <FireworkCanvas ref={canvasRef} settings={settings} />

      <SettingsPanel 
        show={showSettings} 
        settings={settings} 
        config={config}
        manualConfig={manualConfig}
        onClose={() => setShowSettings(false)}
        onUpdate={updateSetting}
        onUpdateConfig={setConfig}
        onUpdateManual={setManualConfig}
        onRandomize={randomizeSettings}
        onReset={() => setSettings(DEFAULT_SETTINGS)}
      />
    </div>
  );
};

const SettingsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default App;
