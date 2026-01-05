# 🎆 Aetheris Stream Architecture

## "一切皆流" (Everything is a Stream)

This document describes the revolutionary stream-based firework engine architecture.

---

## 📐 Core Philosophy

Traditional fireworks: **Phases** (Launch → Explode → Fade)

Stream Architecture: **Timeline Containers** with **Particle Streams**

> "Explosion" is not a phase. It's a **State Mutation** at a specific moment.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        DIRECTOR                                  │
│  (Global Clock, Instance Management, Manifest→Runtime)          │
└─────────────────────────────────────────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CarrierSystem  │  │  ParticleStream │  │  StreamRenderer │
│  (Launch Phase) │  │  (Payload Phase)│  │  (GPU Rendering)│
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                    │
         │           ┌────────┼────────┐
         ▼           ▼        ▼        ▼
   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
   │  Trail   │ │  Force   │ │ Morphing │ │  Shape   │
   │ Particles│ │  Fields  │ │  Engine  │ │ Generator│
   └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## 📁 File Structure

```
src/core/stream/
├── types.ts                 # All TypeScript interfaces & curves
├── Director.ts              # Main orchestrator (heartbeat)
├── CarrierSystem.ts         # Launch trajectory & trails
├── ParticleStream.ts        # Particle lifecycle & state
├── ForceFieldSystem.ts      # Physics forces (gravity, wind, etc.)
├── MorphingEngine.ts        # Shape-to-shape transitions ⭐
├── StreamRenderer.ts        # GPU instanced rendering
├── index.ts                 # Main entry point
└── presets/
    ├── PhoenixRebirth.json  # 🔥 凤凰涅槃
    ├── HeartToText.json     # ❤️ 爱的箴言
    └── DragonDance.json     # 🐉 游龙戏珠
```

---

## 🔑 Key Components

### 1. Director (总导演)
- Global clock management
- Converts `FireworkManifest` JSON → Runtime instances
- Coordinates all subsystems
- Statistical tracking

### 2. CarrierSystem (运载系统)
- 3D Bezier/Spiral/Helix path calculation
- Trail particle emission
- Arrival detection → triggers payload

### 3. ParticleStream (粒子流)
- Object pooling for performance
- State machine: IDLE → SPAWNING → ACTIVE → MORPHING → FADING → EXTINCT
- Integrates with ForceFieldSystem and MorphingEngine

### 4. ForceFieldSystem (力场系统)
- **Gravity**: `F = m * g * direction`
- **Attraction/Repulsion**: `F = k / d²`
- **Drag**: `F = -k * v²`
- **Wind**: Time-varying directional force
- **Vortex**: Rotational force around axis
- **Turbulence**: Multi-octave Perlin noise

### 5. MorphingEngine (变形引擎) ⭐
The magic behind "Phoenix Rebirth":
- Particle-to-target point matching (greedy algorithm)
- Three modes: `smooth` (interpolation), `snap` (instant), `physics` (attraction forces)
- Enables seamless shape transitions

### 6. StreamRenderer (流渲染器)
- Three.js `InstancedMesh` for 50,000+ particles
- Custom GLSL shaders for billboarding
- HSL → RGB color conversion
- Additive blending for glow effect

---

## 📜 FireworkManifest Schema

```typescript
interface FireworkManifest {
  id: string;
  name: string;
  duration: number;
  
  carrier: {
    type: 'projectile' | 'invisible' | 'comet';
    path: { type: 'linear' | 'bezier_3d' | 'spiral' | 'helix' | 'arc' };
    duration: number;
    trail?: TrailConfig;
  };
  
  payload: {
    stages: PayloadStage[];  // Time-triggered events
  };
}

interface PayloadStage {
  timeOffset: number;    // When to trigger (seconds after carrier arrives)
  duration: number;
  topology: { source: Shape3DType, resolution: number, scale: number };
  dynamics: { transitionMode: 'explode' | 'morph' | 'maintain' | 'scatter', ... };
  rendering: { colorMap: Gradient, blending: 'additive' | 'normal', ... };
  reuseParticles?: boolean;  // Key for morphing!
}
```

---

## 🎨 Preset Effects

### 🔥 Phoenix Rebirth (凤凰涅槃)
1. **0s-1s**: Fireball explosion (sphere, radial burst)
2. **1s-3s**: Morph to phoenix shape (attraction forces)
3. **3s-5s**: Phoenix wing animation (turbulence shader)
4. **5s-8s**: Scatter as ashes (gravity + wind)

### ❤️ Heart to Text (爱的箴言)
1. **0s-2s**: Heart explosion
2. **2s-4.5s**: Morph to "LOVE" text
3. **4.5s-7s**: Glowing text with shimmer

### 🐉 Dragon Dance (游龙戏珠)
1. **0s-1.5s**: Vortex explosion
2. **1.5s-4s**: Morph to dragon
3. **4s-7s**: Dragon undulation (shader animation)
4. **7s-9s**: Scatter with wind

---

## ⚡ Performance Optimizations

1. **Object Pooling**: Pre-allocated particle pool eliminates GC stutters
2. **InstancedMesh**: Single draw call for all particles
3. **Lazy Cleanup**: Dead particle removal spread over frames
4. **Spatial Matching**: O(n) assignment for large particle counts
5. **Verlet Integration**: Stable physics at variable framerates

---

## 🚀 Usage Example

```typescript
import { Director, StreamRenderer } from './core/stream';

// Create director
const director = new Director({ maxActiveFireworks: 50 });

// Create renderer (attach to Three.js scene)
const renderer = new StreamRenderer(scene, director);

// Launch firework
director.launch(
  'phoenix_rebirth',           // Manifest ID
  new Vector3(0, 0, 0),        // Launch position
  new Vector3(0, 80, 0),       // Target position
  Math.random() * 360          // Hue override
);

// Animation loop
function animate(deltaTime) {
  director.update(deltaTime);
  renderer.update(deltaTime);
}
```

---

## 🎯 Design Advantages

1. **Infinite Composability**: Mix any shapes, transitions, and physics
2. **Decoupled**: Shapes are data, physics are rules → JSON-driven creation
3. **Visual Continuity**: Particles flow between shapes (no destroy/recreate)
4. **GPU-Accelerated**: 50,000+ particles at 60fps

---

## 📈 Future Enhancements

- [ ] OBJ model loading for custom 3D shapes
- [ ] Audio-reactive particle behavior
- [ ] WebGPU compute shaders for physics
- [ ] Timeline editor UI
- [ ] Network sync for multi-device shows

---

*Built with ❤️ using the Stream Architecture*
