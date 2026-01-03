// FILE: src/core/effects/DragonPath.ts
// 龙形特效路径 - 图案化上升轨迹

import { Vector3 } from '../Vector3';

/**
 * 特效图案类型
 */
export enum EffectPatternType {
  // 动物类
  DRAGON = 'dragon',           // 龙
  PHOENIX = 'phoenix',         // 凤凰
  QILIN = 'qilin',             // 麒麟
  CRANE = 'crane',             // 仙鹤
  KOI = 'koi',                 // 锦鲤
  BUTTERFLY = 'butterfly',     // 蝴蝶
  EAGLE = 'eagle',             // 鹰
  
  // 神兽类
  ZHUQUE = 'zhuque',           // 朱雀 (南方)
  QINGLONG = 'qinglong',       // 青龙 (东方)
  BAIHU = 'baihu',             // 白虎 (西方)
  XUANWU = 'xuanwu',           // 玄武 (北方)
  
  // 自然类
  PLUM = 'plum',               // 梅花
  BAMBOO = 'bamboo',           // 竹子
  CHRYSANTHEMUM = 'chrysanthemum', // 菊花
  ORCHID = 'orchid',           // 兰花
  LOTUS = 'lotus',             // 莲花
  MAPLE = 'maple',             // 枫叶
  
  // 文化类
  CLOUD = 'cloud',             // 祥云
  RUYI = 'ruyi',               // 如意
  CHINESE_KNOT = 'chinese_knot', // 中国结
}

/**
 * 特效信息
 */
export const EFFECT_PATTERN_INFO: Record<EffectPatternType, { 
  name: string; 
  icon: string; 
  description: string;
  controlPoints: number;
}> = {
  [EffectPatternType.DRAGON]: { name: '神龙', icon: '🐉', description: '蜿蜒升腾的神龙', controlPoints: 150 },
  [EffectPatternType.PHOENIX]: { name: '凤凰', icon: '🦅', description: '涅槃重生的凤凰', controlPoints: 120 },
  [EffectPatternType.QILIN]: { name: '麒麟', icon: '🦌', description: '祥瑞之兽', controlPoints: 100 },
  [EffectPatternType.CRANE]: { name: '仙鹤', icon: '🦢', description: '长寿仙禽', controlPoints: 80 },
  [EffectPatternType.KOI]: { name: '锦鲤', icon: '🐟', description: '跃龙门的锦鲤', controlPoints: 60 },
  [EffectPatternType.BUTTERFLY]: { name: '蝴蝶', icon: '🦋', description: '翩翩起舞', controlPoints: 50 },
  [EffectPatternType.EAGLE]: { name: '雄鹰', icon: '🦅', description: '展翅高飞', controlPoints: 90 },
  
  [EffectPatternType.ZHUQUE]: { name: '朱雀', icon: '🔥', description: '南方神兽', controlPoints: 110 },
  [EffectPatternType.QINGLONG]: { name: '青龙', icon: '🌿', description: '东方神兽', controlPoints: 140 },
  [EffectPatternType.BAIHU]: { name: '白虎', icon: '🐅', description: '西方神兽', controlPoints: 100 },
  [EffectPatternType.XUANWU]: { name: '玄武', icon: '🐢', description: '北方神兽', controlPoints: 90 },
  
  [EffectPatternType.PLUM]: { name: '梅花', icon: '🌸', description: '傲雪寒梅', controlPoints: 40 },
  [EffectPatternType.BAMBOO]: { name: '竹子', icon: '🎋', description: '节节高升', controlPoints: 30 },
  [EffectPatternType.CHRYSANTHEMUM]: { name: '菊花', icon: '🌼', description: '秋菊傲霜', controlPoints: 50 },
  [EffectPatternType.ORCHID]: { name: '兰花', icon: '💮', description: '空谷幽兰', controlPoints: 35 },
  [EffectPatternType.LOTUS]: { name: '莲花', icon: '🪷', description: '出淤泥而不染', controlPoints: 60 },
  [EffectPatternType.MAPLE]: { name: '枫叶', icon: '🍁', description: '秋日红叶', controlPoints: 25 },
  
  [EffectPatternType.CLOUD]: { name: '祥云', icon: '☁', description: '吉祥如意', controlPoints: 40 },
  [EffectPatternType.RUYI]: { name: '如意', icon: '🎐', description: '万事如意', controlPoints: 30 },
  [EffectPatternType.CHINESE_KNOT]: { name: '中国结', icon: '🎀', description: '平安喜乐', controlPoints: 80 },
};

/**
 * 龙形路径点
 */
export interface DragonSegment {
  position: Vector3;
  size: number;       // 该段粗细
  hue: number;        // 色相
  alpha: number;      // 透明度
  type: 'head' | 'horn' | 'eye' | 'whisker' | 'body' | 'claw' | 'tail';
}

/**
 * 龙形效果状态
 */
export interface DragonEffectState {
  phase: 'generating' | 'rising' | 'dissipating' | 'complete';
  progress: number;   // 当前阶段进度 (0-1)
  segments: DragonSegment[];
  position: Vector3;  // 整体位置
  velocity: Vector3;  // 整体速度
  lifeTime: number;
}

/**
 * 龙形路径生成器
 */
export class DragonPathGenerator {
  private segments: DragonSegment[] = [];
  private basePosition: Vector3;
  private baseHue: number;
  
  // 龙身参数
  private bodyLength: number = 30;   // 龙身节数
  private bodyWaveAmp: number = 20;  // 波动幅度
  private bodyWaveFreq: number = 3;  // 波动频率
  private headSize: number = 15;
  private tailTaper: number = 0.6;   // 尾部渐细比例
  
  constructor(startPosition: Vector3, hue: number = 45) {
    this.basePosition = startPosition.clone();
    this.baseHue = hue; // 金色
  }
  
  /**
   * 生成完整龙形路径
   * 按顺序：龙角 → 龙眼 → 龙鼻 → 龙须 → 龙身 → 龙爪 → 龙尾
   */
  generateDragonPath(): DragonSegment[] {
    this.segments = [];
    
    // 龙头 (基于起始位置)
    this.generateHead();
    
    // 龙身 (蜿蜒向上)
    this.generateBody();
    
    // 龙尾 (渐细)
    this.generateTail();
    
    // 龙爪 (两对)
    this.generateClaws();
    
    return this.segments;
  }
  
  private generateHead(): void {
    const headCenter = this.basePosition.clone();
    
    // 龙头主体
    for (let i = 0; i < 10; i++) {
      const t = i / 10;
      const angle = t * Math.PI * 0.3;
      this.segments.push({
        position: new Vector3(
          headCenter.x + Math.cos(angle) * this.headSize * (1 - t * 0.3),
          headCenter.y + t * 5,
          headCenter.z + Math.sin(angle) * this.headSize * 0.5
        ),
        size: this.headSize * (1 - t * 0.2),
        hue: this.baseHue,
        alpha: 1,
        type: 'head'
      });
    }
    
    // 龙角 (两只)
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 5; i++) {
        const t = i / 5;
        this.segments.push({
          position: new Vector3(
            headCenter.x + side * 8 + side * t * 5,
            headCenter.y + 10 + t * 20,
            headCenter.z - 5 + t * 3
          ),
          size: 4 * (1 - t * 0.7),
          hue: this.baseHue + 20,
          alpha: 1,
          type: 'horn'
        });
      }
    }
    
    // 龙眼 (两只)
    for (let side = -1; side <= 1; side += 2) {
      this.segments.push({
        position: new Vector3(
          headCenter.x + side * 6,
          headCenter.y + 5,
          headCenter.z + 8
        ),
        size: 5,
        hue: 0, // 红色
        alpha: 1,
        type: 'eye'
      });
    }
    
    // 龙须 (四根)
    for (let side = -1; side <= 1; side += 2) {
      for (let row = 0; row < 2; row++) {
        for (let i = 0; i < 8; i++) {
          const t = i / 8;
          const wave = Math.sin(t * Math.PI * 3) * 3;
          this.segments.push({
            position: new Vector3(
              headCenter.x + side * (10 + t * 25),
              headCenter.y + 2 - row * 3 + wave,
              headCenter.z + 10 + t * 5
            ),
            size: 2 * (1 - t * 0.8),
            hue: this.baseHue + 10,
            alpha: 0.8 - t * 0.3,
            type: 'whisker'
          });
        }
      }
    }
  }
  
  private generateBody(): void {
    // 龙身：正弦波蜿蜒向上
    for (let i = 0; i < this.bodyLength; i++) {
      const t = i / this.bodyLength;
      const y = this.basePosition.y + 20 + t * 150; // 向上延伸
      const wave = Math.sin(t * Math.PI * this.bodyWaveFreq) * this.bodyWaveAmp;
      const waveZ = Math.cos(t * Math.PI * this.bodyWaveFreq * 0.7) * this.bodyWaveAmp * 0.5;
      
      // 龙身变细
      const bodySize = this.headSize * 0.8 * (1 - t * this.tailTaper * 0.5);
      
      this.segments.push({
        position: new Vector3(
          this.basePosition.x + wave,
          y,
          this.basePosition.z + waveZ
        ),
        size: bodySize,
        hue: this.baseHue + t * 30, // 渐变色
        alpha: 1 - t * 0.1,
        type: 'body'
      });
    }
  }
  
  private generateTail(): void {
    const lastBody = this.segments[this.segments.length - 1];
    const tailStart = lastBody.position.clone();
    
    // 龙尾：继续向上，渐细，末端分叉
    for (let i = 0; i < 15; i++) {
      const t = i / 15;
      const y = tailStart.y + t * 40;
      const wave = Math.sin(t * Math.PI * 4) * 15 * (1 - t);
      
      this.segments.push({
        position: new Vector3(
          tailStart.x + wave,
          y,
          tailStart.z + Math.cos(t * Math.PI * 3) * 8
        ),
        size: 8 * (1 - t * 0.9),
        hue: this.baseHue + 40,
        alpha: 1 - t * 0.5,
        type: 'tail'
      });
    }
  }
  
  private generateClaws(): void {
    // 在龙身上找两对爪子位置
    const bodySegments = this.segments.filter(s => s.type === 'body');
    const clawPositions = [
      bodySegments[Math.floor(bodySegments.length * 0.2)],
      bodySegments[Math.floor(bodySegments.length * 0.6)]
    ];
    
    for (const base of clawPositions) {
      if (!base) continue;
      
      // 每对爪子两只
      for (let side = -1; side <= 1; side += 2) {
        for (let i = 0; i < 6; i++) {
          const t = i / 6;
          this.segments.push({
            position: new Vector3(
              base.position.x + side * (10 + t * 20),
              base.position.y - t * 15,
              base.position.z + (Math.random() - 0.5) * 5
            ),
            size: 4 * (1 - t * 0.6),
            hue: this.baseHue + 15,
            alpha: 1 - t * 0.3,
            type: 'claw'
          });
        }
      }
    }
  }
  
  /**
   * 获取指定进度的部分路径 (用于逐步生成动画)
   * @param progress 0-1, 生成进度
   */
  getPartialPath(progress: number): DragonSegment[] {
    const fullPath = this.generateDragonPath();
    const count = Math.floor(fullPath.length * Math.min(1, progress));
    return fullPath.slice(0, count);
  }
  
  /**
   * 更新龙身波动动画
   * @param segments 当前路径
   * @param time 时间
   * @param risingSpeed 上升速度
   */
  static animateRising(
    segments: DragonSegment[], 
    time: number, 
    risingSpeed: number = 0.5
  ): DragonSegment[] {
    return segments.map((seg, i) => {
      const t = i / segments.length;
      
      // 整体上升
      const newY = seg.position.y + risingSpeed;
      
      // 身体波动
      let waveX = 0, waveZ = 0;
      if (seg.type === 'body' || seg.type === 'tail') {
        waveX = Math.sin(time * 3 + t * Math.PI * 4) * 5;
        waveZ = Math.cos(time * 2 + t * Math.PI * 3) * 3;
      }
      
      // 龙须飘动
      if (seg.type === 'whisker') {
        waveX = Math.sin(time * 5 + i * 0.5) * 8;
      }
      
      return {
        ...seg,
        position: new Vector3(
          seg.position.x + waveX,
          newY,
          seg.position.z + waveZ
        )
      };
    });
  }
  
  /**
   * 消散动画：从尾部开始消失
   * @param segments 当前路径
   * @param progress 消散进度 0-1
   */
  static animateDissipate(
    segments: DragonSegment[],
    progress: number
  ): DragonSegment[] {
    return segments.map((seg, i) => {
      const t = i / segments.length;
      
      // 从尾部向头部消散
      const dissipateThreshold = progress;
      const fadeStart = 1 - t; // 尾部先消散
      
      if (fadeStart < dissipateThreshold) {
        const localFade = (dissipateThreshold - fadeStart) / 0.3;
        return {
          ...seg,
          alpha: Math.max(0, seg.alpha * (1 - localFade)),
          size: seg.size * (1 - localFade * 0.5),
          // 向上飘散
          position: new Vector3(
            seg.position.x + (Math.random() - 0.5) * 10 * localFade,
            seg.position.y + localFade * 20,
            seg.position.z + (Math.random() - 0.5) * 10 * localFade
          )
        };
      }
      
      return seg;
    });
  }
}

// END OF FILE: src/core/effects/DragonPath.ts
