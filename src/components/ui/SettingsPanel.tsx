
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
    <div className={`absolute top-0 right-0 h-full w-96 bg-[#030307]/95 backdrop-blur-3xl border-l border-white/5 z-40 transform transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${show ? 'translate-x-0' : 'translate-x-full shadow-none'}`}>
      <div className="p-12 h-full flex flex-col gap-10 overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-center border-b border-white/5 pb-8">
          <div>
            <h2 className="text-2xl font-black tracking-widest text-white">参数中枢</h2>
            <p className="text-[10px] text-white/30 uppercase tracking-widest mt-1">Engine Kernel Controllers</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-400 transition-all group">
            <span className="text-xl group-hover:scale-125 transition-transform">✕</span>
          </button>
        </div>

        <div className="space-y-10">
          <SettingSlider label="时空引力" value={settings.gravity} min={0.01} max={0.3} step={0.01} onChange={v => onUpdate('gravity', v)} desc="重力场强度，决定下坠快慢" />
          <SettingSlider label="空气粘度" value={settings.friction} min={0.85} max={0.99} step={0.01} onChange={v => onUpdate('friction', v)} desc="介质阻力，影响扩散惯性" />
          <SettingSlider label="巡航频率" value={settings.autoLaunchDelay} min={500} max={10000} step={100} onChange={v => onUpdate('autoLaunchDelay', v)} unit="ms" desc="静默状态下的自动发射间隔" />
          <SettingSlider label="粒子集群密度" value={settings.particleCountMultiplier} min={0.2} max={4.0} step={0.1} onChange={v => onUpdate('particleCountMultiplier', v)} desc="爆炸核心生成的碎片总数" />
          <SettingSlider label="时空曲率(规模)" value={settings.explosionSizeMultiplier} min={0.2} max={4.0} step={0.1} onChange={v => onUpdate('explosionSizeMultiplier', v)} desc="单次爆炸覆盖的物理半径" />
          <SettingSlider label="远星跃迁频率" value={settings.starBlinkSpeed} min={0.0001} max={0.005} step={0.0001} onChange={v => onUpdate('starBlinkSpeed', v)} desc="星空闪烁的量子律动速度" />
          <SettingSlider label="升空轨迹长度" value={settings.trailLength} min={2} max={60} step={1} onChange={v => onUpdate('trailLength', v)} desc="火箭拖尾的视觉残影长度" />
        </div>

        <div className="mt-auto flex flex-col gap-4 pt-10 border-t border-white/5">
          <button 
            onClick={onRandomize}
            className="w-full py-5 bg-cyan-500 text-black rounded-2xl text-xs font-black uppercase tracking-[0.4em] transition-all hover:bg-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] active:scale-95"
          >
            🎲 随机演化参数
          </button>
          <button 
            onClick={() => {
              if(confirm('确定要重置为实验室推荐参数吗？')) onReset();
            }}
            className="w-full py-4 hover:bg-white/5 text-white/20 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all border border-transparent hover:border-white/5"
          >
            重置为推荐值
          </button>
        </div>
      </div>
    </div>
  );
};

const SettingSlider = ({ label, value, min, max, step, unit = '', onChange, desc }: { label: string, value: number, min: number, max: number, step: number, unit?: string, onChange: (v: number) => void, desc?: string }) => (
  <div className="space-y-4 group">
    <div className="flex justify-between items-end">
      <div className="space-y-1.5">
        <span className="text-[12px] uppercase tracking-[0.2em] font-black text-white/60 group-hover:text-cyan-400 transition-colors">{label}</span>
        {desc && <p className="text-[9px] text-white/20 font-medium leading-relaxed">{desc}</p>}
      </div>
      <span className="text-cyan-400 font-mono text-sm font-bold bg-cyan-400/5 px-3 py-1 rounded-lg ring-1 ring-cyan-400/20">
        {value.toFixed(label.includes('频率') || label.includes('长度') ? 0 : (label.includes('频率') ? 5 : 3))}{unit}
      </span>
    </div>
    <input 
      type="range" 
      min={min} 
      max={max} 
      step={step} 
      value={value} 
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-cyan-500 hover:bg-white/10 transition-all"
    />
  </div>
);
