// FILE: src/components/ui/HUD3D.tsx

import React from 'react';

export const HUD3D: React.FC = () => {
    return (
        <>
            {/* 头部信息 - 浅色极简风格 */}
            <div className="absolute top-8 left-8 z-10 pointer-events-none select-none">
                <div className="flex items-center gap-4">
                    <div className="w-1.5 h-12 bg-gradient-to-b from-gray-800 to-gray-400 rounded-full"></div>
                    <div>
                        <h1 className="text-4xl font-black tracking-tight text-gray-800">
                            Celestial <span className="text-gray-400 font-light">Fireworks</span>
                        </h1>
                        <p className="text-[10px] text-gray-500 tracking-[0.4em] font-medium uppercase mt-1">
                            Interactive 3D Simulation
                        </p>
                    </div>
                </div>
            </div>

            {/* 右下互动提示 - 卡片式设计 */}
            <div className="absolute bottom-8 right-8 pointer-events-none">
                <div className="bg-white/80 backdrop-blur-md p-5 rounded-2xl shadow-lg border border-white/50 text-gray-600">
                    <p className="text-gray-900 font-bold text-xs mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-400"></span>
                        CONTROL GUIDE
                    </p>
                    <div className="space-y-1.5 text-[10px] font-medium tracking-wide">
                        <div className="flex justify-between w-40">
                            <span>Rotate View</span>
                            <span className="font-bold bg-gray-200 px-1.5 rounded text-gray-700">LMB / Drag</span>
                        </div>
                        <div className="flex justify-between w-40">
                            <span>Launch</span>
                            <span className="font-bold bg-gray-200 px-1.5 rounded text-gray-700">Click Ground</span>
                        </div>
                        <div className="flex justify-between w-40">
                            <span>Zoom</span>
                            <span className="font-bold bg-gray-200 px-1.5 rounded text-gray-700">Scroll</span>
                        </div>
                        <div className="flex justify-between w-40 mt-2 pt-2 border-t border-gray-200">
                            <span>Pause / Play</span>
                            <span className="font-bold bg-gray-200 px-1.5 rounded text-gray-700">P</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 底部装饰线 */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-50 pointer-events-none"></div>
        </>
    );
};

// END OF FILE: src/components/ui/HUD3D.tsx