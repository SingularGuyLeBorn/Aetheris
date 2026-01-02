// FILE: src/components/ui/TutorialOverlay.tsx
// 引导教程覆盖层 - 帮助用户了解如何使用模拟器 (增强版)

import React, { useState, useEffect } from 'react';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  position: 'center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'top-left';
  highlight?: string; // CSS selector to highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'welcome',
    title: '欢迎来到 Aetheris ✨',
    description: '这是一个探索光与物理的 3D 粒子工坊。在这里，您可以指挥星系诞生，编排烟花大秀，体验纯粹的视觉艺术。',
    icon: '🎆',
    position: 'center'
  },
  {
    id: 'basic-nav',
    title: '基本交互',
    description: '🖱️ 左键拖动：旋转视角\n🖱️ 右键拖动：平移视角\n🖱️ 滚轮：缩放距离\n👆 点击任意空白处：在该位置发射一朵烟花！',
    icon: '🎮',
    position: 'center'
  },
  {
    id: 'workshop',
    title: '创意工坊 (Workshop)',
    description: '右上角的【创意工坊】是您的创造中心。在这里您可以：\n- 挑选几十种高级 3D 形状 (克莱因瓶、爱心、螺旋...)\n- 预览并选择独特的上升轨迹\n- 编排自动化的烟花大秀剧本',
    icon: '🎨',
    position: 'top-right'
  },
  {
    id: 'trajectory-preview',
    title: '全新！轨迹预览',
    description: '进入创意工坊的“上升轨迹”面板，将鼠标悬浮在轨迹卡片上，即可看到逼真的 3D 路径动态预览！所见即所得。',
    icon: '🚀',
    position: 'top-right'
  },
  {
    id: 'time-control',
    title: '时空控制台',
    description: '底部的控制面板让您成为时间的魔法师。\n⏸️ 暂停时间：定格爆炸瞬间\n⏪ 慢动作：以 0.1x 速度欣赏每一个粒子的绽放\n🔄 自动旋转：开启沉浸式环绕视角',
    icon: '⏳',
    position: 'bottom-center'
  },
  {
    id: 'carnival',
    title: '大秀与交互',
    description: '想要更震撼的体验？在工坊中查找“大秀编排”，一键启动经过精心设计的烟花交响乐。您也可以自定义交互剧本，让每一次点击都充满惊喜。',
    icon: '🎭',
    position: 'top-right'
  },
  {
    id: 'ready',
    title: '开始创造！',
    description: '舞台已为您就绪。去点亮这片夜空吧！\n(提示：点击设置面板外部的空白区域可快速关闭面板)',
    icon: '✨',
    position: 'center'
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
}

export const useTutorial = () => {
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem('aetheris_tutorial_seen_v2');
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem('aetheris_tutorial_seen_v2', 'true');
    setShowTutorial(false);
  };

  const resetTutorial = () => {
    localStorage.removeItem('aetheris_tutorial_seen_v2');
    setShowTutorial(true);
  };

  return { showTutorial, completeTutorial, resetTutorial };
};

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  
  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const progress = ((currentStep + 1) / TUTORIAL_STEPS.length) * 100;
  
  const handleNext = () => {
    if (isLastStep) {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };
  
  const handleSkip = () => {
    setIsVisible(false);
    setTimeout(onComplete, 300);
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };
  
  // 获取位置样式
  const getPositionStyles = () => {
    switch (step.position) {
      case 'top-right':
        return 'top-24 right-8';
      case 'top-left':
        return 'top-24 left-8';
      case 'bottom-left':
        return 'bottom-24 left-8';
      case 'bottom-center':
        return 'bottom-32 left-1/2 -translate-x-1/2';
      default:
        return 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2';
    }
  };
  
  return (
    <div 
      className={`
        fixed inset-0 z-[100] transition-opacity duration-300
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      {/* 教程卡片 */}
      <div className={`absolute ${getPositionStyles()} w-[420px] max-w-[90vw] transition-all duration-500 ease-out`}>
        <div className="bg-white/90 backdrop-blur-xl rounded-[32px] shadow-2xl overflow-hidden border border-white/40 ring-1 ring-white/50 animate-slideUp">
          {/* 进度条 */}
          <div className="h-1.5 bg-gray-100/50">
            <div 
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* 内容 */}
          <div className="p-8">
            {/* 图标和标题 */}
            <div className="flex items-start gap-5 mb-6">
              <div className="w-16 h-16 shrink-0 rounded-2xl bg-gradient-to-br from-white to-emerald-50 border border-emerald-100/50 flex items-center justify-center text-4xl shadow-lg shadow-emerald-100">
                {step.icon}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-800 tracking-tight mb-1">{step.title}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Step {currentStep + 1} of {TUTORIAL_STEPS.length}</p>
              </div>
            </div>
            
            {/* 描述 */}
            <div className="text-gray-600 text-sm leading-relaxed mb-8 whitespace-pre-line font-medium p-4 bg-white/50 rounded-2xl border border-white/50">
              {step.description}
            </div>
            
            {/* 步骤指示器 */}
            <div className="flex justify-center gap-2 mb-8">
              {TUTORIAL_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`
                    h-2 rounded-full transition-all duration-300
                    ${idx === currentStep 
                      ? 'bg-emerald-500 w-8 shadow-sm' 
                      : idx < currentStep 
                        ? 'bg-emerald-200 w-2' 
                        : 'bg-gray-200 w-2'
                    }
                  `}
                />
              ))}
            </div>
            
            {/* 按钮 */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-5 py-3 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold hover:bg-gray-200 transition-all"
                >
                  ← 返回
                </button>
              )}
              
              <button
                onClick={handleSkip}
                className="px-5 py-3 rounded-xl text-gray-400 text-xs font-bold hover:text-gray-600 hover:bg-gray-50 transition-all ml-auto"
              >
                跳过
              </button>
              
              <button
                onClick={handleNext}
                className="
                  px-8 py-3 rounded-xl text-xs font-black
                  bg-gradient-to-r from-emerald-500 to-teal-500 text-white
                  hover:from-emerald-600 hover:to-teal-600
                  shadow-lg shadow-emerald-200/50
                  transition-all hover:scale-105 active:scale-95
                  flex items-center gap-2
                "
              >
                {isLastStep ? '开始体验 🎉' : '下一步 →'}
              </button>
            </div>
          </div>
        </div>
        
        {/* 指示光晕 - 仅作为装饰 */}
        <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl -z-10 rounded-full opacity-0 animate-pulse" />
      </div>
      
      {/* 快捷键提示条 */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-6 text-white/50 text-[10px] font-mono tracking-wider backdrop-blur px-6 py-2 rounded-full bg-black/20 border border-white/10">
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 text-white">Left Click</kbd>
          <span>Rotate</span>
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 text-white">Right Click</kbd>
          <span>Pan</span>
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="px-1.5 py-0.5 bg-white/10 rounded border border-white/10 text-white">Scroll</kbd>
          <span>Zoom</span>
        </span>
      </div>
    </div>
  );
};
