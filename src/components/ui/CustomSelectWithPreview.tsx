// FILE: src/components/ui/CustomSelectWithPreview.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ShapePreview3D } from './ShapePreviewCard';
import { TrajectoryPreviewCanvas } from './TrajectoryPreview3D';
import { Shape3DType, SHAPE_3D_INFO } from '../../core/shapes/Shape3DFactory';
import { TrajectoryType, TRAJECTORY_INFO } from '../../core/trajectories/TrajectoryFactory';

interface Option {
  label: string;
  value: string;
  icon?: string;
}

type PreviewType = 'shape' | 'trajectory' | 'none';

interface CustomSelectWithPreviewProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  previewType: PreviewType;
  icon?: string;
  className?: string;
  placeholder?: string;
}

/**
 * 下拉选择组件 (带 Portal 悬浮预览)
 * - 预览框使用 Portal 渲染到 body，彻底解决 overflow 裁剪问题
 * - 智能计算位置，始终跟随鼠标/选项位置
 */
export const CustomSelectWithPreview: React.FC<CustomSelectWithPreviewProps> = ({
  value,
  options,
  onChange,
  previewType,
  icon,
  className = '',
  placeholder = '选择...'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredValue, setHoveredValue] = useState<string | null>(null);
  const [previewPos, setPreviewPos] = useState<{ top: number; left: number; side: 'left' | 'right' } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 选中项回显
  const selectedOption = options.find(o => o.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 如果点击的是 Portal 内部元素，也不处理 (虽然 Portal 在 body，但事件冒泡...)
      // 这里简化：只要不是点击 containerRef 内部，就关闭
      // 注意：Portal 里的事件会冒泡到 React 树的父级，所以要判断
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setHoveredValue(null);
        setPreviewPos(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = useCallback((optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setHoveredValue(null);
    setPreviewPos(null);
  }, [onChange]);

  // 处理选项悬停：计算并设置预览框位置
  const handleOptionHover = (e: React.MouseEvent<HTMLButtonElement>, val: string) => {
    setHoveredValue(val);
    
    // 获取当前选项的位置
    const rect = e.currentTarget.getBoundingClientRect();
    const PREVIEW_SIZE = 200; // 预览框大概尺寸
    const GAP = 10;
    
    let left = rect.right + GAP;
    let side: 'left' | 'right' = 'right';

    // 智能判断左右：如果右边放不下，就放左边
    if (left + PREVIEW_SIZE > window.innerWidth) {
        left = rect.left - PREVIEW_SIZE - GAP;
        side = 'left';
    }

    // 垂直对齐：尽量居中于选项，但不能超出屏幕
    let top = rect.top + rect.height/2 - PREVIEW_SIZE/2;
    if (top < 10) top = 10;
    if (top + PREVIEW_SIZE > window.innerHeight) top = window.innerHeight - PREVIEW_SIZE - 10;

    setPreviewPos({ top, left, side });
  };

  const clearHover = () => {
    setHoveredValue(null);
    setPreviewPos(null);
  };

  const previewValue = hoveredValue || value;
  const showPreview = isOpen && previewType !== 'none' && previewValue && previewValue !== 'RANDOM' && previewPos;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* 触发器 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-full flex items-center justify-between
          px-3 py-2.5 rounded-xl
          bg-white/40 backdrop-blur-md
          border border-white/60
          text-[10px] font-black text-slate-700
          shadow-sm transition-all duration-300
          hover:bg-white/60 hover:border-emerald-300 hover:shadow-emerald-100/30
          focus:outline-none focus:ring-2 focus:ring-emerald-500/20
          ${isOpen 
            ? 'border-emerald-400 bg-white/80 ring-2 ring-emerald-500/20' 
            : ''
          }
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-lg opacity-80">{icon}</span>}
          <span className="truncate">{selectedLabel}</span>
        </div>
        <div className={`
          text-[8px] text-slate-400 transition-transform duration-300 ml-2
          ${isOpen ? 'rotate-180 text-emerald-500' : 'group-hover:text-emerald-400'}
        `}>▼</div>
      </button>

      {/* 下拉菜单 (绝对定位) */}
      <div className={`
        absolute left-0 top-full mt-2 w-full z-50
        transform origin-top transition-all duration-200
        ${isOpen 
          ? 'opacity-100 scale-100 translate-y-0 visible' 
          : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'
        }
      `}>
        <div className="
          bg-white/95 backdrop-blur-xl
          border border-white/70 rounded-2xl
          shadow-2xl shadow-slate-300/30
          max-h-72 overflow-y-auto custom-scrollbar
        ">
          <div className="p-1.5 space-y-0.5">
            {options.map(option => {
              const isSelected = option.value === value;
              const isHovered = option.value === hoveredValue;
              
              return (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={(e) => handleOptionHover(e, option.value)}
                  // onMouseLeave={clearHover} // 不需要，保持最后一次悬停
                  className={`
                    w-full text-left px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all
                    flex items-center justify-between gap-2
                    ${isHovered 
                      ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 text-emerald-700 scale-[1.02] shadow-sm' 
                      : isSelected 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }
                  `}
                >
                  <span className="flex items-center gap-2">
                    {option.icon && <span className="text-base">{option.icon}</span>}
                    <span>{option.label}</span>
                  </span>
                  {isSelected && <span className="text-emerald-500 text-sm">✓</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 悬浮预览框 (Portal) */}
      {showPreview && createPortal(
        <div 
          className="fixed z-[9999] pointer-events-none w-48 h-48 animate-slideInFade"
          style={{
             top: previewPos.top,
             left: previewPos.left,
          }}
        >
          <div className="
            w-full h-full bg-slate-900/95 backdrop-blur-2xl
            border border-emerald-500/30 rounded-2xl
            shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)]
            overflow-hidden relative
          ">
            {previewType === 'shape' && (
              <ShapePreview3D 
                shapeType={previewValue as Shape3DType} 
                className="w-full h-full"
              />
            )}
            {previewType === 'trajectory' && (
              <TrajectoryPreviewCanvas
                trajectoryType={previewValue as TrajectoryType}
                className="w-full h-full"
              />
            )}
            
            {/* 标签 */}
            <div className="absolute bottom-3 left-0 right-0 flex justify-center">
               <div className="bg-black/50 backdrop-blur px-3 py-1 rounded-full border border-white/10">
                 <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">
                   {previewType === 'shape' && SHAPE_3D_INFO[previewValue as Shape3DType]?.name}
                   {previewType === 'trajectory' && TRAJECTORY_INFO[previewValue as TrajectoryType]?.name}
                 </span>
               </div>
            </div>
          </div>
        </div>,
        document.body
      )}
      
      <style>{`
        @keyframes slideInFade {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-slideInFade { animation: slideInFade 0.15s ease-out forwards; }
      `}</style>
    </div>
  );
};
