// FILE: src/components/ui/TimelinePanel.tsx
// 时间线面板组件 - 可视化时间轴、关键帧、拖动跳转

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { TimelineManager, TimelineKeyframe, timelineManager } from '../../core/timeline/TimelineManager';

interface TimelinePanelProps {
  className?: string;
  logs?: Array<{ time: number; message: string; type: 'launch' | 'explosion' | 'carnival' }>;
  onSeek?: (time: number) => void;
}

/**
 * 时间线面板
 * 功能：
 * 1. 可视化时间轴 (0-100%)
 * 2. 关键帧标记点
 * 3. 拖动滑块跳转
 * 4. 播放/暂停/时间缩放控制
 * 5. 日志事件显示
 */
export const TimelinePanel: React.FC<TimelinePanelProps> = ({
  className = '',
  logs = [],
  onSeek
}) => {
  const [state, setState] = useState(timelineManager.getState());
  const [isDragging, setIsDragging] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 订阅时间变化
  useEffect(() => {
    const unsubscribe = timelineManager.onTimeChange((time) => {
      setState(timelineManager.getState());
    });
    
    // 初始状态
    setState(timelineManager.getState());
    
    return unsubscribe;
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 避免在输入框中触发
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          timelineManager.nudge(-0.5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          timelineManager.nudge(0.5);
          break;
        case 'Home':
          e.preventDefault();
          timelineManager.seekTo(0);
          break;
        case 'End':
          e.preventDefault();
          timelineManager.seekTo(timelineManager.getDuration());
          break;
        case ' ':
          e.preventDefault();
          timelineManager.togglePlay();
          setState(timelineManager.getState());
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 拖动处理
  const handleTrackClick = useCallback((e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    timelineManager.seekToProgress(progress);
    onSeek?.(progress * state.duration);
  }, [state.duration, onSeek]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    handleTrackClick(e);
  }, [handleTrackClick]);

  useEffect(() => {
    if (!isDragging) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!trackRef.current) return;
      const rect = trackRef.current.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      timelineManager.seekToProgress(progress);
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;

  // 时间倍率选项
  const timeScales = [0.25, 0.5, 1, 2, 5, 10];

  return (
    <div className={`
      bg-white/90 backdrop-blur-xl 
      border border-white/60 rounded-2xl 
      shadow-xl shadow-slate-200/30
      p-4 select-none
      ${className}
    `}>
      {/* 顶部控制栏 */}
      <div className="flex items-center justify-between mb-3">
        {/* 播放控制 */}
        <div className="flex items-center gap-2">
          {/* 播放/暂停 */}
          <button
            onClick={() => {
              timelineManager.togglePlay();
              setState(timelineManager.getState());
            }}
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              transition-all duration-200
              ${state.isPlaying 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }
            `}
            title={state.isPlaying ? '暂停 (Space)' : '播放 (Space)'}
          >
            {state.isPlaying ? (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* 跳转按钮 */}
          <button
            onClick={() => timelineManager.seekTo(0)}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
            title="回到开始 (Home)"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>

          <button
            onClick={() => timelineManager.jumpToPrevKeyframe()}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
            title="上一关键帧"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 16.59L10.83 12l4.58-4.59L14 6l-6 6 6 6z" />
            </svg>
          </button>

          <button
            onClick={() => timelineManager.jumpToNextKeyframe()}
            className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
            title="下一关键帧"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
            </svg>
          </button>
        </div>

        {/* 时间显示 */}
        <div className="text-center">
          <div className="text-lg font-mono font-bold text-slate-800">
            {formatTime(state.currentTime)}
          </div>
          <div className="text-[9px] text-slate-400 font-medium">
            / {formatTime(state.duration)}
          </div>
        </div>

        {/* 时间倍率 */}
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-slate-400 mr-1">速度</span>
          {timeScales.map(scale => (
            <button
              key={scale}
              onClick={() => {
                timelineManager.setTimeScale(scale);
                setState(timelineManager.getState());
              }}
              className={`
                px-2 py-1 rounded-lg text-[10px] font-bold transition-all
                ${state.timeScale === scale 
                  ? 'bg-emerald-500 text-white shadow-md' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }
              `}
            >
              {scale}x
            </button>
          ))}
        </div>
      </div>

      {/* 时间轴轨道 */}
      <div 
        ref={trackRef}
        className={`
          relative h-8 bg-slate-100 rounded-xl cursor-pointer
          border border-slate-200
          ${isDragging ? 'ring-2 ring-emerald-500/50' : ''}
        `}
        onMouseDown={handleMouseDown}
      >
        {/* 进度条 */}
        <div 
          className="absolute left-0 top-0 h-full bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-xl transition-all duration-75"
          style={{ width: `${progress}%` }}
        />

        {/* 关键帧标记 */}
        {state.keyframes.map(kf => {
          const pos = (kf.time / state.duration) * 100;
          return (
            <div
              key={kf.id}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 group"
              style={{ left: `${pos}%` }}
              title={`${kf.label} (${formatTime(kf.time)})`}
            >
              <div
                className={`
                  w-3 h-3 rounded-full border-2 border-white shadow-sm cursor-pointer
                  transition-transform hover:scale-150
                `}
                style={{ backgroundColor: kf.color }}
                onClick={(e) => {
                  e.stopPropagation();
                  timelineManager.seekTo(kf.time);
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="bg-slate-900 text-white text-[9px] px-2 py-1 rounded-lg whitespace-nowrap">
                  {kf.label}
                </div>
              </div>
            </div>
          );
        })}

        {/* 当前时间指针 */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg border-2 border-emerald-500 -translate-x-1/2 z-20"
          style={{ left: `${progress}%` }}
        />

        {/* 时间刻度 */}
        <div className="absolute inset-0 flex items-end pb-1 px-2 pointer-events-none">
          {[0, 25, 50, 75, 100].map(pct => (
            <div 
              key={pct}
              className="absolute text-[8px] text-slate-400 font-mono"
              style={{ left: `${pct}%`, transform: 'translateX(-50%)' }}
            >
              {formatTime((pct / 100) * state.duration)}
            </div>
          ))}
        </div>
      </div>

      {/* 日志区域 (可折叠) */}
      {logs.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-2 text-[10px] font-bold text-slate-500 hover:text-slate-700 transition-colors"
          >
            <span className={`transition-transform ${showLogs ? 'rotate-90' : ''}`}>▶</span>
            事件日志 ({logs.length})
          </button>
          
          {showLogs && (
            <div className="mt-2 max-h-32 overflow-y-auto space-y-1 custom-scrollbar">
              {logs.slice(-10).reverse().map((log, i) => (
                <button
                  key={i}
                  onClick={() => timelineManager.seekTo(log.time)}
                  className="w-full text-left p-2 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <span className={`w-2 h-2 rounded-full ${
                    log.type === 'launch' ? 'bg-emerald-500' :
                    log.type === 'explosion' ? 'bg-orange-500' :
                    'bg-purple-500'
                  }`} />
                  <span className="text-[9px] font-mono text-slate-400 w-12">
                    {formatTime(log.time)}
                  </span>
                  <span className="text-[10px] text-slate-600 truncate">
                    {log.message}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// END OF FILE: src/components/ui/TimelinePanel.tsx
