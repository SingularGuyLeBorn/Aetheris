---
description: How to implement the "Everything is a Stream" firework engine architecture
---

# Stream Architecture Implementation Workflow

This workflow implements the revolutionary "一切皆流 (Everything is a Stream)" firework engine architecture.

## Core Philosophy

Fireworks are **Timeline Containers** containing **Particle Streams**, not discrete phases.
"Explosion" is just a **State Mutation** at a specific moment.

## Three Core Stages

1. **Genesis & Carrier** - Launch projectile to target coordinates
2. **Mutation & Topology** - Particle generation, shape morphing, force fields
3. **Entropy & Extinction** - Energy depletion, physics takeover, fade to nothing

---

## Implementation Steps

### Phase 1: Core Data Structures (DNA)

// turbo
1. Create `src/core/stream/types.ts` - Define all interfaces:
   - `FireworkManifest`
   - `CarrierConfig`
   - `PayloadStage`
   - `TopologyConfig`
   - `DynamicsConfig`
   - `RenderingConfig`
   - `ForceField`
   - `Gradient`
   - `Curve`

// turbo
2. Create `src/core/stream/presets/` folder for JSON presets

### Phase 2: Core Systems

// turbo
3. Create `src/core/stream/Director.ts` - The orchestrator:
   - Global clock management
   - Manifest → Instance conversion
   - All firework lifecycle management

// turbo
4. Create `src/core/stream/CarrierSystem.ts` - Carrier logic:
   - 3D Bezier path calculation
   - Trail emission
   - Projectile physics

// turbo
5. Create `src/core/stream/ParticleStream.ts` - The particle container:
   - Particle pool management
   - State mutation handling
   - Target seeking algorithm

// turbo
6. Create `src/core/stream/ForceFieldSystem.ts` - Force field management:
   - Gravity, attraction, repulsion
   - Noise-based turbulence
   - Wind simulation

### Phase 3: Shape Morphing (The Magic)

// turbo
7. Create `src/core/stream/MorphingEngine.ts` - Shape transition:
   - Hungarian algorithm for optimal particle-to-target mapping
   - Smooth interpolation between shapes
   - GPU-accelerated vertex animation

// turbo
8. Create `src/core/stream/TargetPointGenerator.ts` - Shape → Points:
   - Reuse Shape3DFactory
   - Support for OBJ model loading
   - Text-to-points conversion

### Phase 4: Rendering Pipeline

// turbo
9. Create `src/core/stream/StreamRenderer.ts` - WebGL rendering:
   - InstancedMesh optimization
   - Blackbody radiation color algorithm
   - GPU particle updates via vertex shader

// turbo
10. Update PostProcessingStack.ts - Enhanced bloom

### Phase 5: Preset Manifests

// turbo
11. Create preset manifests:
    - `PhoenixRebirth.json` - The demo effect
    - `HeartMorph.json` - Heart shape morphing
    - `TextDisplay.json` - Text with burning effect

### Phase 6: Integration

// turbo
12. Create `src/core/stream/StreamFireworkSystem.ts` - Main integration:
    - Connect all systems
    - Replace or extend existing Firework3D

// turbo
13. Update `FireworkScene3D.tsx` to use new system

---

## File Structure

```
src/core/stream/
├── types.ts                 # All TypeScript interfaces
├── Director.ts              # Main orchestrator
├── CarrierSystem.ts         # Launch trajectory
├── ParticleStream.ts        # Particle management
├── ForceFieldSystem.ts      # Physics forces
├── MorphingEngine.ts        # Shape transitions
├── TargetPointGenerator.ts  # Shape → points
├── StreamRenderer.ts        # GPU rendering
├── StreamFireworkSystem.ts  # Integration layer
└── presets/
    ├── PhoenixRebirth.json
    ├── HeartMorph.json
    └── TextDisplay.json
```

---

## Key Algorithms

### Target Seeking (Morphing)
```typescript
// Each particle has a target point
// Apply attraction force toward target
// F = k * (target - current) / distance^2
```

### Blackbody Radiation
```typescript
// Color based on temperature
// High temp: white → yellow
// Medium: orange → red
// Low: dark red → gray (ash)
```

### Verlet Integration (Already Implemented)
```typescript
// Position-based physics
// Energy conserving
// Stable at variable framerates
```
