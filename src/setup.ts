import { ACESFilmicToneMapping, PCFSoftShadowMap, PerspectiveCamera, Scene, sRGBEncoding, WebGLRenderer, WebGLRenderTarget } from "three"
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass"
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer"

import { BokehPass } from "./libs/BokehPass"
import { OrbitControls } from "./libs/OrbitControls"

import type { ICameraPivot } from "./types"
import { getInitCameraPos, MAX_DISTANCE } from "@const"



let
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
  renderPass: RenderPass,
  bokehPass: BokehPass,
  composer: EffectComposer,
  cameraPivot: ICameraPivot,
  controls: OrbitControls,
  noThreeError = false

try {
  scene = new Scene()

  camera = new PerspectiveCamera(45, innerWidth / innerHeight, 0.1, 100)

  renderer = new WebGLRenderer({ antialias: true })

  renderer.setSize(innerWidth, innerHeight)
  const pr = Math.min(devicePixelRatio, 2)
  renderer.setPixelRatio(pr)
  renderer.outputEncoding = sRGBEncoding
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.shadowMap.type = PCFSoftShadowMap

  renderer.domElement.style.cursor = "grab"
  renderer.domElement.addEventListener("pointerdown", () => {
    renderer.domElement.style.cursor = "grabbing"
  })
  renderer.domElement.addEventListener("pointerup", () => {
    renderer.domElement.style.cursor = "grab"
  })

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(innerWidth, innerHeight)
  })

  renderPass = new RenderPass(scene, camera)

  bokehPass = new BokehPass(scene, camera, {
    focus: 5,
    aperture: 0,
    maxblur: 0,
  })

  const target = new WebGLRenderTarget(innerWidth * pr, innerHeight * pr, { samples: 8 })

  composer = new EffectComposer(renderer, target)
  composer.addPass(renderPass)
  composer.addPass(bokehPass)

  cameraPivot = new PerspectiveCamera() as ICameraPivot

  controls = new OrbitControls(cameraPivot, renderer.domElement)

  controls.enablePan = false
  controls.maxDistance = MAX_DISTANCE
  controls.minPolarAngle = Math.PI * 0.05
  controls.maxPolarAngle = Math.PI * 0.49

  cameraPivot.position.copy(getInitCameraPos())
  controls.update()
  cameraPivot.add(camera)
  scene.add(cameraPivot)

  controls.addEventListener("change", () => {
    camera.lookAt(controls.target)
  })
}
catch {
  noThreeError = true
}

export {
  scene,
  camera,
  renderer,
  renderPass,
  bokehPass,
  composer,
  cameraPivot,
  controls,
  noThreeError,
}