// FILE: src/components/ui/SettingsPanel.tsx

import React, { useState } from 'react';
import { AppSettings, FireworkConfig, ManualConfig, ExplosionType, AscensionType, ColorStyle, SHAPE_ICONS, COLOR_ICONS, ASCENSION_ICONS } from '../../types';
import { PreviewScene } from './PreviewScene';

interface SettingsPanelProps {
    show: boolean;
    settings: AppSettings;
    config: FireworkConfig;
    manualConfig: ManualConfig;
    onClose: () => void;
    onUpdate: (key: keyof AppSettings, value: number | boolean) => void;
    onUpdateConfig: (config: FireworkConfig) => void;
    onUpdateManual: (config: ManualConfig) => void;
    onRandomize: () => void;
    onReset: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
                                                                show, settings, config, manualConfig, onClose, onUpdate, onUpdateConfig, onUpdateManual, onRandomize, onReset
                                                            }) => {
    const [activeTab, setActiveTab] = useState<'carnival' | 'manual' | 'physics'>('carnival');

    // 获取当前预览的对象
    const previewShape = activeTab === 'manual' && manualConfig.lockedShape !== 'RANDOM'
        ? (manualConfig.lockedShape as ExplosionType)
        : ExplosionType.SPHERE;

    const previewColor = activeTab === 'manual' && manualConfig.lockedColor !== 'RANDOM'
        ? (manualConfig.lockedColor as ColorStyle)
        : ColorStyle.RAINBOW;

    return (
        <div className={`absolute top-0 right-0 h-full w-[450px] bg-white/95 backdrop-blur-3xl shadow-2xl z-40 transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] border-l border-gray-200 flex flex-col ${show ? 'translate-x-0' : 'translate-x-full'}`}>

            {/* 1. Panel Header */}
            <div className="p-6 pb-2 border-b border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter text-gray-800 italic">DESIGNER <span className="text-blue-600">HUB</span></h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] mt-1">Configure & Preview Your Show</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all border border-gray-100">✕</button>
                </div>

                {/* 2. Navigation Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-2xl mb-4">
                    {[
                        { id: 'carnival', label: '嘉年华配置', icon: '🎡' },
                        { id: 'manual', label: '单发设计', icon: '🎯' },
                        { id: 'physics', label: '引擎核心', icon: '⚡' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === tab.id ? 'bg-white shadow-lg text-blue-600 scale-[1.02]' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span>{tab.icon}</span>{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Main Content Scroll Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">

                {/* === 实时 3D 预览窗口 === */}
                <div className="h-48 bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 shadow-inner relative">
                    <PreviewScene shape={previewShape} colorStyle={previewColor} />
                </div>

                {/* --- Tab 1: Carnival --- */}
                {activeTab === 'carnival' && (
                    <div className="space-y-8 animate-fadeIn">
                        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-3xl border border-blue-100/50">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-xs font-black text-blue-900 uppercase">自动轮播嘉年华</span>
                                <Toggle checked={settings.enableAutoCarnival} onChange={v => onUpdate('enableAutoCarnival', v)} />
                            </div>
                            <SettingSlider label="发射波次频率" value={settings.carnivalInterval} min={1} max={15} step={1} unit="s" onChange={v => onUpdate('carnivalInterval', v)} />
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em] mb-4">启用形状集</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.values(ExplosionType).map(t => (
                                    <ShapeCard
                                        key={t} type={t}
                                        active={config.enabledShapes.includes(t)}
                                        onClick={() => onUpdateConfig({...config, enabledShapes: config.enabledShapes.includes(t) ? config.enabledShapes.filter(s => s !== t) : [...config.enabledShapes, t]})}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- Tab 2: Manual --- */}
                {activeTab === 'manual' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="bg-gray-50 p-4 rounded-2xl text-[11px] text-gray-500 font-medium italic border-l-4 border-blue-400">
                            提示：单发模式配置鼠标点击时的固定样式。若设为“随机”，则遵循嘉年华白名单。
                        </div>

                        <section>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4">锁定单发形状</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div onClick={() => onUpdateManual({...manualConfig, lockedShape: 'RANDOM'})} className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${manualConfig.lockedShape === 'RANDOM' ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    <div className="text-2xl">🎲</div>
                                    <div className="font-black text-xs text-gray-700">随机形状</div>
                                </div>
                                {Object.values(ExplosionType).map(t => (
                                    <ShapeCard
                                        key={t} type={t}
                                        active={manualConfig.lockedShape === t}
                                        onClick={() => onUpdateManual({...manualConfig, lockedShape: t})}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {/* --- Tab 3: Physics --- */}
                {activeTab === 'physics' && (
                    <div className="space-y-6 animate-fadeIn">
                        <SettingSlider label="全局重力" value={settings.gravity} min={0.01} max={0.3} step={0.01} onChange={v => onUpdate('gravity', v)} />
                        <SettingSlider label="大气粘度" value={settings.friction} min={0.85} max={0.99} step={0.01} onChange={v => onUpdate('friction', v)} />
                        <SettingSlider label="粒子密度倍率" value={settings.particleCountMultiplier} min={0.2} max={2.0} step={0.1} onChange={v => onUpdate('particleCountMultiplier', v)} />
                    </div>
                )}
            </div>

            {/* 4. Footer Actions */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/30 flex gap-4">
                <button onClick={onRandomize} className="flex-1 py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95">🎲 随机化参数</button>
                <button onClick={onReset} className="px-6 py-4 bg-white border border-gray-200 text-gray-400 rounded-2xl text-[10px] font-black uppercase hover:text-red-500 transition-all">重置</button>
            </div>
        </div>
    );
};

// --- 子组件: 样式化卡片 ---

const ShapeCard = ({ type, active, onClick }: { type: ExplosionType, active: boolean, onClick: () => void }) => (
    <div
        onClick={onClick}
        className={`group relative p-4 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${active ? 'border-blue-500 bg-blue-50/50 shadow-lg scale-[1.02]' : 'border-gray-50 bg-white hover:border-gray-200'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${active ? 'bg-white' : 'bg-gray-50'}`}>
                {SHAPE_ICONS[type]}
            </div>
            <div className="flex flex-col">
                <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'text-blue-600' : 'text-gray-700'}`}>{type}</span>
                <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">FIREWORK</span>
            </div>
        </div>
        {/* CSS 装饰背景 */}
        <div className={`absolute -right-2 -bottom-2 w-12 h-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity ${active ? 'text-blue-600' : 'text-black'}`}>
            <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/></svg>
        </div>
    </div>
);

const SettingSlider = ({ label, value, min, max, step, unit = '', onChange }: any) => (
    <div className="space-y-3">
        <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold">{value.toFixed(2)}{unit}</span>
        </div>
        <input
            type="range" min={min} max={max} step={step} value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-full appearance-none cursor-pointer accent-blue-600"
        />
    </div>
);

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full transition-colors relative ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}
    >
        <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${checked ? 'left-6' : 'left-1'}`} />
    </button>
);

// END OF FILE: src/components/ui/SettingsPanel.tsx