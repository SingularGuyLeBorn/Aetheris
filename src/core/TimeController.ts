/**
 * TimeController - Controls the flow of time in the 3D world
 * Allows pausing, slow motion, and time acceleration
 */
export class TimeController {
  private _timeScale: number = 1;
  private _isPaused: boolean = false;
  private _lastRealTime: number = 0;
  private _virtualTime: number = 0;
  private _deltaTime: number = 0;

  // Preset time scales
  static readonly PAUSED = 0;
  static readonly SLOW_MOTION = 0.2;
  static readonly NORMAL = 1;
  static readonly FAST = 2;
  static readonly ULTRA_FAST = 5;

  constructor() {
    this._lastRealTime = performance.now();
  }

  /**
   * Update the time controller - call this every frame
   */
  update(): void {
    const currentRealTime = performance.now();
    const realDelta = (currentRealTime - this._lastRealTime) / 1000; // Convert to seconds
    this._lastRealTime = currentRealTime;

    if (this._isPaused) {
      this._deltaTime = 0;
    } else {
      this._deltaTime = realDelta * this._timeScale;
      this._virtualTime += this._deltaTime;
    }
  }

  /**
   * Get the delta time adjusted for time scale
   */
  get deltaTime(): number {
    return this._deltaTime;
  }

  /**
   * Get the virtual time in the simulation
   */
  get virtualTime(): number {
    return this._virtualTime;
  }

  /**
   * Get the current time scale
   */
  get timeScale(): number {
    return this._timeScale;
  }

  /**
   * Set the time scale (0 = paused, 1 = normal, 2 = double speed, etc.)
   */
  set timeScale(value: number) {
    this._timeScale = Math.max(0, Math.min(10, value));
    if (this._timeScale === 0) {
      this._isPaused = true;
    } else {
      this._isPaused = false;
    }
  }

  /**
   * Check if the simulation is paused
   */
  get isPaused(): boolean {
    return this._isPaused;
  }

  /**
   * Pause the simulation
   */
  pause(): void {
    this._isPaused = true;
  }

  /**
   * Resume the simulation
   */
  resume(): void {
    this._isPaused = false;
    this._lastRealTime = performance.now();
  }

  /**
   * Toggle pause state
   */
  togglePause(): void {
    if (this._isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  /**
   * Set to slow motion
   */
  setSlowMotion(): void {
    this._timeScale = TimeController.SLOW_MOTION;
    this._isPaused = false;
  }

  /**
   * Set to normal speed
   */
  setNormal(): void {
    this._timeScale = TimeController.NORMAL;
    this._isPaused = false;
  }

  /**
   * Set to fast forward
   */
  setFast(): void {
    this._timeScale = TimeController.FAST;
    this._isPaused = false;
  }

  /**
   * Increase time scale by a step
   */
  speedUp(step: number = 0.25): void {
    this.timeScale = Math.min(10, this._timeScale + step);
  }

  /**
   * Decrease time scale by a step
   */
  slowDown(step: number = 0.25): void {
    this.timeScale = Math.max(0.1, this._timeScale - step);
  }

  /**
   * Get a formatted string of the current time state
   */
  getStatusText(): string {
    if (this._isPaused) return '⏸ 已暂停';
    if (this._timeScale < 0.5) return `🐢 ${this._timeScale.toFixed(2)}x 慢动作`;
    if (this._timeScale === 1) return '▶ 1x 正常';
    if (this._timeScale <= 2) return `⏩ ${this._timeScale.toFixed(2)}x`;
    return `🚀 ${this._timeScale.toFixed(2)}x 超速`;
  }
}
