declare module 'three/examples/jsm/controls/OrbitControls' {
    import { Camera, EventDispatcher, MOUSE, TOUCH, Vector3 } from 'three';
    export class OrbitControls extends EventDispatcher {
        constructor(camera: Camera, domElement?: HTMLElement);
        object: Camera;
        domElement: HTMLElement | HTMLDocument;
        enabled: boolean;
        target: Vector3;
        minDistance: number;
        maxDistance: number;
        minZoom: number;
        maxZoom: number;
        minPolarAngle: number;
        maxPolarAngle: number;
        minAzimuthAngle: number;
        maxAzimuthAngle: number;
        enableDamping: boolean;
        dampingFactor: number;
        enableZoom: boolean;
        zoomSpeed: number;
        enableRotate: boolean;
        rotateSpeed: number;
        enablePan: boolean;
        panSpeed: number;
        screenSpacePanning: boolean;
        keyPanSpeed: number;
        autoRotate: boolean;
        autoRotateSpeed: number;
        enableKeys: boolean;
        keys: { LEFT: number; UP: number; RIGHT: number; BOTTOM: number };
        mouseButtons: { LEFT: MOUSE; MIDDLE: MOUSE; RIGHT: MOUSE };
        touches: { ONE: TOUCH; TWO: TOUCH };
        update(): boolean;
        saveState(): void;
        reset(): void;
        dispose(): void;
        getPolarAngle(): number;
        getAzimuthalAngle(): number;
        // EventDispatcher mixins
        addEventListener(type: string, listener: (event: any) => void): void;
        hasEventListener(type: string, listener: (event: any) => void): boolean;
        removeEventListener(type: string, listener: (event: any) => void): void;
        dispatchEvent(event: { type: string; [key: string]: any }): void;
    }
}

declare module 'three/examples/jsm/postprocessing/EffectComposer' {
    import { WebGLRenderer, WebGLRenderTarget, Scene, Camera } from 'three';
    import { Pass } from 'three/examples/jsm/postprocessing/Pass';
    export class EffectComposer {
        constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
        renderTarget1: WebGLRenderTarget;
        renderTarget2: WebGLRenderTarget;
        writeBuffer: WebGLRenderTarget;
        readBuffer: WebGLRenderTarget;
        passes: Pass[];
        copyPass: Pass;
        clock: any;
        renderToScreen: boolean;
        addPass(pass: Pass): void;
        insertPass(pass: Pass, index: number): void;
        removePass(pass: Pass): void;
        render(deltaTime?: number): void;
        reset(renderTarget?: WebGLRenderTarget): void;
        setSize(width: number, height: number): void;
        setPixelRatio(pixelRatio: number): void;
    }
}

declare module 'three/examples/jsm/postprocessing/RenderPass' {
    import { Scene, Camera, Color, Material } from 'three';
    import { Pass } from 'three/examples/jsm/postprocessing/Pass';
    export class RenderPass extends Pass {
        constructor(scene: Scene, camera: Camera, overrideMaterial?: Material, clearColor?: Color, clearAlpha?: number);
        scene: Scene;
        camera: Camera;
        overrideMaterial: Material;
        clearColor: Color;
        clearAlpha: number;
        clear: boolean;
    }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass' {
    import { Vector2, Color } from 'three';
    import { Pass } from 'three/examples/jsm/postprocessing/Pass';
    export class UnrealBloomPass extends Pass {
        constructor(resolution: Vector2, strength: number, radius: number, threshold: number);
        resolution: Vector2;
        strength: number;
        radius: number;
        threshold: number;
        compositeMaterial: any;
        bloomTintColors: Color[];
        copyUniforms: any;
        materialCopy: any;
        oldClearColor: Color;
        oldClearAlpha: number;
    }
}

declare module 'three/examples/jsm/postprocessing/Pass' {
    import { WebGLRenderer, WebGLRenderTarget } from 'three';
    export class Pass {
        constructor();
        enabled: boolean;
        needsSwap: boolean;
        clear: boolean;
        renderToScreen: boolean;
        setSize(width: number, height: number): void;
        render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean): void;
    }
}
