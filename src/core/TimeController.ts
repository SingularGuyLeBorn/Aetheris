// FILE: src/core/TimeController.ts
// 时间控制器 - 管理模拟时间流

export class TimeController {
  public isPaused: boolean = false;
  public timeScale: number = 1.0;
  public virtualTime: number = 0;
  public deltaTime: number = 0;
  
  private lastRealTime: number = 0;
  private accumulatedTime: number = 0;

  constructor() {
    this.reset();
  }

  reset(): void {
    this.isPaused = false;
    this.timeScale = 1.0;
    this.virtualTime = 0;
    this.deltaTime = 0;
    this.lastRealTime = performance.now() / 1000;
    this.accumulatedTime = 0;
  }

  update(): void {
    const currentRealTime = performance.now() / 1000;
    const realDelta = currentRealTime - this.lastRealTime;
    this.lastRealTime = currentRealTime;

    if (this.isPaused) {
      this.deltaTime = 0;
      return;
    }

    this.deltaTime = realDelta * this.timeScale;
    this.virtualTime += this.deltaTime;
    this.accumulatedTime += this.deltaTime;
  }

  pause(): void {
    this.isPaused = true;
  }

  play(): void {
    this.isPaused = false;
    this.lastRealTime = performance.now() / 1000;
  }

  togglePause(): boolean {
    if (this.isPaused) {
      this.play();
    } else {
      this.pause();
    }
    return this.isPaused;
  }

  setTimeScale(scale: number): void {
    this.timeScale = Math.max(0.1, Math.min(10, scale));
  }

  getFormattedTime(): string {
    const totalSeconds = Math.floor(this.virtualTime);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getProgress(duration: number): number {
    return duration > 0 ? Math.min(1, this.virtualTime / duration) : 0;
  }

  seekTo(time: number): void {
    this.virtualTime = Math.max(0, time);
    this.accumulatedTime = this.virtualTime;
  }
}

// END OF FILE: src/core/TimeController.ts
