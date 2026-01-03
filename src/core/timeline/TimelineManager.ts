// FILE: src/core/timeline/TimelineManager.ts
// 时间线管理器：支持时间轴控制、关键帧标记、状态快照

export interface TimelineKeyframe {
  id: string;
  time: number;           // 秒
  label: string;
  type: 'launch' | 'explosion' | 'carnival' | 'custom';
  color: string;
  data?: any;             // 额外数据 (如发射参数)
}

export interface TimelineState {
  currentTime: number;    // 当前时间 (秒)
  duration: number;       // 总时长 (秒)
  isPlaying: boolean;
  timeScale: number;      // 1x, 2x, 5x, 10x
  keyframes: TimelineKeyframe[];
}

export interface TimelineSnapshot {
  time: number;
  fireworkPositions: Array<{ id: string; x: number; y: number; z: number }>;
  particleCount: number;
  cameraPosition?: { x: number; y: number; z: number };
}

/**
 * 时间线管理器
 * 核心职责：
 * 1. 维护时间轴状态
 * 2. 管理关键帧
 * 3. 支持时间跳转和回溯
 * 4. 提供状态快照机制
 */
export class TimelineManager {
  private state: TimelineState;
  private snapshots: Map<number, TimelineSnapshot> = new Map();
  private snapshotInterval: number = 0.5; // 每0.5秒自动快照
  private lastSnapshotTime: number = 0;
  private keyframeIdCounter: number = 0;
  
  // 事件回调
  private onTimeChangeCallbacks: Array<(time: number) => void> = [];
  private onKeyframeAddCallbacks: Array<(kf: TimelineKeyframe) => void> = [];
  private onSeekCallbacks: Array<(time: number) => void> = [];

  constructor() {
    this.state = {
      currentTime: 0,
      duration: 60, // 默认60秒时间轴
      isPlaying: true,
      timeScale: 1,
      keyframes: []
    };
  }

  // === 基础控制 ===
  
  play(): void {
    this.state.isPlaying = true;
  }

  pause(): void {
    this.state.isPlaying = false;
  }

  togglePlay(): boolean {
    this.state.isPlaying = !this.state.isPlaying;
    return this.state.isPlaying;
  }

  setTimeScale(scale: number): void {
    // 限制在有效范围
    this.state.timeScale = Math.max(0.1, Math.min(10, scale));
  }

  getTimeScale(): number {
    return this.state.timeScale;
  }

  // === 时间操作 ===

  /**
   * 更新时间（每帧调用）
   */
  update(deltaTime: number): void {
    if (!this.state.isPlaying) return;
    
    const scaledDelta = deltaTime * this.state.timeScale;
    this.state.currentTime += scaledDelta;
    
    // 自动快照
    if (this.state.currentTime - this.lastSnapshotTime >= this.snapshotInterval) {
      this.lastSnapshotTime = this.state.currentTime;
      // 快照逻辑由外部提供
    }
    
    // 通知监听器
    this.onTimeChangeCallbacks.forEach(cb => cb(this.state.currentTime));
  }

  /**
   * 跳转到指定时间
   */
  seekTo(time: number): void {
    const clampedTime = Math.max(0, Math.min(this.state.duration, time));
    this.state.currentTime = clampedTime;
    
    // 通知监听器
    this.onSeekCallbacks.forEach(cb => cb(clampedTime));
    this.onTimeChangeCallbacks.forEach(cb => cb(clampedTime));
  }

  /**
   * 跳转到指定进度 (0-1)
   */
  seekToProgress(progress: number): void {
    this.seekTo(progress * this.state.duration);
  }

  /**
   * 微调时间 (用于键盘快捷键)
   */
  nudge(seconds: number): void {
    this.seekTo(this.state.currentTime + seconds);
  }

  getCurrentTime(): number {
    return this.state.currentTime;
  }

  getProgress(): number {
    return this.state.duration > 0 ? this.state.currentTime / this.state.duration : 0;
  }

  getDuration(): number {
    return this.state.duration;
  }

  setDuration(duration: number): void {
    this.state.duration = Math.max(10, duration);
  }

  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  // === 关键帧管理 ===

  /**
   * 添加关键帧
   */
  addKeyframe(label: string, type: TimelineKeyframe['type'], time?: number, data?: any): TimelineKeyframe {
    const kf: TimelineKeyframe = {
      id: `kf_${++this.keyframeIdCounter}`,
      time: time ?? this.state.currentTime,
      label,
      type,
      color: this.getKeyframeColor(type),
      data
    };
    
    this.state.keyframes.push(kf);
    this.state.keyframes.sort((a, b) => a.time - b.time);
    
    // 自动扩展时间轴
    if (kf.time > this.state.duration * 0.9) {
      this.state.duration = kf.time * 1.2;
    }
    
    this.onKeyframeAddCallbacks.forEach(cb => cb(kf));
    return kf;
  }

  /**
   * 移除关键帧
   */
  removeKeyframe(id: string): void {
    this.state.keyframes = this.state.keyframes.filter(kf => kf.id !== id);
  }

  /**
   * 获取所有关键帧
   */
  getKeyframes(): TimelineKeyframe[] {
    return [...this.state.keyframes];
  }

  /**
   * 获取当前时间附近的关键帧
   */
  getNearbyKeyframes(range: number = 1): TimelineKeyframe[] {
    const t = this.state.currentTime;
    return this.state.keyframes.filter(kf => Math.abs(kf.time - t) <= range);
  }

  /**
   * 跳转到下一个关键帧
   */
  jumpToNextKeyframe(): void {
    const next = this.state.keyframes.find(kf => kf.time > this.state.currentTime);
    if (next) this.seekTo(next.time);
  }

  /**
   * 跳转到上一个关键帧
   */
  jumpToPrevKeyframe(): void {
    const reversed = [...this.state.keyframes].reverse();
    const prev = reversed.find(kf => kf.time < this.state.currentTime - 0.1);
    if (prev) this.seekTo(prev.time);
  }

  private getKeyframeColor(type: TimelineKeyframe['type']): string {
    switch (type) {
      case 'launch': return '#10b981';    // 绿色
      case 'explosion': return '#f59e0b'; // 橙色
      case 'carnival': return '#8b5cf6';  // 紫色
      case 'custom': return '#3b82f6';    // 蓝色
      default: return '#6b7280';
    }
  }

  // === 状态快照 (用于时间回溯) ===

  /**
   * 保存当前状态快照
   */
  saveSnapshot(snapshot: Omit<TimelineSnapshot, 'time'>): void {
    const key = Math.floor(this.state.currentTime * 2) / 2; // 0.5秒粒度
    this.snapshots.set(key, {
      time: this.state.currentTime,
      ...snapshot
    });
    
    // 限制快照数量 (保留最近120秒)
    const maxSnapshots = 240;
    if (this.snapshots.size > maxSnapshots) {
      const oldest = Array.from(this.snapshots.keys()).sort((a, b) => a - b)[0];
      this.snapshots.delete(oldest);
    }
  }

  /**
   * 获取最近的快照
   */
  getNearestSnapshot(time: number): TimelineSnapshot | null {
    const key = Math.floor(time * 2) / 2;
    return this.snapshots.get(key) || null;
  }

  // === 事件订阅 ===

  onTimeChange(callback: (time: number) => void): () => void {
    this.onTimeChangeCallbacks.push(callback);
    return () => {
      this.onTimeChangeCallbacks = this.onTimeChangeCallbacks.filter(cb => cb !== callback);
    };
  }

  onKeyframeAdd(callback: (kf: TimelineKeyframe) => void): () => void {
    this.onKeyframeAddCallbacks.push(callback);
    return () => {
      this.onKeyframeAddCallbacks = this.onKeyframeAddCallbacks.filter(cb => cb !== callback);
    };
  }

  onSeek(callback: (time: number) => void): () => void {
    this.onSeekCallbacks.push(callback);
    return () => {
      this.onSeekCallbacks = this.onSeekCallbacks.filter(cb => cb !== callback);
    };
  }

  // === 状态获取 ===

  getState(): Readonly<TimelineState> {
    return { ...this.state };
  }

  // === 重置 ===

  reset(): void {
    this.state.currentTime = 0;
    this.state.keyframes = [];
    this.snapshots.clear();
    this.lastSnapshotTime = 0;
    this.keyframeIdCounter = 0;
  }
}

// 单例导出
export const timelineManager = new TimelineManager();

// END OF FILE: src/core/timeline/TimelineManager.ts
