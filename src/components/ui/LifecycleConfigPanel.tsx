/**
 * Aetheris Studio Pro - 极简浅色中文版 (V4.0)
 * 
 * 设计规范：
 * 1. 风格：Apple / Minimalist 浅色毛玻璃风格
 * 2. 材质：白釉毛玻璃 (White/80 + Backdrop Blur)
 * 3. 语言：全中文交互
 */

import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  FireworkLifecycleConfig,
  LifecyclePhase,
  DEFAULT_LIFECYCLE_CONFIG,
  SHAPE_CATEGORIES,
  ACTION_CATEGORIES,
  HOVER_CATEGORIES,
  TRAIL_CATEGORIES,
  FADE_CATEGORIES
} from '../../types/lifecycle';
import { ShapePreview } from './ShapePreview';

// --- 动画辅助 ---
const TRANSITION = "transition-all duration-300 ease-in-out";

// --- 浅色专业滑块 ---
const InspectorSlider: React.FC<{
  label: string; value: number; min: number; max: number; step?: number; unit?: string; color: string; onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 0.01, unit = '', color, onChange }) => (
  <div className={`group flex flex-col gap-2 p-4 rounded-[20px] bg-white/[0.03] hover:bg-white/[0.08] ${TRANSITION} border border-white/5 hover:border-white/10 shadow-sm`}>
    <div className="flex justify-between items-center px-1">
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-15px font-black text-white font-mono tracking-wider">
          {value.toFixed(step < 0.1 ? 2 : 1)}
        </span>
        <span className="text-[9px] text-slate-500 font-black uppercase">{unit}</span>
      </div>
    </div>
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-white hover:accent-indigo-400 transition-all"
      style={{ accentColor: color }}
    />
  </div>
);

// --- 资源库磁贴 (Pro 版) ---
const ResourceTile: React.FC<{
  id: string; selected: boolean; color: string; onClick: () => void;
}> = ({ id, selected, color, onClick }) => (
  <button
    onClick={onClick}
    className={`relative h-24 rounded-2xl transition-all duration-500 overflow-hidden border-2 group ${
      selected 
        ? 'border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.2)] scale-[1.02] bg-white/10' 
        : 'border-white/5 hover:border-white/20 bg-black/20 hover:bg-black/40'
    }`}
  >
    <div className={`absolute inset-0 transition-all duration-700 ${selected ? 'opacity-100 scale-110' : 'opacity-40 group-hover:opacity-80'}`}>
      <ShapePreview shapeType={id} color={selected ? color : '#64748b'} size={100} />
    </div>
    <div className={`absolute inset-x-0 bottom-0 p-2.5 transition-all ${selected ? 'bg-white/15' : 'bg-black/20'} backdrop-blur-md border-t border-white/10`}>
      <span className={`text-[10px] font-black truncate block tracking-widest text-center ${selected ? 'text-white' : 'text-slate-400'}`}>
        {id.toUpperCase().replace('_', ' ')}
      </span>
    </div>
    {selected && (
      <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-pulse" />
    )}
  </button>
);

// --- 阶段映射表 (新命名) ---
const PHASE_MAP: Record<LifecyclePhase, { label: string, icon: string, color: string }> = {
  ascent: { label: '升空', icon: '🚀', color: '#0ea5e9' },
  explosion: { label: '绽放', icon: '✨', color: '#f43f5e' },
  action: { label: '演舞', icon: '💃', color: '#8b5cf6' },
  hover: { label: '悬停', icon: '⚓', color: '#10b981' },
  fade: { label: '归寂', icon: '🍂', color: '#f59e0b' },
};

export const LifecycleConfigPanel: React.FC<{
  config: FireworkLifecycleConfig;
  onConfigChange: (config: FireworkLifecycleConfig) => void;
  onLaunch: () => void;
  isPaused: boolean;
  onPauseToggle: () => void;
  onRotateToggle: () => void;
  isAutoRotate: boolean;
  stats: { particles: number, fireworks: number, fps: number };
}> = ({ config, onConfigChange, onLaunch, isPaused, onPauseToggle, onRotateToggle, isAutoRotate, stats }) => {
  const [activePhase, setActivePhase] = useState<LifecyclePhase>('explosion');
  // 新增：升空阶段是否在选择图案 (如果是 false 则是在选择上升轨迹类型)
  const [selectingAscentPattern, setSelectingAscentPattern] = useState(false);

  const update = (phase: LifecyclePhase, data: any) => {
    onConfigChange({ ...config, [phase]: { ...config[phase], ...data } });
  };

  const getCategories = () => {
    switch(activePhase) {
      case 'ascent': 
        // 借用 SHAPE_CATEGORIES 给上升图案使用，如果是选轨迹则用 TRAIL_CATEGORIES
        return selectingAscentPattern ? SHAPE_CATEGORIES : TRAIL_CATEGORIES;
      case 'explosion': return SHAPE_CATEGORIES;
      case 'action': return ACTION_CATEGORIES;
      case 'hover': return HOVER_CATEGORIES;
      case 'fade': return FADE_CATEGORIES;
    }
  };

  const getSelection = () => {
    switch(activePhase) {
      case 'ascent': return selectingAscentPattern ? config.ascent.ascentPattern : config.ascent.trailEffect;
      case 'explosion': return config.explosion.shape;
      case 'action': return config.action.actionType;
      case 'hover': return config.hover.hoverMode;
      case 'fade': return config.fade.fadeEffect;
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-6 pointer-events-none flex flex-col items-center">
      {/* 极简 HUD 指示器 */}
      <div className="fixed top-8 right-8 flex gap-3 pointer-events-none">
        <div className="px-5 py-3 rounded-[24px] bg-white/70 backdrop-blur-2xl border border-white shadow-xl flex gap-6 items-center">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">FPS 帧率</span>
              <span className={`text-xl font-black font-mono leading-none ${stats.fps > 55 ? 'text-indigo-600' : 'text-rose-600'}`}>{stats.fps}</span>
            </div>
            <div className="w-px h-6 bg-slate-200" />
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">渲染粒子</span>
              <span className="text-xl font-black font-mono text-slate-900 leading-none">{stats.particles}</span>
            </div>
        </div>
      </div>

      {/* Aetheris Console V4 */}
      {/* 核心控制面板：Aetheris Studio Pro */}
      <div className="w-[1280px] h-[400px] bg-slate-900/85 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.6)] pointer-events-auto flex flex-col overflow-hidden ring-1 ring-white/20">
        
        {/* 顶部：导播级导航栏 */}
        <div className="h-22 flex items-center justify-between px-12 border-b border-white/5 bg-white/5">
          <div className="flex gap-4">
            {(Object.entries(PHASE_MAP) as [LifecyclePhase, any][]).map(([p, info]) => (
              <button
                key={p}
                onClick={() => { setActivePhase(p); setSelectingAscentPattern(false); }}
                className={`relative px-8 py-5 flex flex-col items-center gap-1.5 transition-all duration-500 group ${
                  activePhase === p ? 'opacity-100 translate-y-[-2px]' : 'opacity-30 hover:opacity-60'
                }`}
              >
                <span className="text-2xl pb-1 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{info.icon}</span>
                <span className={`text-[11px] font-black tracking-[0.2em] transition-colors ${activePhase === p ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>
                  {info.label}
                </span>
                {activePhase === p && (
                  <div className="absolute bottom-0 left-6 right-6 h-1 rounded-t-full shadow-[0_-4px_12px_rgba(255,255,255,0.4)]" style={{ backgroundColor: info.color }} />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-6">
             <div className="flex gap-2.5 p-2 bg-black/40 rounded-[22px] border border-white/10">
                <button onClick={onPauseToggle} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${isPaused ? 'bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.4)] text-white scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                  <span className="text-xl">{isPaused ? '▶' : '||'}</span>
                </button>
                <button onClick={onRotateToggle} className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[10px] font-black transition-all duration-500 ${isAutoRotate ? 'bg-cyan-600 shadow-[0_0_20px_rgba(8,145,178,0.4)] text-white scale-105' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
                  旋转
                </button>
             </div>
             <div className="w-px h-10 bg-white/10 mx-2" />
             <button
               onClick={onLaunch}
               className="group relative h-16 px-14 bg-white text-slate-900 rounded-[28px] text-[13px] font-black tracking-[0.4em] transition-all duration-500 shadow-[0_0_30px_rgba(255,255,255,0.15)] hover:shadow-[0_0_40px_rgba(255,255,255,0.25)] hover:scale-105 active:scale-95 overflow-hidden"
             >
               <span className="relative z-10">发射预览</span>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
             </button>
          </div>
        </div>

        {/* 主体：分层工作区 */}
        <div className="flex-1 flex overflow-hidden">
          {/* A. 左侧资源区 (Dark Console) */}
          <div className="w-[480px] border-r border-white/5 flex flex-col p-8 overflow-y-auto bg-black/30">
             
             {/* 特殊控制切换 */}
             {activePhase === 'ascent' && (
               <div className="flex p-1.5 bg-black/60 rounded-[18px] border border-white/10 mb-8 shrink-0">
                 <button 
                  onClick={() => setSelectingAscentPattern(false)}
                  className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all duration-500 ${!selectingAscentPattern ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   上升轨迹
                 </button>
                 <button 
                  onClick={() => setSelectingAscentPattern(true)}
                  className={`flex-1 py-2.5 text-[11px] font-black rounded-xl transition-all duration-500 ${selectingAscentPattern ? 'bg-white/10 text-white shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
                 >
                   上升图案
                 </button>
               </div>
             )}

             <div className="space-y-12">
               {Object.entries(getCategories()).map(([catId, cat]: [string, any]) => (
                 <div key={catId} className="space-y-6">
                   <div className="flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PHASE_MAP[activePhase].color }} />
                     <span className="text-[11px] font-black text-white/30 uppercase tracking-[0.3em]">{cat.label}</span>
                   </div>
                   <div className="grid grid-cols-3 gap-4">
                     {cat.items.map((item: string) => (
                       <ResourceTile
                         key={item}
                         id={item}
                         selected={getSelection() === item}
                         color={PHASE_MAP[activePhase].color}
                         onClick={() => update(activePhase, { 
                          [activePhase === 'ascent' ? (selectingAscentPattern ? 'ascentPattern' : 'trailEffect') : 
                           activePhase === 'explosion' ? 'shape' : 
                           activePhase === 'action' ? 'actionType' : 
                           activePhase === 'hover' ? 'hoverMode' : 'fadeEffect']: item 
                        })}
                       />
                     ))}
                   </div>
                 </div>
               ))}
             </div>
          </div>

          {/* B. 右侧检查器 (Glass Inspector) */}
          <div className="flex-1 overflow-y-auto px-16 py-10 bg-white/[0.02]">
             <div className="max-w-[800px] mx-auto grid grid-cols-2 gap-x-20 gap-y-8">
                {/* 动态显示不同阶段的参数调节 */}
                <div className="col-span-2 mb-4 border-b border-white/5 pb-4">
                  <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.5em] mb-1">
                    Parameter Inspector
                  </h3>
                  <div className="text-xl font-black text-white flex items-baseline gap-2">
                    {PHASE_MAP[activePhase].label} <span className="text-xs text-slate-500 font-normal tracking-normal opacity-60">特性微调</span>
                  </div>
                </div>

                {activePhase === 'ascent' && (
                  <>
                    <InspectorSlider label="飞行时长" value={config.ascent.duration} min={0.5} max={5} unit="s" color={PHASE_MAP.ascent.color} onChange={v => update('ascent', { duration: v })} />
                    <InspectorSlider label="轨迹宽度" value={config.ascent.trailSize} min={0.1} max={5} color={PHASE_MAP.ascent.color} onChange={v => update('ascent', { trailSize: v })} />
                    <InspectorSlider label="形状比例" value={config.ascent.spiralRadius} min={0} max={30} color={PHASE_MAP.ascent.color} onChange={v => update('ascent', { spiralRadius: v })} />
                    <InspectorSlider label="发射密度" value={config.ascent.trailDensity} min={0.1} max={1} color={PHASE_MAP.ascent.color} onChange={v => update('ascent', { trailDensity: v })} />
                  </>
                )}
                {activePhase === 'explosion' && (
                  <>
                    <InspectorSlider label="色彩相角" value={config.explosion.primaryHue} min={0} max={360} unit="°" color={PHASE_MAP.explosion.color} onChange={v => update('explosion', { primaryHue: v })} />
                    <InspectorSlider label="粒子群规模" value={config.explosion.particleCount} min={500} max={10000} step={100} color={PHASE_MAP.explosion.color} onChange={v => update('explosion', { particleCount: v })} />
                    <InspectorSlider label="爆发半径" value={config.explosion.launchScale} min={1} max={150} step={1} color={PHASE_MAP.explosion.color} onChange={v => update('explosion', { launchScale: v })} />
                    <InspectorSlider label="膨胀速率" value={config.explosion.bloomDuration} min={0} max={3} unit="s" color={PHASE_MAP.explosion.color} onChange={v => update('explosion', { bloomDuration: v })} />
                    <InspectorSlider label="维持时长" value={config.explosion.growDuration} min={0} max={2} unit="s" color={PHASE_MAP.explosion.color} onChange={v => update('explosion', { growDuration: v })} />
                    <InspectorSlider label="爆炸势能" value={config.explosion.power} min={0} max={3} color={PHASE_MAP.explosion.color} onChange={v => update('explosion', { power: v })} />
                  </>
                )}
                {activePhase === 'action' && (
                  <>
                    <InspectorSlider label="动作时长" value={config.action.duration} min={0.5} max={10} unit="s" color={PHASE_MAP.action.color} onChange={v => update('action', { duration: v })} />
                    <InspectorSlider label="扰动强度" value={config.action.intensity} min={0} max={1} color={PHASE_MAP.action.color} onChange={v => update('action', { intensity: v })} />
                    <InspectorSlider label="震荡周波" value={config.action.frequency} min={0.1} max={10} unit="Hz" color={PHASE_MAP.action.color} onChange={v => update('action', { frequency: v })} />
                  </>
                )}
                {activePhase === 'hover' && (
                  <>
                    <InspectorSlider label="定形等待" value={config.hover.hoverBeforeAction} min={0} max={5} unit="s" color={PHASE_MAP.hover.color} onChange={v => update('hover', { hoverBeforeAction: v })} />
                    <InspectorSlider label="消散延时" value={config.hover.hoverAfterAction} min={0} max={5} unit="s" color={PHASE_MAP.hover.color} onChange={v => update('hover', { hoverAfterAction: v })} />
                    <InspectorSlider label="反力补偿" value={config.hover.gravityResistance} min={0} max={1.2} color={PHASE_MAP.hover.color} onChange={v => update('hover', { gravityResistance: v })} />
                    <InspectorSlider label="层流稳定" value={config.hover.stability} min={0} max={1} color={PHASE_MAP.hover.color} onChange={v => update('hover', { stability: v })} />
                  </>
                )}
                {activePhase === 'fade' && (
                  <>
                    <InspectorSlider label="衰减时长" value={config.fade.duration} min={0.5} max={10} unit="s" color={PHASE_MAP.fade.color} onChange={v => update('fade', { duration: v })} />
                    <InspectorSlider label="重力拽引" value={config.fade.gravityStrength} min={0} max={5} color={PHASE_MAP.fade.color} onChange={v => update('fade', { gravityStrength: v })} />
                    <InspectorSlider label="侧向漂移" value={config.fade.windStrength} min={0} max={2} color={PHASE_MAP.fade.color} onChange={v => update('fade', { windStrength: v })} />
                  </>
                )}

                {/* 全局主控设置 */}
                <div className="col-span-2 pt-12 mt-4 border-t border-white/5 flex gap-12">
                   <div className="flex-1">
                     <InspectorSlider label="后期曝光 (EV)" value={config.rendering.exposure} min={0.01} max={2} color="#94a3b8" onChange={v => onConfigChange({...config, rendering: {...config.rendering, exposure: v}})} />
                   </div>
                   <div className="flex-1">
                     <InspectorSlider label="辉光扩散" value={config.rendering.bloomStrength} min={0} max={5} color="#94a3b8" onChange={v => onConfigChange({...config, rendering: {...config.rendering, bloomStrength: v}})} />
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
