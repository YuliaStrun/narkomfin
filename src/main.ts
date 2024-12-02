import { AmbientLight, Color, DirectionalLight, Vector2 } from "three"

import type { IHouse, IInitProps } from "./types"
import { MAX_DISTANCE, STATUS, ambientLightIntensity, bokehFocusMap, directLightIntensity } from "@const"
import { mix } from "./utils/mix"
import { bokehPass, camera, cameraPivot, composer, controls, renderer, scene, noThreeError } from "./setup"

import { loadModel } from "./load-model"
import { traverseModel } from "./traverse-model"
import { easedPointer, switchBg, cameraTweener, setThemeSwitcher, toggleZoomBorder, errorHandler, toggleDarkErrored, TCamAnimType, TCamAnimTransition, setCameraPosOnInit } from "./features"
import { setCameraViewOffset, setInitCameraViewOffset } from "./features/camera-view-offset"



const init = async ({
  container,
  path,
  onProgress = () => {},
  cameraType = "init",
  content = false,
  dark = false,
  BG = "#E1E1DF",
  BG_DARK = "#1E1E1E",
}: IInitProps) => {

  if (window.location.search === "?error") {
    errorHandler({ container, path, onProgress, dark, BG, BG_DARK })
    return { toggleDark: toggleDarkErrored, error: true }
  }

  // error from ./setup
  if (noThreeError) {
    errorHandler({ container, path, onProgress, dark, BG, BG_DARK })
    return { toggleDark: toggleDarkErrored, error: true }
  }

  ////////
  //////// HOUSE MODEL

  let narkomfin: IHouse
  let onLoadError = false

  await loadModel(
    path,
    (n) => onProgress(STATUS.LOADING, n * 80 | 0),
    ( ) => { },
    ( ) => onProgress(STATUS.LOADING, 85),
  )
    .then((data) => {
      narkomfin = traverseModel(data, dark)
      onProgress(STATUS.DONE)
      container.appendChild(renderer.domElement)
      scene.add(narkomfin)
    })
    .catch((path: string) => {
      onLoadError = true
      console.error("Cant find image by src: " + path)
    })

  if (onLoadError) {
    errorHandler({ container, path, onProgress, dark, BG, BG_DARK })
    return { toggleDark: toggleDarkErrored, error: true }
  }



  scene.background = new Color(dark ? BG_DARK : BG)
  renderer.shadowMap.enabled = !dark
  setCameraPosOnInit(cameraType)
  setInitCameraViewOffset(content)



  ////////
  //////// LIGHT & SHADOW

  const ambientLight = new AmbientLight(0xbb9977, dark ? ambientLightIntensity[1] : ambientLightIntensity[0])
  ambientLight.name = "ambientLight"
  scene.add(ambientLight)

  const directLight = new DirectionalLight(0xffffff, dark ? directLightIntensity[1] : directLightIntensity[0])
  directLight.name = "directLight"
  directLight.position.set(2, 3, 4)
  directLight.castShadow = true
  directLight.shadow.mapSize = new Vector2(1024, 1024).multiplyScalar(4)
  directLight.shadow.camera.far = directLight.position.length() + MAX_DISTANCE + 4.5
  cameraPivot.add(directLight)

  // const directCamera = new CameraHelper(directLight.shadow.camera)
  // scene.add(directCamera)



  ////////
  //////// FEATURES

  cameraType === "init" && toggleZoomBorder(true)

  bokehPass.enabled = dark



  const easedPointerHandler = (pointer: { x: number, y: number }) => {
    const d = cameraPivot.position.distanceTo(controls.target) / MAX_DISTANCE * 2
    camera.position.x = -pointer.x * d
    camera.position.y = -pointer.y * d
    camera.lookAt(controls.target)
  }
  easedPointer.subscribe(easedPointerHandler)



  const bokehFocus = bokehPass.uniforms.focus
  const bokehBlur = bokehPass.uniforms.maxblur
  const bokehAperture = bokehPass.uniforms.aperture

  // on init setup bokeh
  bokehFocus.value = bokehFocusMap[cameraType][0]
  bokehBlur.value = bokehFocusMap[cameraType][1]
  bokehAperture.value = bokehFocusMap[cameraType][2]

  let tween: TCamAnimTransition

  cameraTweener.subscribe((type, t) => {
    easedPointerHandler(easedPointer)

    // onStart
    if (t === 0) {
      ({ tween } = cameraPivot.userData)
      controls.minDistance = 0
      controls.maxDistance = Infinity
      controls.minAzimuthAngle = controls.maxAzimuthAngle = Infinity
      controls.minPolarAngle = Math.PI * 0.05
      controls.maxPolarAngle = Math.PI * 0.49

      toggleZoomBorder(false)
    }
    // onEnd
    else if (t === 1) {
      easedPointer.updateYLimit(-Infinity)
      if (type === "bookstore") {
        easedPointer.updateYLimit(0.03)
        controls.minDistance = 0.7
        controls.maxDistance = 1.15
        controls.minAzimuthAngle = -Math.PI * 0.29
        controls.maxAzimuthAngle =  Math.PI * 1.25
        controls.minPolarAngle = controls.maxPolarAngle = Math.PI * 0.49
      }
      else if (type === "cafe") {
        controls.minDistance = 1.75
        controls.maxDistance = 5
        controls.minAzimuthAngle = -Math.PI * 0.8
        controls.maxAzimuthAngle =  Math.PI * 0.55
      }
      else if (type === "roof") {
        controls.minDistance = 1.75
        controls.maxDistance = 5
      }
      else { // type === "init"
        toggleZoomBorder(true) // handle controls.minDistance
        controls.maxDistance = MAX_DISTANCE
      }
    }

    const [firstState, secondState] = tween.split('-');
    bokehFocus.value = mix(
      bokehFocusMap[firstState as TCamAnimType][0],
      bokehFocusMap[secondState as TCamAnimType][0],
      t,
    )
    bokehBlur.value = mix(
      bokehFocusMap[firstState as TCamAnimType][1],
      bokehFocusMap[secondState as TCamAnimType][1],
      t,
    )
    bokehAperture.value = mix(
      bokehFocusMap[firstState as TCamAnimType][2],
      bokehFocusMap[secondState as TCamAnimType][2],
      t,
    )
  })



  const toggleDark = setThemeSwitcher(BG, BG_DARK, dark)



  ////////
  //////// RENDERING

  renderer.setAnimationLoop(() => {
    composer.render()
  })



  return { toggleDark, tweenCamera: cameraTweener.tween, switchBg, setCameraViewOffset }
}

export default init