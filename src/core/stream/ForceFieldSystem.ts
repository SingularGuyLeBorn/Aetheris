/**
 * ForceFieldSystem.ts - 力场系统
 * 
 * 负责管理所有作用于粒子的力:
 * - 重力 (Gravity)
 * - 吸引力/斥力 (Attraction/Repulsion)
 * - 空气阻力 (Drag)
 * - 风力 (Wind)
 * - 柏林噪声力场 (Noise)
 * - 涡旋力 (Vortex)
 * - 湍流 (Turbulence)
 */

import { Vector3 } from '../Vector3';
import { ForceField, ForceFieldType, evaluateCurve, Curve } from './types';

/**
 * 3D柏林噪声实现
 * 用于生成自然的随机力场
 */
class PerlinNoise3D {
  private permutation: number[] = [];
  private p: number[] = [];

  constructor(seed: number = 0) {
    // 初始化排列表
    this.permutation = [];
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // 使用种子打乱
    const random = this.seededRandom(seed);
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // 复制排列表
    this.p = [...this.permutation, ...this.permutation];
  }

  private seededRandom(seed: number): () => number {
    return () => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    };
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x: number, y: number, z: number): number {
    // 找到单元格坐标
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // 单元格内相对位置
    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    // 计算渐变曲线
    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    // 哈希坐标
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // 混合结果
    return this.lerp(
      this.lerp(
        this.lerp(
          this.grad(this.p[AA], x, y, z),
          this.grad(this.p[BA], x - 1, y, z),
          u
        ),
        this.lerp(
          this.grad(this.p[AB], x, y - 1, z),
          this.grad(this.p[BB], x - 1, y - 1, z),
          u
        ),
        v
      ),
      this.lerp(
        this.lerp(
          this.grad(this.p[AA + 1], x, y, z - 1),
          this.grad(this.p[BA + 1], x - 1, y, z - 1),
          u
        ),
        this.lerp(
          this.grad(this.p[AB + 1], x, y - 1, z - 1),
          this.grad(this.p[BB + 1], x - 1, y - 1, z - 1),
          u
        ),
        v
      ),
      w
    );
  }

  /**
   * 获取3D噪声向量
   * 使用不同偏移量生成三个噪声值
   */
  noiseVector(x: number, y: number, z: number): Vector3 {
    return new Vector3(
      this.noise(x, y, z),
      this.noise(x + 100, y + 100, z + 100),
      this.noise(x + 200, y + 200, z + 200)
    );
  }
}

/**
 * 力场系统
 * 统一管理和计算所有作用于粒子的力
 */
export class ForceFieldSystem {
  private forceFields: ForceField[] = [];
  private globalTime: number = 0;
  private noise: PerlinNoise3D;

  constructor() {
    this.noise = new PerlinNoise3D(Date.now());
  }

  /**
   * 添加力场
   */
  addForceField(field: ForceField): void {
    this.forceFields.push({ ...field, enabled: field.enabled ?? true });
  }

  /**
   * 移除力场
   */
  removeForceField(index: number): void {
    this.forceFields.splice(index, 1);
  }

  /**
   * 清除所有力场
   */
  clearForces(): void {
    this.forceFields = [];
  }

  /**
   * 设置力场列表
   */
  setForceFields(fields: ForceField[]): void {
    this.forceFields = fields.map(f => ({ ...f, enabled: f.enabled ?? true }));
  }

  /**
   * 获取当前力场列表
   */
  getForceFields(): ForceField[] {
    return [...this.forceFields];
  }

  /**
   * 更新全局时间 (用于时间相关的力场)
   */
  updateTime(deltaTime: number): void {
    this.globalTime += deltaTime;
  }

  /**
   * 计算作用于粒子的总力
   * 
   * @param position 粒子位置
   * @param velocity 粒子速度
   * @param mass 粒子质量 (默认 1)
   * @returns 总力向量
   */
  calculateTotalForce(position: Vector3, velocity: Vector3, mass: number = 1): Vector3 {
    const totalForce = new Vector3(0, 0, 0);

    for (const field of this.forceFields) {
      if (!field.enabled) continue;

      const force = this.calculateSingleForce(field, position, velocity, mass);
      totalForce.x += force.x;
      totalForce.y += force.y;
      totalForce.z += force.z;
    }

    return totalForce;
  }

  /**
   * 计算单个力场的力
   */
  private calculateSingleForce(
    field: ForceField,
    position: Vector3,
    velocity: Vector3,
    mass: number
  ): Vector3 {
    switch (field.type) {
      case 'gravity':
        return this.calculateGravity(field, mass);
      
      case 'attraction':
        return this.calculateAttraction(field, position);
      
      case 'repulsion':
        return this.calculateRepulsion(field, position);
      
      case 'drag':
        return this.calculateDrag(field, velocity);
      
      case 'wind':
        return this.calculateWind(field);
      
      case 'noise':
        return this.calculateNoise(field, position);
      
      case 'vortex':
        return this.calculateVortex(field, position);
      
      case 'turbulence':
        return this.calculateTurbulence(field, position);
      
      case 'curl_noise':
        return this.calculateCurlNoise(field, position);
      
      case 'breathe':
        return this.calculateBreathe(field, position);
      
      case 'wing_flap':
        return this.calculateWingFlap(field, position);
      
      default:
        return new Vector3(0, 0, 0);
    }
  }

  /**
   * 重力: F = m * g * direction
   */
  private calculateGravity(field: ForceField, mass: number): Vector3 {
    const dir = field.direction || new Vector3(0, -1, 0);
    const strength = field.strength;
    
    return new Vector3(
      dir.x * strength * mass,
      dir.y * strength * mass,
      dir.z * strength * mass
    );
  }

  /**
   * 吸引力: F = k / d² * (center - position)
   */
  private calculateAttraction(field: ForceField, position: Vector3): Vector3 {
    const center = field.center || new Vector3(0, 0, 0);
    const dx = center.x - position.x;
    const dy = center.y - position.y;
    const dz = center.z - position.z;
    
    const distSq = dx * dx + dy * dy + dz * dz;
    const dist = Math.sqrt(distSq);
    
    // 检查半径限制
    if (field.radius && field.radius > 0 && dist > field.radius) {
      return new Vector3(0, 0, 0);
    }

    // 避免除零和过大的力
    const minDist = 1;
    const safeDist = Math.max(dist, minDist);
    const safeDistSq = safeDist * safeDist;

    // 应用衰减曲线
    let falloff = 1;
    if (field.falloff && field.radius && field.radius > 0) {
      const normalizedDist = dist / field.radius;
      falloff = 1 - evaluateCurve(field.falloff, normalizedDist);
    }

    const forceMagnitude = (field.strength * falloff) / safeDistSq;
    
    // 归一化方向并应用力
    return new Vector3(
      (dx / safeDist) * forceMagnitude,
      (dy / safeDist) * forceMagnitude,
      (dz / safeDist) * forceMagnitude
    );
  }

  /**
   * 斥力: F = -k / d² * (center - position)
   */
  private calculateRepulsion(field: ForceField, position: Vector3): Vector3 {
    const attraction = this.calculateAttraction(field, position);
    return new Vector3(-attraction.x, -attraction.y, -attraction.z);
  }

  /**
   * 空气阻力: F = -k * v²
   * 方向与速度相反
   */
  private calculateDrag(field: ForceField, velocity: Vector3): Vector3 {
    const speed = Math.sqrt(
      velocity.x * velocity.x +
      velocity.y * velocity.y +
      velocity.z * velocity.z
    );

    if (speed === 0) {
      return new Vector3(0, 0, 0);
    }

    // 阻力与速度平方成正比
    const dragMagnitude = field.strength * speed * speed;

    // 方向与速度相反
    return new Vector3(
      -(velocity.x / speed) * dragMagnitude,
      -(velocity.y / speed) * dragMagnitude,
      -(velocity.z / speed) * dragMagnitude
    );
  }

  /**
   * 风力: F = strength * direction
   */
  private calculateWind(field: ForceField): Vector3 {
    const dir = field.direction || new Vector3(1, 0, 0);
    const strength = field.strength;

    // 添加一些时间波动使风力更自然
    const timeVariation = 1 + 0.3 * Math.sin(this.globalTime * 2);

    return new Vector3(
      dir.x * strength * timeVariation,
      dir.y * strength * timeVariation,
      dir.z * strength * timeVariation
    );
  }

  /**
   * 噪声力场: 使用柏林噪声生成随机但平滑的力
   */
  private calculateNoise(field: ForceField, position: Vector3): Vector3 {
    const freq = field.noiseFrequency || 0.1;
    const amp = field.noiseAmplitude || 1;
    const strength = field.strength;

    // 使用位置 + 时间生成噪声
    const noiseVec = this.noise.noiseVector(
      position.x * freq + this.globalTime * 0.5,
      position.y * freq,
      position.z * freq
    );

    return new Vector3(
      noiseVec.x * strength * amp,
      noiseVec.y * strength * amp,
      noiseVec.z * strength * amp
    );
  }

  /**
   * 涡旋力: 绕中心轴旋转的力
   */
  private calculateVortex(field: ForceField, position: Vector3): Vector3 {
    const center = field.center || new Vector3(0, 0, 0);
    
    // 相对于中心的位置 (XZ 平面)
    const rx = position.x - center.x;
    const rz = position.z - center.z;
    const r = Math.sqrt(rx * rx + rz * rz);

    if (r === 0) {
      return new Vector3(0, 0, 0);
    }

    // 检查半径限制
    if (field.radius && field.radius > 0 && r > field.radius) {
      return new Vector3(0, 0, 0);
    }

    // 涡旋力垂直于半径方向
    // 在 XZ 平面上: (rx, rz) 的垂直方向是 (-rz, rx)
    const tangentX = -rz / r;
    const tangentZ = rx / r;

    // 力大小随距离衰减
    const falloff = field.radius && field.radius > 0 
      ? Math.max(0, 1 - r / field.radius)
      : 1 / (1 + r * 0.1);

    const forceMagnitude = field.strength * falloff;

    return new Vector3(
      tangentX * forceMagnitude,
      0,
      tangentZ * forceMagnitude
    );
  }

  /**
   * 湍流: 多层次噪声的组合
   */
  private calculateTurbulence(field: ForceField, position: Vector3): Vector3 {
    const baseFreq = field.noiseFrequency || 0.1;
    const amp = field.noiseAmplitude || 1;
    const strength = field.strength;

    let totalForce = new Vector3(0, 0, 0);
    let amplitude = amp;
    let frequency = baseFreq;

    // 4 层噪声叠加
    for (let i = 0; i < 4; i++) {
      const noiseVec = this.noise.noiseVector(
        position.x * frequency + this.globalTime * 0.3,
        position.y * frequency + this.globalTime * 0.2,
        position.z * frequency + this.globalTime * 0.1
      );

      totalForce.x += noiseVec.x * amplitude;
      totalForce.y += noiseVec.y * amplitude;
      totalForce.z += noiseVec.z * amplitude;

      frequency *= 2;
      amplitude *= 0.5;
    }

    return new Vector3(
      totalForce.x * strength,
      totalForce.y * strength,
      totalForce.z * strength
    );
  }

  /**
   * Curl Noise - 无散度噪声场 (核心！让运动像丝绸般流动)
   * 
   * Curl = ∇ × F
   * 这种力场不会让粒子堆积在一起，产生极其自然的流动效果
   */
  private calculateCurlNoise(field: ForceField, position: Vector3): Vector3 {
    const freq = field.noiseFrequency || 0.02;  // 低频 = 大尺度卷曲
    const strength = field.strength;
    const eps = 0.01; // 用于数值微分的小量

    // 使用有限差分计算 Curl
    // Curl(F).x = dFz/dy - dFy/dz
    // Curl(F).y = dFx/dz - dFz/dx
    // Curl(F).z = dFy/dx - dFx/dy

    const sampleAt = (px: number, py: number, pz: number): Vector3 => {
      return new Vector3(
        this.noise.noise(px * freq + this.globalTime * 0.1, py * freq, pz * freq),
        this.noise.noise(px * freq + 31.416, py * freq + this.globalTime * 0.1, pz * freq + 47.853),
        this.noise.noise(px * freq + 96.247, py * freq + 11.239, pz * freq + this.globalTime * 0.1)
      );
    };

    const x = position.x, y = position.y, z = position.z;

    // 采样偏移点
    const pxp = sampleAt(x + eps, y, z);
    const pxn = sampleAt(x - eps, y, z);
    const pyp = sampleAt(x, y + eps, z);
    const pyn = sampleAt(x, y - eps, z);
    const pzp = sampleAt(x, y, z + eps);
    const pzn = sampleAt(x, y, z - eps);

    // 数值微分
    const dFx_dy = (pyp.x - pyn.x) / (2 * eps);
    const dFx_dz = (pzp.x - pzn.x) / (2 * eps);
    const dFy_dx = (pxp.y - pxn.y) / (2 * eps);
    const dFy_dz = (pzp.y - pzn.y) / (2 * eps);
    const dFz_dx = (pxp.z - pxn.z) / (2 * eps);
    const dFz_dy = (pyp.z - pyn.z) / (2 * eps);

    // Curl 计算
    return new Vector3(
      (dFz_dy - dFy_dz) * strength,
      (dFx_dz - dFz_dx) * strength,
      (dFy_dx - dFx_dy) * strength
    );
  }

  /**
   * 呼吸效果 - 让整体形状像呼吸一样起伏
   * 用于实体生物类（凤凰、龙等）保持形状时的微动画
   */
  private calculateBreathe(field: ForceField, position: Vector3): Vector3 {
    const center = field.center || new Vector3(0, 0, 0);
    const frequency = field.noiseFrequency || 1; // 呼吸频率
    const amplitude = field.noiseAmplitude || 5; // 呼吸幅度
    const strength = field.strength;

    // 从中心向外的方向
    const dx = position.x - center.x;
    const dy = position.y - center.y;
    const dz = position.z - center.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;

    // 呼吸周期 - 使用正弦波
    const breathPhase = Math.sin(this.globalTime * frequency * Math.PI * 2);
    
    // 效果随距离衰减
    const distanceFactor = Math.min(1, dist / 50);

    // 呼吸力 = 向外推（吸气）或向内拉（呼气）
    const forceMagnitude = breathPhase * amplitude * strength * distanceFactor;

    return new Vector3(
      (dx / dist) * forceMagnitude,
      (dy / dist) * forceMagnitude * 0.5, // Y方向减弱一半
      (dz / dist) * forceMagnitude
    );
  }

  /**
   * 翅膀拍动 - 让两侧粒子上下摆动
   */
  private calculateWingFlap(field: ForceField, position: Vector3): Vector3 {
    const center = field.center || new Vector3(0, 0, 0);
    const frequency = field.noiseFrequency || 2; // 拍打频率
    const amplitude = field.noiseAmplitude || 20; // 拍打幅度
    const strength = field.strength;

    // X 轴方向的偏移决定翅膀位置
    const xOffset = position.x - center.x;
    
    // 翅膀因子 - 越靠边缘摆动越大
    const wingFactor = Math.abs(xOffset) / 30; // 假设翅膀展开30单位
    
    // 拍打相位 - 两侧相反
    const flapPhase = Math.sin(this.globalTime * frequency * Math.PI * 2);
    
    // Y 方向的力
    const yForce = flapPhase * amplitude * wingFactor * strength * Math.sign(xOffset);

    return new Vector3(0, yForce, 0);
  }

  /**
   * 计算加速度 (F / m)
   */
  calculateAcceleration(position: Vector3, velocity: Vector3, mass: number = 1): Vector3 {
    const force = this.calculateTotalForce(position, velocity, mass);
    return new Vector3(
      force.x / mass,
      force.y / mass,
      force.z / mass
    );
  }

  /**
   * 获取全局时间
   */
  getTime(): number {
    return this.globalTime;
  }

  /**
   * 重置时间
   */
  resetTime(): void {
    this.globalTime = 0;
  }
}

// 导出全局实例
export const globalForceFieldSystem = new ForceFieldSystem();

// END OF FILE: src/core/stream/ForceFieldSystem.ts
