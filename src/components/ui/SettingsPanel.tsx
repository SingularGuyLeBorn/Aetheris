// FILE: src/components/ui/SettingsPanel.tsx

import React from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../../types';

interface SettingsPanelProps {
  show: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdate: (key: keyof AppSettings, value: number) => void;
  onRandomize: () => void;
  onReset: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
                                                              show, settings, onClose, onUpdate, onRandomize, onReset
                                                            }) => {
  return (
      <div className={`absolute top-0 right-0 h-full w-80 bg-white/90 backdrop-blur-3xl shadow-2xl z-40 transform transition-transform duration-500 ease-out border-l border-gray-200 ${show ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 h-full flex flex-col overflow-y-auto custom-scrollbar">

          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-800">Configuration</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Physics Parameters</p>
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors">
              ✕
            </button>
          </div>

          {/* Sliders */}
          <div className="space-y-8">
            <SettingSlider label="Gravity" value={settings.gravity} min={0.01} max={0.3} step={0.01} onChange={v => onUpdate('gravity', v)} />
            <SettingSlider label="Air Friction" value={settings.friction} min={0.85} max={0.99} step={0.01} onChange={v => onUpdate('friction', v)} />
            <SettingSlider label="Launch Interval" value={settings.autoLaunchDelay} min={500} max={5000} step={100} unit="ms" onChange={v => onUpdate('autoLaunchDelay', v)} />
            <SettingSlider label="Density" value={settings.particleCountMultiplier} min={0.5} max={2.0} step={0.1} onChange={v => onUpdate('particleCountMultiplier', v)} />
            <SettingSlider label="Explosion Size" value={settings.explosionSizeMultiplier} min={0.5} max={2.0} step={0.1} onChange={v => onUpdate('explosionSizeMultiplier', v)} />
            <SettingSlider label="Trail Length" value={settings.trailLength} min={2} max={30} step={1} onChange={v => onUpdate('trailLength', v)} />
          </div>

          {/* Actions */}
          <div className="mt-auto pt-10 space-y-3">
            <button
                onClick={onRandomize}
                className="w-full py-3 bg-gray-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-700 active:scale-95 transition-all shadow-lg shadow-gray-300"
            >
              Randomize
            </button>
            <button
                onClick={onReset}
                className="w-full py-3 text-gray-400 hover:text-gray-600 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Reset Defaults
            </button>
          </div>
        </div>
      </div>
  );
};

const SettingSlider = ({ label, value, min, max, step, unit = '', onChange }: { label: string, value: number, min: number, max: number, step: number, unit?: string, onChange: (v: number) => void }) => (
    <div className="group">
      <div className="flex justify-between items-center mb-3">
        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">{label}</span>
        <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded">
        {value.toFixed(label.includes('Interval') || label.includes('Length') ? 0 : 2)}{unit}
      </span>
      </div>
      <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-blue-600 hover:bg-gray-300 transition-colors"
      />
    </div>
);

// END OF FILE: src/components/ui/SettingsPanel.tsx