// FILE: src/App3D.tsx

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FireworkScene3D, FireworkScene3DHandle } from './components/FireworkScene3D';
import { SettingsPanel } from './components/ui/SettingsPanel';
import { TimeControlPanel } from './components/ui/TimeControlPanel';
import { HUD3D } from './components/ui/HUD3D';
import {
    AppSettings,
    DEFAULT_SETTINGS,
    FireworkConfig,
    DEFAULT_CONFIG,
    ManualConfig,
    DEFAULT_MANUAL_CONFIG
} from './types';
import { TimeController } from './core/TimeController';

const App3D: React.FC = () => {
    const sceneRef = useRef<FireworkScene3DHandle>(null);
    const [showSettings, setShowSettings] = useState(false);
    const [timeController, setTimeController] = useState<TimeController | null>(null);
    const [stats, setStats] = useState({ particles: 0, fireworks: 0, fps: 0 });
    const [autoRotate, setAutoRotate] = useState(true);

    // --- 状态初始化 ---
    const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [config, setConfig] = useState<FireworkConfig>(DEFAULT_CONFIG);
    const [manualConfig, setManualConfig] = useState<ManualConfig>(DEFAULT_MANUAL_CONFIG);

    // --- 逻辑处理器 ---
    const updateSetting = (key: keyof AppSettings, value: number | boolean) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleTimeScaleChange = (scale: number) => {
        const currentScene = sceneRef.current;
        if (currentScene) {
            // 修复 TS2779：显式检查并赋值
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

    return (
        <div className="relative w-screen h-screen bg-gray-50 overflow-hidden font-sans text-gray-800 select-none">
            <style>{`
        input[type="range"]::-webkit-slider-thumb {
          appearance: none; width: 14px; height: 14px; border-radius: 50%;
          background: #3b82f6; cursor: pointer; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>

            <HUD3D />

            {/* 控制按钮 */}
            <div className="absolute top-8 right-8 z-20 flex flex-col gap-4 items-end">
                <button
                    onClick={() => sceneRef.current?.launchCarnival()}
                    className="px-8 py-4 bg-white/80 backdrop-blur rounded-2xl font-black text-[10px] tracking-[0.2em] shadow-xl border border-white text-gray-800 hover:scale-105 active:scale-95 transition-all"
                >
                    ✨ START GRAND FINALE
                </button>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="p-4 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white transition-all hover:text-blue-600"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                </button>
            </div>

            {/* 3D 场景 */}
            <FireworkScene3D
                ref={sceneRef}
                settings={settings}
                config={config}
                manualConfig={manualConfig}
                autoRotate={autoRotate}
                onTimeUpdate={(tc) => setTimeController(tc)}
                onStatsUpdate={(st) => setStats(st)}
            />

            {/* 时间面板 */}
            <TimeControlPanel
                timeController={timeController}
                stats={stats}
                onTimeScaleChange={handleTimeScaleChange}
                onTogglePause={handleTogglePause}
                autoRotate={autoRotate}
                onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
            />

            {/* 配置面板 */}
            <SettingsPanel
                show={showSettings}
                settings={settings}
                config={config}
                manualConfig={manualConfig}
                onClose={() => setShowSettings(false)}
                onUpdate={updateSetting}
                onUpdateConfig={setConfig}
                onUpdateManual={setManualConfig}
                onRandomize={() => {}}
                onReset={() => {
                    setSettings(DEFAULT_SETTINGS);
                    setConfig(DEFAULT_CONFIG);
                    setManualConfig(DEFAULT_MANUAL_CONFIG);
                }}
            />
        </div>
    );
};

export default App3D;

// END OF FILE: src/App3D.tsx