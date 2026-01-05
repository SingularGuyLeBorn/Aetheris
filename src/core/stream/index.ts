/**
 * Stream Architecture - Main Entry Point
 * 
 * "一切皆流" (Everything is a Stream) 烟花引擎
 * 
 * 导出所有核心模块供外部使用
 */

// ============================================================================
// 类型定义
// ============================================================================
export * from './types';

// ============================================================================
// 核心系统
// ============================================================================
export { Director, globalDirector } from './Director';
export type { DirectorConfig } from './Director';

export { CarrierSystem, globalCarrierSystem } from './CarrierSystem';
export type { CarrierState, CarrierInstance, TrailParticle } from './CarrierSystem';

export { ParticleStream, StreamState } from './ParticleStream';
export type { StreamParticle, StreamConfig } from './ParticleStream';

export { ForceFieldSystem, globalForceFieldSystem } from './ForceFieldSystem';

export { MorphingEngine, globalMorphingEngine, DEFAULT_MORPH_CONFIG } from './MorphingEngine';
export type { MorphParticle, MorphConfig } from './MorphingEngine';

// ============================================================================
// 渲染器
// ============================================================================
export { StreamRenderer } from './StreamRenderer';
export type { StreamRendererConfig } from './StreamRenderer';

// END OF FILE: src/core/stream/index.ts
