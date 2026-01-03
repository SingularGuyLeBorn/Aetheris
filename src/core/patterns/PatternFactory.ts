// FILE: src/core/patterns/PatternFactory.ts
// 地面图案工厂：八卦阵、太极图、五行阵、几何图形等

import * as THREE from 'three';

/**
 * 图案类型枚举
 */
export enum PatternType {
  // 中国传统法阵系列
  BAGUA = 'bagua',                    // 八卦阵
  TAIJI = 'taiji',                    // 太极图
  WUXING = 'wuxing',                  // 五行阵
  JIUGONG = 'jiugong',                // 九宫格
  
  // 几何图形系列
  POLYGON_3 = 'polygon_3',            // 三角形
  POLYGON_4 = 'polygon_4',            // 正方形
  POLYGON_5 = 'polygon_5',            // 五边形
  POLYGON_6 = 'polygon_6',            // 六边形
  POLYGON_8 = 'polygon_8',            // 八边形
  POLYGON_12 = 'polygon_12',          // 十二边形
  
  STAR_5 = 'star_5',                  // 五角星
  STAR_6 = 'star_6',                  // 六芒星
  STAR_8 = 'star_8',                  // 八角星
  
  SPIRAL_ARCHIMEDEAN = 'spiral_arch', // 阿基米德螺旋
  SPIRAL_LOG = 'spiral_log',          // 对数螺旋
  
  // 简单形状
  CIRCLE = 'circle',
  GRID = 'grid',
  CROSS = 'cross',
  
  // 自定义
  CUSTOM = 'custom'
}

/**
 * 图案信息
 */
export const PATTERN_INFO: Record<PatternType, { name: string; icon: string; description: string }> = {
  [PatternType.BAGUA]: { name: '八卦阵', icon: '☯', description: '乾坤震巽坎离艮兑' },
  [PatternType.TAIJI]: { name: '太极图', icon: '☯', description: '阴阳交融' },
  [PatternType.WUXING]: { name: '五行阵', icon: '🔥', description: '金木水火土' },
  [PatternType.JIUGONG]: { name: '九宫格', icon: '⬜', description: '洛书九宫' },
  
  [PatternType.POLYGON_3]: { name: '三角形', icon: '△', description: '三边形' },
  [PatternType.POLYGON_4]: { name: '正方形', icon: '□', description: '四边形' },
  [PatternType.POLYGON_5]: { name: '五边形', icon: '⬠', description: '五边形' },
  [PatternType.POLYGON_6]: { name: '六边形', icon: '⬡', description: '六边形' },
  [PatternType.POLYGON_8]: { name: '八边形', icon: '⯃', description: '八边形' },
  [PatternType.POLYGON_12]: { name: '十二边形', icon: '◯', description: '十二边形' },
  
  [PatternType.STAR_5]: { name: '五角星', icon: '⭐', description: '五角星' },
  [PatternType.STAR_6]: { name: '六芒星', icon: '✡', description: '大卫之星' },
  [PatternType.STAR_8]: { name: '八角星', icon: '✴', description: '八角星' },
  
  [PatternType.SPIRAL_ARCHIMEDEAN]: { name: '阿基米德螺旋', icon: '🌀', description: '等距螺旋' },
  [PatternType.SPIRAL_LOG]: { name: '对数螺旋', icon: '🐚', description: '黄金螺旋' },
  
  [PatternType.CIRCLE]: { name: '圆环', icon: '⭕', description: '简单圆环' },
  [PatternType.GRID]: { name: '网格', icon: '#', description: '方格网' },
  [PatternType.CROSS]: { name: '十字', icon: '✚', description: '十字形' },
  
  [PatternType.CUSTOM]: { name: '自定义', icon: '✏', description: 'SVG/手绘' }
};

/**
 * 图案配置
 */
export interface PatternConfig {
  type: PatternType;
  scale: number;           // 缩放 (0.5 - 5)
  rotation: number;        // 旋转角度 (弧度)
  strokeColor: string;     // 描边颜色
  fillColor?: string;      // 填充颜色
  opacity: number;         // 透明度
  lineWidth: number;       // 线宽
  animated: boolean;       // 是否动画
  animationType?: 'breathe' | 'rotate' | 'pulse';
  customSVG?: string;      // 自定义 SVG 路径
}

/**
 * 图案点集
 */
export interface PatternPoints {
  lines: Array<THREE.Vector3[]>;  // 线段集合
  circles: Array<{ center: THREE.Vector3; radius: number }>;
  polygons: Array<THREE.Vector3[]>;
  text: Array<{ position: THREE.Vector3; content: string; size: number }>;
}

/**
 * 图案工厂
 */
export class PatternFactory {
  
  /**
   * 生成图案点集
   */
  static generate(config: PatternConfig): PatternPoints {
    const result: PatternPoints = {
      lines: [],
      circles: [],
      polygons: [],
      text: []
    };
    
    const scale = config.scale || 1;
    const baseRadius = 100 * scale;
    
    switch (config.type) {
      case PatternType.BAGUA:
        this.generateBagua(result, baseRadius);
        break;
      case PatternType.TAIJI:
        this.generateTaiji(result, baseRadius);
        break;
      case PatternType.WUXING:
        this.generateWuxing(result, baseRadius);
        break;
      case PatternType.JIUGONG:
        this.generateJiugong(result, baseRadius);
        break;
      case PatternType.STAR_5:
      case PatternType.STAR_6:
      case PatternType.STAR_8:
        this.generateStar(result, baseRadius, parseInt(config.type.split('_')[1]));
        break;
      case PatternType.POLYGON_3:
      case PatternType.POLYGON_4:
      case PatternType.POLYGON_5:
      case PatternType.POLYGON_6:
      case PatternType.POLYGON_8:
      case PatternType.POLYGON_12:
        this.generatePolygon(result, baseRadius, parseInt(config.type.split('_')[1]));
        break;
      case PatternType.SPIRAL_ARCHIMEDEAN:
        this.generateSpiral(result, baseRadius, 'archimedean');
        break;
      case PatternType.SPIRAL_LOG:
        this.generateSpiral(result, baseRadius, 'logarithmic');
        break;
      case PatternType.CIRCLE:
        this.generateCircle(result, baseRadius);
        break;
      case PatternType.GRID:
        this.generateGrid(result, baseRadius);
        break;
      case PatternType.CROSS:
        this.generateCross(result, baseRadius);
        break;
    }
    
    // 应用旋转
    if (config.rotation !== 0) {
      this.applyRotation(result, config.rotation);
    }
    
    return result;
  }
  
  /**
   * 生成八卦阵
   */
  private static generateBagua(result: PatternPoints, radius: number): void {
    // 外圆
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius });
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius * 0.7 });
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius * 0.4 });
    
    // 八个卦象位置
    const trigrams = ['乾', '兑', '离', '震', '巽', '坎', '艮', '坤'];
    const trigramPatterns = [
      [1, 1, 1], // 乾 ☰
      [0, 1, 1], // 兑 ☱
      [1, 0, 1], // 离 ☲
      [0, 0, 1], // 震 ☳
      [1, 1, 0], // 巽 ☴
      [0, 1, 0], // 坎 ☵
      [1, 0, 0], // 艮 ☶
      [0, 0, 0], // 坤 ☷
    ];
    
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI / 4) - Math.PI / 2;
      const x = Math.cos(angle) * radius * 0.85;
      const z = Math.sin(angle) * radius * 0.85;
      
      // 卦象线条 (阳爻实线，阴爻虚线)
      const pattern = trigramPatterns[i];
      for (let j = 0; j < 3; j++) {
        const lineY = (j - 1) * 8;
        const lineLen = 15;
        const perpAngle = angle + Math.PI / 2;
        
        if (pattern[j] === 1) {
          // 阳爻 - 实线
          result.lines.push([
            new THREE.Vector3(
              x + Math.cos(perpAngle) * lineLen,
              0,
              z + Math.sin(perpAngle) * lineLen + lineY * 0.5
            ),
            new THREE.Vector3(
              x - Math.cos(perpAngle) * lineLen,
              0,
              z - Math.sin(perpAngle) * lineLen + lineY * 0.5
            )
          ]);
        } else {
          // 阴爻 - 断开
          result.lines.push([
            new THREE.Vector3(x + Math.cos(perpAngle) * lineLen, 0, z + Math.sin(perpAngle) * lineLen + lineY * 0.5),
            new THREE.Vector3(x + Math.cos(perpAngle) * 3, 0, z + Math.sin(perpAngle) * 3 + lineY * 0.5)
          ]);
          result.lines.push([
            new THREE.Vector3(x - Math.cos(perpAngle) * 3, 0, z - Math.sin(perpAngle) * 3 + lineY * 0.5),
            new THREE.Vector3(x - Math.cos(perpAngle) * lineLen, 0, z - Math.sin(perpAngle) * lineLen + lineY * 0.5)
          ]);
        }
      }
      
      // 文字标签
      result.text.push({
        position: new THREE.Vector3(x * 1.15, 0, z * 1.15),
        content: trigrams[i],
        size: 12
      });
    }
    
    // 中心太极
    this.generateTaiji(result, radius * 0.35);
  }
  
  /**
   * 生成太极图
   */
  private static generateTaiji(result: PatternPoints, radius: number): void {
    // 外圆
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius });
    
    // S形曲线 (用线段近似)
    const sCurve: THREE.Vector3[] = [];
    for (let t = 0; t <= 1; t += 0.02) {
      const angle = t * Math.PI;
      const r = radius * 0.5;
      const x = Math.sin(angle * 2) * r * 0.5;
      const z = -radius + t * radius * 2;
      sCurve.push(new THREE.Vector3(x, 0, z));
    }
    result.lines.push(sCurve);
    
    // 阴阳眼
    result.circles.push({ center: new THREE.Vector3(0, 0, -radius * 0.5), radius: radius * 0.15 });
    result.circles.push({ center: new THREE.Vector3(0, 0, radius * 0.5), radius: radius * 0.15 });
  }
  
  /**
   * 生成五行阵
   */
  private static generateWuxing(result: PatternPoints, radius: number): void {
    // 五行: 金木水火土，对应五角星顶点
    const elements = ['金', '木', '水', '火', '土'];
    const colors = ['#FFD700', '#228B22', '#1E90FF', '#FF4500', '#8B4513'];
    
    // 外圆
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius });
    
    // 五角星
    const starPoints: THREE.Vector3[] = [];
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      starPoints.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    
    // 五角星连线 (相生相克)
    for (let i = 0; i < 5; i++) {
      result.lines.push([starPoints[i], starPoints[(i + 2) % 5]]);
    }
    
    // 元素标签
    for (let i = 0; i < 5; i++) {
      const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
      result.text.push({
        position: new THREE.Vector3(
          Math.cos(angle) * radius * 1.2,
          0,
          Math.sin(angle) * radius * 1.2
        ),
        content: elements[i],
        size: 14
      });
    }
  }
  
  /**
   * 生成九宫格
   */
  private static generateJiugong(result: PatternPoints, radius: number): void {
    const size = radius * 2;
    const cellSize = size / 3;
    
    // 水平线
    for (let i = 0; i <= 3; i++) {
      const z = -radius + i * cellSize;
      result.lines.push([
        new THREE.Vector3(-radius, 0, z),
        new THREE.Vector3(radius, 0, z)
      ]);
    }
    
    // 垂直线
    for (let i = 0; i <= 3; i++) {
      const x = -radius + i * cellSize;
      result.lines.push([
        new THREE.Vector3(x, 0, -radius),
        new THREE.Vector3(x, 0, radius)
      ]);
    }
    
    // 洛书数字
    const luoshu = [
      [4, 9, 2],
      [3, 5, 7],
      [8, 1, 6]
    ];
    
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        result.text.push({
          position: new THREE.Vector3(
            -radius + cellSize * (col + 0.5),
            0,
            -radius + cellSize * (row + 0.5)
          ),
          content: luoshu[row][col].toString(),
          size: 16
        });
      }
    }
  }
  
  /**
   * 生成多边形
   */
  private static generatePolygon(result: PatternPoints, radius: number, sides: number): void {
    const points: THREE.Vector3[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = (i * 2 * Math.PI / sides) - Math.PI / 2;
      points.push(new THREE.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }
    points.push(points[0].clone()); // 闭合
    result.polygons.push(points);
  }
  
  /**
   * 生成星形
   */
  private static generateStar(result: PatternPoints, radius: number, points: number): void {
    const outer = radius;
    const inner = radius * 0.4;
    const starPoints: THREE.Vector3[] = [];
    
    for (let i = 0; i < points * 2; i++) {
      const angle = (i * Math.PI / points) - Math.PI / 2;
      const r = i % 2 === 0 ? outer : inner;
      starPoints.push(new THREE.Vector3(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r
      ));
    }
    starPoints.push(starPoints[0].clone());
    result.polygons.push(starPoints);
  }
  
  /**
   * 生成螺旋
   */
  private static generateSpiral(result: PatternPoints, radius: number, type: 'archimedean' | 'logarithmic'): void {
    const spiral: THREE.Vector3[] = [];
    const turns = 5;
    const steps = 200;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = turns * 2 * Math.PI * t;
      
      let r: number;
      if (type === 'archimedean') {
        r = radius * t;
      } else {
        r = radius * 0.1 * Math.exp(0.3 * angle);
        if (r > radius) break;
      }
      
      spiral.push(new THREE.Vector3(
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r
      ));
    }
    
    result.lines.push(spiral);
  }
  
  /**
   * 生成圆环
   */
  private static generateCircle(result: PatternPoints, radius: number): void {
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius });
    result.circles.push({ center: new THREE.Vector3(0, 0, 0), radius: radius * 0.8 });
  }
  
  /**
   * 生成网格
   */
  private static generateGrid(result: PatternPoints, radius: number): void {
    const spacing = radius / 5;
    for (let i = -5; i <= 5; i++) {
      result.lines.push([
        new THREE.Vector3(i * spacing, 0, -radius),
        new THREE.Vector3(i * spacing, 0, radius)
      ]);
      result.lines.push([
        new THREE.Vector3(-radius, 0, i * spacing),
        new THREE.Vector3(radius, 0, i * spacing)
      ]);
    }
  }
  
  /**
   * 生成十字
   */
  private static generateCross(result: PatternPoints, radius: number): void {
    result.lines.push([
      new THREE.Vector3(0, 0, -radius),
      new THREE.Vector3(0, 0, radius)
    ]);
    result.lines.push([
      new THREE.Vector3(-radius, 0, 0),
      new THREE.Vector3(radius, 0, 0)
    ]);
  }
  
  /**
   * 应用旋转
   */
  private static applyRotation(points: PatternPoints, angle: number): void {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    
    const rotate = (v: THREE.Vector3) => {
      const x = v.x * cos - v.z * sin;
      const z = v.x * sin + v.z * cos;
      v.x = x;
      v.z = z;
    };
    
    points.lines.forEach(line => line.forEach(rotate));
    points.circles.forEach(c => rotate(c.center));
    points.polygons.forEach(poly => poly.forEach(rotate));
    points.text.forEach(t => rotate(t.position));
  }
  
  /**
   * 获取所有可用图案类型
   */
  static getAllTypes(): PatternType[] {
    return Object.values(PatternType).filter(t => t !== PatternType.CUSTOM);
  }
  
  /**
   * 创建 Three.js 线条对象
   */
  static createLineObject(points: PatternPoints, config: PatternConfig): THREE.Group {
    const group = new THREE.Group();
    
    const lineMaterial = new THREE.LineBasicMaterial({
      color: config.strokeColor || '#10b981',
      transparent: true,
      opacity: config.opacity || 0.6,
      linewidth: config.lineWidth || 2
    });
    
    // 添加线段
    points.lines.forEach(linePoints => {
      const geometry = new THREE.BufferGeometry().setFromPoints(linePoints);
      const line = new THREE.Line(geometry, lineMaterial);
      group.add(line);
    });
    
    // 添加多边形
    points.polygons.forEach(polyPoints => {
      const geometry = new THREE.BufferGeometry().setFromPoints(polyPoints);
      const line = new THREE.Line(geometry, lineMaterial);
      group.add(line);
    });
    
    // 添加圆
    points.circles.forEach(circle => {
      const geometry = new THREE.RingGeometry(
        circle.radius - 1,
        circle.radius,
        64
      );
      const mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshBasicMaterial({
          color: config.strokeColor || '#10b981',
          transparent: true,
          opacity: config.opacity || 0.6,
          side: THREE.DoubleSide
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.copy(circle.center);
      group.add(mesh);
    });
    
    group.position.y = -49; // 略高于地面网格
    
    return group;
  }
}

// END OF FILE: src/core/patterns/PatternFactory.ts
