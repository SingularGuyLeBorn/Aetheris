
import React, { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import { ParticlePool } from '../core/ParticlePool';
import { Firework } from '../core/Firework';
import { AppSettings } from '../types';

interface Star {
  x: number;
  y: number;
  size: number;
  blinkSpeed: number;
  phase: number;
  layer: number;
}

interface FireworkCanvasProps {
  settings: AppSettings;
}

export interface FireworkCanvasHandle {
  launchCarnival: () => void;
}

export const FireworkCanvas = forwardRef<FireworkCanvasHandle, FireworkCanvasProps>(({ settings }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworksRef = useRef<Firework[]>([]);
  
  const particlePoolRef = useRef<ParticlePool | null>(null);
  const sparklersPoolRef = useRef<ParticlePool | null>(null);
  
  if (!particlePoolRef.current) particlePoolRef.current = new ParticlePool(15000);
  if (!sparklersPoolRef.current) sparklersPoolRef.current = new ParticlePool(1000);

  const getParticlePool = () => particlePoolRef.current!;
  const getSparklersPool = () => sparklersPoolRef.current!;

  const shockwavesRef = useRef<{ x: number, y: number, r: number, a: number }[]>([]);
  
  const [isCharging, setIsCharging] = useState(false);
  const chargeLevelRef = useRef(0);
  const mousePos = useRef({ x: 0, y: 0 });
  const requestRef = useRef<number | undefined>(undefined);
  const lastAutoLaunch = useRef<number>(0);

  const stars = useMemo<Star[]>(() => {
    const s: Star[] = [];
    for (let i = 0; i < 400; i++) {
      s.push({
        x: Math.random() * 4000, 
        y: Math.random() * 3000,
        size: Math.random() * 1.2,
        blinkSpeed: (0.002 + Math.random() * 0.008) * (settings.starBlinkSpeed / 0.0008),
        phase: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3)
      });
    }
    return s;
  }, [settings.starBlinkSpeed]);

  const handleResize = useCallback(() => {
    if (canvasRef.current) {
      const dpr = window.devicePixelRatio || 1;
      canvasRef.current.width = window.innerWidth * dpr;
      canvasRef.current.height = window.innerHeight * dpr;
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const launchFireworkAt = (x: number, y: number, hue?: number, charge?: number) => {
    const startXVariation = (Math.random() - 0.5) * 100;
    const startX = Math.max(0, Math.min(window.innerWidth, x + startXVariation));
    
    fireworksRef.current.push(new Firework({
      startX,
      targetX: x,
      targetY: y,
      hue: hue ?? Math.random() * 360,
      charge: charge ?? 0.2 + Math.random() * 0.5
    }, settings));
  };

  useImperativeHandle(ref, () => ({
    launchCarnival: () => {
      const launch = (count: number, delay: number) => {
        for (let i = 0; i < count; i++) {
          setTimeout(() => {
            const x = (window.innerWidth * 0.1) + (window.innerWidth * 0.8 * Math.random());
            const y = window.innerHeight * (0.1 + Math.random() * 0.4);
            launchFireworkAt(x, y, Math.random() * 360, 0.4 + Math.random() * 0.4);
          }, delay + i * 180);
        }
      };
      launch(8, 0); 
      launch(12, 1200);
    }
  }));

  const animate = useCallback((time: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#020205';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillStyle = '#fff';
    const oxB = (mousePos.current.x - window.innerWidth/2) * 0.005;
    const oyB = (mousePos.current.y - window.innerHeight/2) * 0.005;
    for (let i = 0; i < stars.length; i++) {
      const s = stars[i];
      const opacity = 0.05 + Math.abs(Math.sin(time * s.blinkSpeed + s.phase)) * 0.6;
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.arc((s.x + oxB * s.layer) % window.innerWidth, (s.y + oyB * s.layer) % window.innerHeight, s.size, 0, 6.28);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    if (time - lastAutoLaunch.current > settings.autoLaunchDelay && !isCharging) {
      launchFireworkAt(Math.random() * window.innerWidth, 50 + Math.random() * (window.innerHeight * 0.4));
      lastAutoLaunch.current = time;
    }

    ctx.globalCompositeOperation = 'lighter';
    getSparklersPool().updateAndDraw(ctx);

    for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
      const f = fireworksRef.current[i];
      f.update(settings);
      f.draw(ctx);
      if (f.exploded) {
        f.createExplosion(settings, (opts) => getParticlePool().get(opts));
        if (f.charge > 0.5) {
          shockwavesRef.current.push({ x: f.pos.x, y: f.pos.y, r: 0, a: 0.25 });
        }
        fireworksRef.current.splice(i, 1);
      }
    }

    getParticlePool().updateAndDraw(ctx);

    for (let i = shockwavesRef.current.length - 1; i >= 0; i--) {
      const sw = shockwavesRef.current[i];
      sw.r += 16; sw.a -= 0.01;
      ctx.globalAlpha = sw.a;
      ctx.lineWidth = 1;
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, 6.28);
      ctx.stroke();
      if (sw.a <= 0) shockwavesRef.current.splice(i, 1);
    }

    ctx.globalAlpha = 1;

    if (isCharging) {
      const increment = 0.025 * (1 - chargeLevelRef.current * 0.4);
      chargeLevelRef.current = Math.min(chargeLevelRef.current + increment, 1);
      
      const { x, y } = mousePos.current;
      const hue = (x / window.innerWidth) * 360;
      
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${0.4 + chargeLevelRef.current * 0.4})`;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(x, y, 40 + chargeLevelRef.current * 100, time * 0.003, time * 0.003 + 6.28);
      ctx.stroke();
      
      if (Math.random() > 0.5) {
        const ang = Math.random() * Math.PI * 2;
        const dist = 100 + Math.random() * 50;
        getSparklersPool().get({
          x: x + Math.cos(ang) * dist,
          y: y + Math.sin(ang) * dist,
          hue: (hue + 40) % 360,
          speed: -4 - chargeLevelRef.current * 4,
          angle: ang,
          size: 1,
          decay: 0.1,
          behavior: 'glitter'
        });
      }

      ctx.fillStyle = `hsla(${hue}, 100%, 70%, ${0.1 + chargeLevelRef.current * 0.4})`;
      ctx.beginPath();
      ctx.arc(x, y, chargeLevelRef.current * 50, 0, 6.28);
      ctx.fill();
      ctx.restore();
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [isCharging, stars, settings]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [animate]);

  const updateMousePos = (e: React.MouseEvent | React.TouchEvent) => {
    const x = 'touches' in e ? (e as React.TouchEvent).touches[0].clientX : (e as React.MouseEvent).clientX;
    const y = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
    mousePos.current = { x, y };
    
    if (Math.random() > 0.8) {
      getSparklersPool().get({
        x, y,
        hue: (performance.now() / 15) % 360,
        speed: Math.random() * 2,
        size: 0.7,
        decay: 0.06
      });
    }
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsCharging(true);
    chargeLevelRef.current = 0;
    updateMousePos(e);
  };

  const handleMouseUp = () => {
    if (!isCharging) return;
    const xRatio = mousePos.current.x / window.innerWidth;
    const h = xRatio < 0.5 ? 170 + xRatio * 180 : (xRatio - 0.5) * 120;
    launchFireworkAt(mousePos.current.x, mousePos.current.y, h, chargeLevelRef.current + 0.1);
    setIsCharging(false);
    chargeLevelRef.current = 0;
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseMove={updateMousePos}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
      onTouchMove={updateMousePos}
      className="cursor-crosshair w-full h-full block touch-none"
    />
  );
});
