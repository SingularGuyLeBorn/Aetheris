/**
 * PhysicsEngine.ts - 顶级物理引擎
 * 
 * 功能特性：
 * - Verlet 积分器 (无条件稳定)
 * - Sub-stepping (帧内多次物理计算)
 * - RK4 积分器支持 (龙格-库塔法)
 * 
 * 目标：即使在低帧率下，烟花轨迹也丝滑如绸缎
 */

import { Vector3 } from './Vector3';

/**
 * 积分器接口 - 所有积分器必须实现
 */
export interface Integrator {
  integrate(
    position: Vector3,
    velocity: Vector3,
    acceleration: (pos: Vector3, vel: Vector3) => Vector3,
    dt: number
  ): { position: Vector3; velocity: Vector3 };
}

/**
 * 欧拉积分器 (朴素版本，作为对比参考)
 */
export class EulerIntegrator implements Integrator {
  integrate(
    position: Vector3,
    velocity: Vector3,
    acceleration: (pos: Vector3, vel: Vector3) => Vector3,
    dt: number
  ): { position: Vector3; velocity: Vector3 } {
    const a = acceleration(position, velocity);
    
    const newVelocity = new Vector3(
      velocity.x + a.x * dt,
      velocity.y + a.y * dt,
      velocity.z + a.z * dt
    );
    
    const newPosition = new Vector3(
      position.x + newVelocity.x * dt,
      position.y + newVelocity.y * dt,
      position.z + newVelocity.z * dt
    );
    
    return { position: newPosition, velocity: newVelocity };
  }
}

/**
 * Verlet 积分器 - 时间可逆, 能量守恒, 位置精确度极高
 * 特点：对于长时间模拟比欧拉法稳定得多
 */
export class VerletIntegrator implements Integrator {
  private previousPositions: WeakMap<object, Vector3> = new WeakMap();
  
  integrate(
    position: Vector3,
    velocity: Vector3,
    acceleration: (pos: Vector3, vel: Vector3) => Vector3,
    dt: number,
    particleRef?: object
  ): { position: Vector3; velocity: Vector3 } {
    // 对于首次调用，使用欧拉法初始化
    let prevPos = particleRef ? this.previousPositions.get(particleRef) : null;
    
    if (!prevPos) {
      // 首次迭代：使用反向欧拉估计之前的位置
      prevPos = new Vector3(
        position.x - velocity.x * dt,
        position.y - velocity.y * dt,
        position.z - velocity.z * dt
      );
    }
    
    const a = acceleration(position, velocity);
    
    // Verlet 积分: x(t+dt) = 2*x(t) - x(t-dt) + a*dt^2
    const newPosition = new Vector3(
      2 * position.x - prevPos.x + a.x * dt * dt,
      2 * position.y - prevPos.y + a.y * dt * dt,
      2 * position.z - prevPos.z + a.z * dt * dt
    );
    
    // 从位置差推导速度 (用于其他系统如碰撞检测)
    const newVelocity = new Vector3(
      (newPosition.x - position.x) / dt,
      (newPosition.y - position.y) / dt,
      (newPosition.z - position.z) / dt
    );
    
    // 缓存当前位置供下次使用
    if (particleRef) {
      this.previousPositions.set(particleRef, position.clone());
    }
    
    return { position: newPosition, velocity: newVelocity };
  }
  
  /**
   * 清理缓存的位置信息
   */
  clearCache(particleRef: object): void {
    this.previousPositions.delete(particleRef);
  }
}

/**
 * RK4 积分器 (龙格-库塔 4阶法) - 精度最高
 * 特点：四次采样，误差 O(dt^5)，但计算量是欧拉法的4倍
 */
export class RK4Integrator implements Integrator {
  integrate(
    position: Vector3,
    velocity: Vector3,
    acceleration: (pos: Vector3, vel: Vector3) => Vector3,
    dt: number
  ): { position: Vector3; velocity: Vector3 } {
    // 状态 = [position, velocity]
    // 导数 = [velocity, acceleration]
    
    // k1: 起点的斜率
    const a1 = acceleration(position, velocity);
    const k1_pos = velocity.clone();
    const k1_vel = a1.clone();
    
    // k2: 中点的斜率 (使用 k1)
    const pos2 = new Vector3(
      position.x + k1_pos.x * dt * 0.5,
      position.y + k1_pos.y * dt * 0.5,
      position.z + k1_pos.z * dt * 0.5
    );
    const vel2 = new Vector3(
      velocity.x + k1_vel.x * dt * 0.5,
      velocity.y + k1_vel.y * dt * 0.5,
      velocity.z + k1_vel.z * dt * 0.5
    );
    const a2 = acceleration(pos2, vel2);
    const k2_pos = vel2.clone();
    const k2_vel = a2.clone();
    
    // k3: 另一个中点的斜率 (使用 k2)
    const pos3 = new Vector3(
      position.x + k2_pos.x * dt * 0.5,
      position.y + k2_pos.y * dt * 0.5,
      position.z + k2_pos.z * dt * 0.5
    );
    const vel3 = new Vector3(
      velocity.x + k2_vel.x * dt * 0.5,
      velocity.y + k2_vel.y * dt * 0.5,
      velocity.z + k2_vel.z * dt * 0.5
    );
    const a3 = acceleration(pos3, vel3);
    const k3_pos = vel3.clone();
    const k3_vel = a3.clone();
    
    // k4: 终点的斜率 (使用 k3)
    const pos4 = new Vector3(
      position.x + k3_pos.x * dt,
      position.y + k3_pos.y * dt,
      position.z + k3_pos.z * dt
    );
    const vel4 = new Vector3(
      velocity.x + k3_vel.x * dt,
      velocity.y + k3_vel.y * dt,
      velocity.z + k3_vel.z * dt
    );
    const a4 = acceleration(pos4, vel4);
    const k4_pos = vel4.clone();
    const k4_vel = a4.clone();
    
    // 加权平均
    const newPosition = new Vector3(
      position.x + (k1_pos.x + 2 * k2_pos.x + 2 * k3_pos.x + k4_pos.x) * dt / 6,
      position.y + (k1_pos.y + 2 * k2_pos.y + 2 * k3_pos.y + k4_pos.y) * dt / 6,
      position.z + (k1_pos.z + 2 * k2_pos.z + 2 * k3_pos.z + k4_pos.z) * dt / 6
    );
    
    const newVelocity = new Vector3(
      velocity.x + (k1_vel.x + 2 * k2_vel.x + 2 * k3_vel.x + k4_vel.x) * dt / 6,
      velocity.y + (k1_vel.y + 2 * k2_vel.y + 2 * k3_vel.y + k4_vel.y) * dt / 6,
      velocity.z + (k1_vel.z + 2 * k2_vel.z + 2 * k3_vel.z + k4_vel.z) * dt / 6
    );
    
    return { position: newPosition, velocity: newVelocity };
  }
}

/**
 * 积分器类型枚举
 */
export enum IntegratorType {
  EULER = 'euler',
  VERLET = 'verlet',
  RK4 = 'rk4'
}

/**
 * 物理世界配置
 */
export interface PhysicsConfig {
  integrator: IntegratorType;
  subSteps: number;        // Sub-stepping 次数 (1 = 无 sub-stepping)
  fixedTimeStep: number;   // 固定时间步长 (秒)
  maxDeltaTime: number;    // 最大帧间隔 (防止爆炸)
}

/**
 * 默认物理配置 - 高质量设置
 */
export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  integrator: IntegratorType.VERLET,
  subSteps: 4,             // 每帧 4 次物理更新
  fixedTimeStep: 1/240,    // 240Hz 物理更新率
  maxDeltaTime: 1/30       // 最大 33ms (30fps 保护)
};

/**
 * 物理引擎 - 统一管理所有物理计算
 */
export class PhysicsEngine {
  private config: PhysicsConfig;
  private integrator: Integrator;
  private accumulator: number = 0;
  
  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
    this.integrator = this.createIntegrator(this.config.integrator);
  }
  
  private createIntegrator(type: IntegratorType): Integrator {
    switch (type) {
      case IntegratorType.EULER:
        return new EulerIntegrator();
      case IntegratorType.VERLET:
        return new VerletIntegrator();
      case IntegratorType.RK4:
        return new RK4Integrator();
      default:
        return new VerletIntegrator();
    }
  }
  
  /**
   * 更新配置
   */
  setConfig(config: Partial<PhysicsConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.integrator) {
      this.integrator = this.createIntegrator(config.integrator);
    }
  }
  
  /**
   * 获取当前积分器
   */
  getIntegrator(): Integrator {
    return this.integrator;
  }
  
  /**
   * 带 Sub-stepping 的物理更新
   * 
   * @param deltaTime 实际帧时间
   * @param updateFn 每个物理步骤的更新函数
   */
  update(deltaTime: number, updateFn: (subDt: number) => void): void {
    // 限制最大时间步长防止爆炸
    const clampedDelta = Math.min(deltaTime, this.config.maxDeltaTime);
    
    // 累积时间
    this.accumulator += clampedDelta;
    
    const subDt = this.config.fixedTimeStep;
    const maxSteps = this.config.subSteps * 2; // 防止死循环
    let steps = 0;
    
    // 固定时间步长更新
    while (this.accumulator >= subDt && steps < maxSteps) {
      updateFn(subDt);
      this.accumulator -= subDt;
      steps++;
    }
    
    // 如果还有剩余时间，进行一次插值更新
    if (this.accumulator > 0 && steps < maxSteps) {
      // 可选：进行部分步长更新以获得更平滑的视觉效果
      // updateFn(this.accumulator);
      // this.accumulator = 0;
    }
  }
  
  /**
   * 简化版更新 - 直接使用 sub-stepping
   */
  updateSimple(deltaTime: number, updateFn: (subDt: number) => void): void {
    const clampedDelta = Math.min(deltaTime, this.config.maxDeltaTime);
    const subDt = clampedDelta / this.config.subSteps;
    
    for (let i = 0; i < this.config.subSteps; i++) {
      updateFn(subDt);
    }
  }
  
  /**
   * 计算单个粒子的物理更新
   */
  integrateParticle(
    position: Vector3,
    velocity: Vector3,
    gravity: number,
    friction: number,
    resistance: number,
    dt: number,
    particleRef?: object
  ): { position: Vector3; velocity: Vector3 } {
    // 加速度函数
    const accelerationFn = (pos: Vector3, vel: Vector3): Vector3 => {
      // 重力
      const grav = new Vector3(0, -gravity, 0);
      
      // 空气阻力 (与速度平方成正比)
      const speed = vel.length();
      const drag = new Vector3();
      if (speed > 0.001) {
        const dragMag = speed * speed * resistance;
        drag.x = -(vel.x / speed) * dragMag;
        drag.y = -(vel.y / speed) * dragMag;
        drag.z = -(vel.z / speed) * dragMag;
      }
      
      return new Vector3(
        grav.x + drag.x,
        grav.y + drag.y,
        grav.z + drag.z
      );
    };
    
    // 使用选定的积分器
    const result = (this.integrator as any).integrate(
      position, velocity, accelerationFn, dt, particleRef
    );
    
    // 应用摩擦力 (速度衰减)
    const frictionFactor = Math.pow(friction, dt * 60);
    result.velocity.x *= frictionFactor;
    result.velocity.y *= frictionFactor;
    result.velocity.z *= frictionFactor;
    
    return result;
  }
}

/**
 * 全局物理引擎单例
 */
let globalPhysicsEngine: PhysicsEngine | null = null;

export function getPhysicsEngine(): PhysicsEngine {
  if (!globalPhysicsEngine) {
    globalPhysicsEngine = new PhysicsEngine();
  }
  return globalPhysicsEngine;
}

export function setPhysicsEngine(engine: PhysicsEngine): void {
  globalPhysicsEngine = engine;
}
