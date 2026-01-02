// FILE: src/components/ui/CustomSelect.tsx
// 自定义下拉选择框 - 彻底替代原生丑陋的 select
// 视觉风格：液态玻璃，悬浮菜单，精致动画

import React, { useState, useRef, useEffect } from "react";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  value: string;
  options: Option[];
  onChange: (value: string) => void;
  icon?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  options,
  onChange,
  icon,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 查找当前选中的 label
  const selectedLabel = options.find((o) => o.value === value)?.label || value;

  // 点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative group ${className}`} ref={containerRef}>
      {/* 触发按钮 */}
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
          ${
            isOpen
              ? "border-emerald-400 bg-white/80 ring-2 ring-emerald-500/20"
              : ""
          }
        `}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && <span className="text-lg opacity-80">{icon}</span>}
          <span className="truncate">{selectedLabel}</span>
        </div>
        <div
          className={`
           text-[8px] text-slate-400 transition-transform duration-300 ml-2
           ${
             isOpen
               ? "rotate-180 text-emerald-500"
               : "group-hover:text-emerald-400"
           }
        `}
        >
          ▼
        </div>
      </button>

      {/* 下拉菜单 (Portal like behavior but simplified for this context, assume z-index is high enough) */}
      <div
        className={`
          absolute left-0 right-0 top-full mt-2
          bg-white/90 backdrop-blur-xl
          border border-white/60 rounded-xl
          shadow-xl shadow-slate-200/50
          max-h-60 overflow-y-auto custom-scrollbar
          z-50 transform origin-top transition-all duration-200 cubic-bezier(0.2, 0.8, 0.2, 1)
          ${
            isOpen
              ? "opacity-100 scale-100 translate-y-0 visible"
              : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none"
          }
        `}
      >
        <div className="p-1.5 space-y-0.5">
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`
                  w-full text-left px-3 py-2 rounded-lg text-[10px] font-bold transition-all
                  flex items-center justify-between
                  ${
                    isSelected
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }
                `}
              >
                <span>{option.label}</span>
                {isSelected && <span className="text-emerald-500">✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
