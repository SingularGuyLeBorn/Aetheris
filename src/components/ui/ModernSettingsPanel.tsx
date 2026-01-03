// FILE: src/components/ui/ModernSettingsPanel.tsx
// 现代化设置面板 - 浅色主题，整合新系统 - 液态玻璃风格

import React, { useState, useMemo } from 'react';
import { ShapePreviewCard, ShapePreview3D } from './ShapePreviewCard';
import { TrajectoryPreview3D } from './TrajectoryPreview3D';
import { CustomSelect } from './CustomSelect';
import { CustomSelectWithPreview } from './CustomSelectWithPreview';
import { Shape3DType, SHAPE_3D_INFO, SHAPE_CATEGORIES } from '../../core/shapes/Shape3DFactory';
import { TrajectoryType, TRAJECTORY_INFO } from '../../core/trajectories/TrajectoryFactory';
import { ComboType } from '../../core/combos/ComboManager';

// 导入现有类型以保持兼容
import { 
  AppSettings, 
  FireworkConfig, 
  ManualConfig, 
  CarnivalStage,
  LaunchFormation
} from '../../types';

interface ModernSettingsPanelProps {
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
  onLaunchCarnival: () => void;
}

type TabId = 'shapes' | 'trajectories' | 'manual' | 'carnival' | 'physics';

export const ModernSettingsPanel: React.FC<ModernSettingsPanelProps> = ({
  show,
  settings,
  config,
  manualConfig,
  onClose,
  onUpdate,
  onUpdateConfig,
  onUpdateManual,
  onRandomize,
  onReset,
  onLaunchCarnival
}) => {
  const [activeTab, setActiveTab] = useState<TabId>('shapes');
  
  // 核心状态：当前正在预览的项 (来自 Grid Hover 或 Dropdown Hover)
  // 如果没有 Hover，则显示当前选中的（如第一个启用的形状或轨迹）
  const [previewShape, setPreviewShape] = useState<Shape3DType | null>(null);
  const [previewTrajectory, setPreviewTrajectory] = useState<TrajectoryType | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>(SHAPE_CATEGORIES.BASIC_GEOMETRY);
  
  // 状态同步优化
  const [localSeq, setLocalSeq] = useState<CarnivalStage[]>(config.carnivalSequence || []);
  const [hasChanges, setHasChanges] = useState(false);

  // 当外部 config 变化且非本地编辑导致时，同步数据
  React.useEffect(() => {
    if (!hasChanges) {
      setLocalSeq(config.carnivalSequence || []);
    }
  }, [config.carnivalSequence, hasChanges]);

  const handleUpdateLocal = (newSeq: CarnivalStage[]) => {
    setLocalSeq(newSeq);
    setHasChanges(true);
  };

  const handleApplySequence = () => {
    onUpdateConfig({ ...config, carnivalSequence: localSeq });
    setHasChanges(false);
  };
  
  // 按类别分组形状
  const shapesByCategory = useMemo(() => {
    const groups: Record<string, Shape3DType[]> = {};
    Object.values(Shape3DType).forEach(type => {
      const info = SHAPE_3D_INFO[type];
      if (!groups[info.category]) groups[info.category] = [];
      groups[info.category].push(type);
    });
    return groups;
  }, []);
  
  const [selectedNewShapes, setSelectedNewShapes] = useState<Shape3DType[]>(config.enabledShape3Ds || []);
  const [selectedTrajectories, setSelectedTrajectories] = useState<TrajectoryType[]>(config.enabledTrajectories || [TrajectoryType.LINEAR]);
  
  React.useEffect(() => {
    setSelectedNewShapes(config.enabledShape3Ds || []);
    setSelectedTrajectories(config.enabledTrajectories || [TrajectoryType.LINEAR]);
  }, [config.enabledShape3Ds, config.enabledTrajectories]);

  const toggleNewShape = (type: Shape3DType) => {
    const next = selectedNewShapes.includes(type) 
      ? selectedNewShapes.filter(t => t !== type)
      : [...selectedNewShapes, type];
    setSelectedNewShapes(next);
    onUpdateConfig({ ...config, enabledShape3Ds: next });
  };
  
  const toggleTrajectory = (type: TrajectoryType) => {
    const next = selectedTrajectories.includes(type) 
      ? selectedTrajectories.filter(t => t !== type)
      : [...selectedTrajectories, type];
    setSelectedTrajectories(next);
    onUpdateConfig({ ...config, enabledTrajectories: next });
  };
  
  const tabs = [
    { id: 'shapes' as TabId, label: 'Shape Lab', icon: '🎨', title: '形状实验室' },
    { id: 'trajectories' as TabId, label: 'Path', icon: '🚀', title: '轨迹规划' },
    { id: 'manual' as TabId, label: 'Interaction', icon: '👆', title: '手动交互配置' },
    { id: 'carnival' as TabId, label: 'Show', icon: '🎬', title: '大秀编排' },
    { id: 'physics' as TabId, label: 'Engine', icon: '⚙️', title: '物理引擎' },
  ];

  // 计算当前应该在顶部固定预览显示的项
  const activeShapeToShow = previewShape || (selectedNewShapes.length > 0 ? selectedNewShapes[0] : Shape3DType.SPHERE);
  const activeTrajectoryToShow = previewTrajectory || (selectedTrajectories.length > 0 ? selectedTrajectories[0] : TrajectoryType.LINEAR);
  
  // 决定显示哪种预览 (Shape 还是 Trajectory)
  // 规则：在 Trajectories Tab 显示轨迹，其他情况默认显示形状（或根据上下文）
  const showTrajectoryPreview = activeTab === 'trajectories';

  return (
    <div 
      className={`
        fixed top-0 right-0 h-full w-[480px] 
        bg-slate-50/90 backdrop-blur-3xl 
        shadow-[0_0_50px_rgba(0,0,0,0.2)] z-40 
        transform transition-all duration-500 cubic-bezier(0.2, 0.8, 0.2, 1)
        border-l border-white/60
        flex flex-col
        ${show ? 'translate-x-0' : 'translate-x-full'}
      `}
    >
      {/* ========== Header ========== */}
      <div className="px-6 pt-6 pb-2 border-b border-white/50 bg-gradient-to-b from-white/60 to-transparent">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight drop-shadow-sm flex items-center gap-2">
              <span className="text-3xl">✨</span>
              Aetheris
            </h2>
            <p className="text-[10px] text-slate-400 font-bold tracking-[0.2em] uppercase ml-1">
              Universal Particle System
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-all shadow-sm border border-white/50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 bg-slate-200/50 p-1.5 rounded-2xl border border-white/50 shadow-inner overflow-x-auto custom-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 min-w-[70px] py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider
                transition-all relative overflow-hidden group
                ${activeTab === tab.id 
                  ? 'bg-white text-emerald-600 shadow-[0_4px_12px_rgba(16,185,129,0.15)] ring-1 ring-emerald-100' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-white/40'
                }
              `}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-xl filter drop-shadow-sm transition-transform group-hover:scale-110">{tab.icon}</span>
                <span className="scale-90">{tab.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* ========== Unified Fixed Preview Area (Sticky Top) ========== */}
      <div className="relative z-10 bg-gradient-to-b from-slate-100/50 to-white/30 border-b border-white/60">
        {showTrajectoryPreview ? (
           <div className="h-48 w-full bg-slate-900 border-y border-white/10 relative overflow-hidden group">
              <TrajectoryPreview3D 
                trajectoryType={activeTrajectoryToShow}
                speed={15}
                height={250}
                angle={0}
              />
              <div className="absolute top-2 left-3 bg-black/50 backdrop-blur px-2 py-1 rounded-lg text-[9px] font-bold text-cyan-400 border border-cyan-500/30">
                PATH PREVIEW
              </div>
           </div>
        ) : (
           <ShapePreview3D 
              shapeType={activeShapeToShow} 
              className="h-48 border-b border-white/40 bg-gradient-to-b from-slate-50/50 to-white/50 shadow-inner"
           />
        )}
      </div>
      
      {/* ========== Content ========== */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar bg-white/30">
        
        {/* ===== Tab: Shapes ===== */}
        {activeTab === 'shapes' && (
          <div className="space-y-6 animate-slideUp">
            <div className="flex flex-wrap gap-2 sticky top-0 bg-white/80 backdrop-blur p-2 -mx-2 rounded-xl z-10 border border-white/50 shadow-sm">
              {Object.values(SHAPE_CATEGORIES).map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                    px-4 py-2 rounded-xl text-[10px] font-bold transition-all border
                    ${selectedCategory === cat 
                      ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30' 
                      : 'bg-white border-white text-slate-500 hover:bg-emerald-50 hover:text-emerald-600'
                    }
                  `}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {shapesByCategory[selectedCategory]?.map(type => (
                <ShapePreviewCard
                  key={type}
                  type={type}
                  active={selectedNewShapes.includes(type)}
                  onClick={() => toggleNewShape(type)}
                  onPreview={(shape) => setPreviewShape(shape)}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* ===== Tab: Trajectories ===== */}
        {activeTab === 'trajectories' && (
          <div className="space-y-4 animate-slideUp">
             <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 text-[10px] text-blue-600 font-medium">
                选择已启用的上升轨迹。系统将在发射时从中随机选择。
             </div>
             <div className="grid grid-cols-1 gap-2">
              {Object.values(TrajectoryType).map(type => {
                const info = TRAJECTORY_INFO[type];
                const isSelected = selectedTrajectories.includes(type);
                const isHovered = previewTrajectory === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => toggleTrajectory(type)}
                    onMouseEnter={() => setPreviewTrajectory(type)}
                    onMouseLeave={() => setPreviewTrajectory(null)}
                    className={`
                      w-full p-4 rounded-2xl border text-left transition-all duration-300 flex items-center justify-between group
                      ${isHovered 
                        ? 'border-cyan-300 bg-gradient-to-r from-cyan-50 to-emerald-50 shadow-lg scale-[1.02]'
                        : isSelected 
                          ? 'border-emerald-200 bg-white shadow-lg shadow-emerald-100/50 scale-[1.01]' 
                          : 'border-white/60 bg-white/60 hover:bg-white hover:border-emerald-100'
                      }
                    `}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`
                        w-11 h-11 rounded-2xl flex items-center justify-center text-xl
                        ${isHovered || isSelected ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}
                      `}>
                        {info.icon}
                      </div>
                      <div>
                        <div className="text-sm font-black text-slate-700">{info.name}</div>
                        <p className="text-[10px] text-slate-400 font-medium">{info.description}</p>
                      </div>
                    </div>
                    {isSelected && <span className="text-emerald-500 text-lg">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
        
        {/* ===== Tab: Manual Interaction ===== */}
        {activeTab === 'manual' && (
          <div className="space-y-8 animate-slideUp">
             {/* Locked Configuration for Manual Click */}
             <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-sm space-y-5">
                <div className="flex items-center gap-3 mb-2">
                   <div className="p-2 bg-orange-100 text-orange-500 rounded-lg text-lg">👇</div>
                   <div>
                      <h3 className="text-sm font-black text-slate-800">点击交互配置</h3>
                      <p className="text-[10px] text-slate-400 font-bold">配置鼠标点击空白处时的发射行为</p>
                   </div>
                </div>

                {/* 1. 发射队形与数量 */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label text="发射队形" />
                      <CustomSelect 
                         value={manualConfig.lockedFormation || LaunchFormation.SINGLE}
                         onChange={v => onUpdateManual({ ...manualConfig, lockedFormation: v as LaunchFormation })}
                         options={Object.values(LaunchFormation).map(f => ({ label: f, value: f }))}
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label text="单次数量" />
                      <div className="h-10 flex items-center bg-white/50 rounded-xl px-2 border border-white/50">
                         <input 
                           type="range" min="1" max="20" step="1" 
                           value={manualConfig.lockedCount || 1}
                           onChange={e => onUpdateManual({ ...manualConfig, lockedCount: parseInt(e.target.value) })}
                           className="w-full h-1.5 bg-gray-200 rounded-full appearance-none accent-orange-500 cursor-pointer"
                         />
                         <span className="ml-2 text-xs font-black min-w-[20px] text-right">{manualConfig.lockedCount || 1}</span>
                      </div>
                   </div>
                </div>

                {/* 2. 形状与轨迹锁定 - 使用带预览的 Select */}
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1.5">
                      <Label text="锁定形状 (Hover Preview)" />
                      <CustomSelectWithPreview 
                         value={manualConfig.lockedShape as string}
                         onChange={v => onUpdateManual({ ...manualConfig, lockedShape: v as any })}
                         options={[{ label: '🎲 随机', value: 'RANDOM' }, ...Object.values(Shape3DType).map(s => ({ label: SHAPE_3D_INFO[s].name, value: s }))]}
                         previewType="shape"
                         placeholder="随机"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <Label text="锁定轨迹 (Hover Preview)" />
                      <CustomSelectWithPreview 
                         value={manualConfig.lockedTrajectory as string}
                         onChange={v => onUpdateManual({ ...manualConfig, lockedTrajectory: v as any })}
                         options={[{ label: '🎲 随机', value: 'RANDOM' }, ...Object.values(TrajectoryType).map(t => ({ label: TRAJECTORY_INFO[t].name, value: t }))]}
                         previewType="trajectory"
                         placeholder="随机"
                      />
                   </div>
                </div>

                {/* 3. 高级参数 */}
                 <div className="space-y-4 pt-4 border-t border-gray-100">
                    <Label text="高级参数 (Advanced)" />
                    <div className="grid grid-cols-2 gap-4">
                       <Slider label="发射间隔 (ms)" value={manualConfig.lockedInterval || 0} min={0} max={500} step={10} onChange={v => onUpdateManual({ ...manualConfig, lockedInterval: v })} color="orange" />
                       <Slider label="存续时间 (s)" value={manualConfig.lockedDuration || 0} min={0} max={10} step={0.5} unit="s" onChange={v => onUpdateManual({ ...manualConfig, lockedDuration: v })} color="orange" />
                    </div>
                </div>
             </div>
          </div>
        )}
        
        {/* ===== Tab: Carnival ===== */}
        {activeTab === 'carnival' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-6 rounded-[32px] shadow-2xl text-white relative overflow-hidden group">
               {/* Background Glow */}
               <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/20 transition-all duration-1000" />
               
               <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-black tracking-tight">大秀编排</h3>
                      <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-1">Direct Your Masterpiece</p>
                    </div>
                   <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2 bg-black/20 backdrop-blur rounded-full px-1 py-1">
                         <label className="text-[9px] font-black px-3 uppercase opacity-80">Auto Loop</label>
                         <ToggleSwitch checked={settings.enableAutoCarnival} onChange={v => onUpdate('enableAutoCarnival', v)} color="emerald" customClass="scale-75 origin-right" />
                      </div>
                      {/* 自动播放间隔控制 */}
                      {settings.enableAutoCarnival && (
                        <div className="flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-2 py-1 animate-slideUp">
                           <span className="text-[9px] font-bold opacity-70">Interval</span>
                           <input 
                             type="range" min="1" max="10" step="1" 
                             value={settings.carnivalInterval} 
                             onChange={e => onUpdate('carnivalInterval', parseFloat(e.target.value))}
                             className="w-16 h-1 bg-white/30 rounded-full appearance-none accent-white cursor-pointer"
                           />
                           <span className="text-[9px] font-bold w-4">{settings.carnivalInterval}s</span>
                        </div>
                      )}
                   </div>
                  </div>
                  
                  <div className="flex gap-3">
                     <button 
                       onClick={handleApplySequence}
                       disabled={!hasChanges}
                       className={`
                          flex-1 py-3 rounded-2xl text-xs font-black transition-all border
                          ${hasChanges ? 'bg-white text-indigo-600 border-white shadow-lg' : 'bg-black/20 text-white/40 border-transparent cursor-not-allowed'}
                       `}
                     >
                       {hasChanges ? '✓ 同步剧本' : '已同步'}
                     </button>
                     <button 
                       onClick={onLaunchCarnival}
                       className="flex-[2] py-3 bg-white text-slate-900 rounded-2xl text-xs font-black shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                        <span>🎬</span> 立即启动大秀
                     </button>
                  </div>
               </div>
            </div>

            <div className="space-y-3 pb-20">
              <div className="flex justify-between items-end px-2">
                 <Label text="WAVE SEQUENCE" />
                 <button
                    onClick={() => {
                      const id = Math.random().toString(36).substr(2, 9);
                      handleUpdateLocal([...localSeq, { id, name: `Wave ${localSeq.length + 1}`, count: 8, trajectory: TrajectoryType.SPIRAL, shape: Shape3DType.SPHERE, combo: ComboType.SINGLE, delay: 2000, formation: LaunchFormation.CIRCLE, interval: 100, duration: 0 }]);
                    }}
                    className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
                  >
                    + 添加波次
                  </button>
              </div>

              {localSeq.map((stage, idx) => (
                <div key={stage.id} className="bg-white p-5 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 group">
                  <div className="flex justify-between items-center text-[12px] font-black text-slate-700">
                    <div className="flex items-center gap-3 flex-1">
                       <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 font-mono">{idx+1}</div>
                       <input 
                          value={stage.name} 
                          onChange={e => {
                            const next = [...localSeq];
                            next[idx] = { ...stage, name: e.target.value };
                            handleUpdateLocal(next);
                          }} 
                          className="bg-transparent outline-none w-full hover:bg-slate-50 focus:bg-slate-50 px-2 rounded transition-colors" 
                       />
                    </div>
                    <button onClick={() => {
                      const next = [...localSeq];
                      next.splice(idx, 1);
                      handleUpdateLocal(next);
                    }} className="text-gray-200 hover:text-red-400 text-lg px-2">×</button>
                  </div>
                  
                  {/* 主要参数 - 使用带预览的 Select */}
                  <div className="grid grid-cols-2 gap-3">
                     <CustomSelectWithPreview
                        value={stage.trajectory}
                        onChange={v => {
                          const next = [...localSeq];
                          next[idx] = { ...stage, trajectory: v as any };
                          handleUpdateLocal(next);
                        }}
                        options={[
                          { label: '🎲 随机轨迹', value: 'RANDOM' },
                          ...Object.values(TrajectoryType).map(t => ({ label: TRAJECTORY_INFO[t].name, value: t }))
                        ]}
                        previewType="trajectory"
                        placeholder="选择轨迹"
                     />
                     <CustomSelectWithPreview
                        value={stage.shape}
                        onChange={v => {
                          const next = [...localSeq];
                          next[idx] = { ...stage, shape: v as any };
                          handleUpdateLocal(next);
                        }}
                        options={[
                          { label: '🎲 随机形状', value: 'RANDOM' },
                          ...Object.values(Shape3DType).map(s => ({ label: SHAPE_3D_INFO[s].name, value: s }))
                        ]}
                        previewType="shape"
                        placeholder="选择形状"
                     />
                  </div>
                  
                  {/* 详细参数区 - 默认显示简单的 Grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-3 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="col-span-2">
                        <Label text="LAUNCH FORMATION" />
                        <CustomSelect
                          value={stage.formation || LaunchFormation.RANDOM}
                          onChange={v => {
                             const next = [...localSeq];
                             next[idx] = { ...stage, formation: v as any };
                             handleUpdateLocal(next);
                          }}
                          options={Object.values(LaunchFormation).map(f => ({ label: f, value: f }))}
                        />
                      </div>
                      <Slider label="数量" value={stage.count} min={1} max={50} step={1} onChange={v => {
                         const next = [...localSeq]; next[idx] = { ...stage, count: v }; handleUpdateLocal(next);
                      }} />
                      <Slider label="波次延迟 (ms)" value={stage.delay} min={0} max={5000} step={100} onChange={v => {
                         const next = [...localSeq]; next[idx] = { ...stage, delay: v }; handleUpdateLocal(next);
                      }} />
                      <Slider label="间隔 (ms)" value={stage.interval || 0} min={0} max={500} step={10} onChange={v => {
                         const next = [...localSeq]; next[idx] = { ...stage, interval: v }; handleUpdateLocal(next);
                      }} />
                      <Slider label="存续 (s)" value={stage.duration || 0} min={0} max={10} step={0.5} onChange={v => {
                         const next = [...localSeq]; next[idx] = { ...stage, duration: v }; handleUpdateLocal(next);
                      }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* ===== Tab: Physics ===== */}
        {activeTab === 'physics' && (
          <div className="space-y-6">
            <div className="bg-white/60 p-6 rounded-[32px] border border-white space-y-6">
               <h3 className="text-sm font-black text-slate-800">Global Physics</h3>
               <Slider label="Gravity (重力)" value={settings.gravity} min={0.01} max={0.3} step={0.01} onChange={v => onUpdate('gravity', v)} />
               <Slider label="Air Resistance (阻力)" value={settings.friction} min={0.85} max={0.99} step={0.01} onChange={v => onUpdate('friction', v)} />
               <Slider label="Particle Density (密度)" value={settings.particleCountMultiplier} min={0.1} max={3.0} step={0.1} unit="x" onChange={v => onUpdate('particleCountMultiplier', v)} />
               <Slider label="Explosion Scale (规模)" value={settings.explosionSizeMultiplier} min={0.1} max={100} step={0.1} unit="x" onChange={v => onUpdate('explosionSizeMultiplier', v)} />
            </div>
          </div>
        )}
      </div>

      {/* ========== Footer ========== */}
      <div className="p-4 border-t border-white/60 bg-white/60 backdrop-blur flex gap-3 z-50 shadow-inner">
        <button onClick={onRandomize} className="flex-1 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-emerald-600 transition-all shadow-lg hover:shadow-emerald-500/30">🎲 Randomize Physics</button>
        <button onClick={onReset} className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 text-xs font-bold hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all">Reset All</button>
      </div>
    </div>
  );
};

// ========== Subcomponents ========== //

const Label: React.FC<{ text: string }> = ({ text }) => (
   <div className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5">{text}</div>
);

const Slider: React.FC<{ label: string, value: number, min: number, max: number, step: number, unit?: string, onChange: (v: number) => void, color?: string }> = ({ label, value, min, max, step, unit = '', onChange, color = 'indigo' }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center text-[10px]">
      <span className="font-bold text-slate-500">{label}</span>
      <span className="font-black text-slate-700 bg-white/50 px-1.5 py-0.5 rounded border border-white">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className={`w-full h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer accent-${color}-500 hover:accent-${color}-400 transition-all`} />
  </div>
);

const ToggleSwitch: React.FC<{ checked: boolean, onChange: (v: boolean) => void, color?: string, customClass?: string }> = ({ checked, onChange, color = 'emerald', customClass = '' }) => (
  <button onClick={() => onChange(!checked)} className={`w-10 h-6 rounded-full transition-all duration-300 relative border border-transparent ${checked ? `bg-${color}-500 shadow-inner` : 'bg-slate-300'} ${customClass}`}>
    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-md transition-all duration-300 ${checked ? 'left-5' : 'left-1'}`} />
  </button>
);
