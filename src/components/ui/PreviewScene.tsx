// FILE: src/components/ui/PreviewScene.tsx

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ExplosionType, ColorStyle } from '../../types';
import { Firework3D } from '../../core/Firework3D';
import { ParticlePool3D } from '../../core/ParticlePool3D';

interface PreviewSceneProps {
    shape: ExplosionType;
    colorStyle: ColorStyle;
}

/**
 * 一个超轻量级的 3D 预览组件，用于在配置面板中展示烟花效果
 */
export const PreviewScene: React.FC<PreviewSceneProps> = ({ shape, colorStyle }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const particlePoolRef = useRef<ParticlePool3D>(new ParticlePool3D(2000));
    const fireworksRef = useRef<Firework3D[]>([]);

    useEffect(() => {
        if (!containerRef.current) return;

        const width = containerRef.current.clientWidth;
        const height = containerRef.current.clientHeight;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0xf8fafc); // 浅色背景符合现代 UI

        const camera = new THREE.PerspectiveCamera(50, width / height, 1, 1000);
        camera.position.set(0, 0, 300);

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(width, height);
        renderer.setPixelRatio(window.devicePixelRatio);
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;

        // 简化的粒子系统
        const geo = new THREE.BufferGeometry();
        const mat = new THREE.PointsMaterial({
            size: 4,
            vertexColors: true,
            transparent: true,
            blending: THREE.NormalBlending, // 预览使用正常混合以匹配浅色背景
            depthWrite: false
        });
        const points = new THREE.Points(geo, mat);
        scene.add(points);

        let lastSpawn = 0;
        let requestID: number;

        const animate = (time: number) => {
            requestID = requestAnimationFrame(animate);

            // 每隔 1.5 秒自动触发一次预览爆炸
            if (time - lastSpawn > 1500) {
                const fw = new Firework3D(
                    { startX: 0, startZ: 0, targetX: 0, targetY: 0, targetZ: 0, hue: Math.random() * 360, charge: 1.0 },
                    { gravity: 0.1, friction: 0.95, autoLaunchDelay: 1000, particleCountMultiplier: 1, explosionSizeMultiplier: 1, starBlinkSpeed: 0, enableAutoCarnival: false, carnivalInterval: 0, trailLength: 0 },
                    { enabledShapes: [shape], enabledAscensions: [], enabledColors: [colorStyle] }
                );
                fw.exploded = true; // 直接设置为爆炸状态
                fireworksRef.current = [fw];
                lastSpawn = time;
            }

            fireworksRef.current.forEach((fw, i) => {
                if (fw.exploded) {
                    fw.createExplosion(
                        { gravity: 0.05, friction: 0.95, autoLaunchDelay: 0, particleCountMultiplier: 1, explosionSizeMultiplier: 0.8, starBlinkSpeed: 0, enableAutoCarnival: false, carnivalInterval: 0, trailLength: 0 },
                        (opts) => particlePoolRef.current.get(opts)
                    );
                    fireworksRef.current.splice(i, 1);
                }
            });

            particlePoolRef.current.update(0.016);

            // 更新 Buffer 数据
            const particles = particlePoolRef.current.getActiveParticles();
            const pos = new Float32Array(particles.length * 3);
            const col = new Float32Array(particles.length * 3);

            particles.forEach((p, i) => {
                pos[i * 3] = p.position.x; pos[i * 3 + 1] = p.position.y; pos[i * 3 + 2] = p.position.z;
                const c = p.getColor();
                col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
            });

            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('color', new THREE.BufferAttribute(col, 3));

            renderer.render(scene, camera);
        };

        requestID = requestAnimationFrame(animate);

        return () => {
            cancelAnimationFrame(requestID);
            renderer.dispose();
            if (containerRef.current) containerRef.current.innerHTML = '';
        };
    }, [shape, colorStyle]);

    return (
        <div className="w-full h-full relative group">
            <div ref={containerRef} className="w-full h-full" />
            <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-gray-200 rounded-xl m-2 group-hover:border-blue-400 transition-colors" />
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
                Live 3D Preview
            </div>
        </div>
    );
};

// END OF FILE: src/components/ui/PreviewScene.tsx