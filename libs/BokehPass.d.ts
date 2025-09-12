import { Scene, Camera, IUniform, ShaderMaterial, WebGLRenderTarget, MeshDepthMaterial, Color } from "three"
import { Pass, FullScreenQuad } from "three/examples/jsm/postprocessing/Pass"

export interface BokehPassParamters {
    focus?: number;
    aspect?: number;
    aperture?: number;
    maxblur?: number;
}

export class BokehPass extends Pass {
  constructor(scene: Scene, camera: Camera, params: BokehPassParamters);
  scene: Scene
  camera: Camera
  renderTargetColor: WebGLRenderTarget
  renderTargetDepth: WebGLRenderTarget
  materialDepth: MeshDepthMaterial
  materialBokeh: ShaderMaterial
  fsQuad: FullScreenQuad
  oldClearColor: Color

  uniforms: {
    focus: IUniform<number>
    aperture: IUniform<number>
    maxblur: IUniform<number>
  }
}
