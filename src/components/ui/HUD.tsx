
import React from 'react';

export const HUD: React.FC = () => {
  return (
    <>
      {/* 头部信息 */}
      <div className="absolute top-10 left-10 z-10 pointer-events-none">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-1.5 h-12 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(6,182,212,1)] animate-pulse"></div>
          <div>
            <h1 className="text-5xl font-black tracking-tighter italic leading-none">
              璀璨<span className="text-cyan-400">星辰</span> V4
            </h1>
            <p className="text-[10px] text-cyan-500/50 tracking-[0.5em] font-bold uppercase mt-1">
              Deep Space Particle System • Pro Edition
            </p>
          </div>
        </div>
      </div>

      {/* 底部浮标 */}
      <footer className="absolute bottom-10 left-0 right-0 flex justify-center items-center gap-12 pointer-events-none opacity-20">
        <div className="h-[1px] w-40 bg-gradient-to-r from-transparent via-white/40 to-transparent"></div>
        <div className="text-[10px] text-white uppercase tracking-[1em] font-light flex gap-8">
          <span>行星</span><span>蒲公英</span><span>萤火虫</span><span>土星环</span><span>星芒</span><span>波浪</span>
        </div>
        <div className="h-[1px] w-40 bg-gradient-to-l from-transparent via-white/40 to-transparent"></div>
      </footer>

      {/* 互动提示 */}
      <div className="absolute bottom-10 left-10 text-[9px] text-white/30 tracking-[0.2em] font-medium pointer-events-none space-y-1">
        <p>• 点击/触摸发射</p>
        <p>• 长按蓄力大招</p>
        <p>• 移动鼠标产生星尘</p>
      </div>

      <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 via-transparent to-transparent pointer-events-none"></div>
    </>
  );
};
