import { camera } from "../setup"



let vw = innerWidth / 100
let _content = false
let mobile = innerWidth < 480

const duration = 1000

window.addEventListener("resize", () => {
  vw = innerWidth / 100
  mobile = innerWidth < 480
  cameraViewOffsetParams.resize()
  setCameraViewOffset(_content)
})



export const setCameraViewOffset = (
  content = false,
) => {
  if (mobile) {
    camera.setViewOffset(innerWidth, innerHeight, 0, 0, innerWidth, innerHeight)
    return
  }
  else if (content === _content) {
    const type = content ? "content" : "noncontent"
    camera.setViewOffset(...cameraViewOffsetParams[type])
    return
  }

  _content = content

  animateCameraOffset(content)
}

export const setInitCameraViewOffset = (
  content: boolean,
) => {
  if (content) {
    camera.setViewOffset(119.7 * vw, innerHeight, 19.7 * vw, 0, 100 * vw, innerHeight)
    currViewParams[0] = 119.7 * vw
    currViewParams[2] = 19.7 * vw
  }
  else {
    camera.setViewOffset(100 * vw, innerHeight, 0, 0, 100 * vw, innerHeight)
  }
}



type TParams = [number, number, number, number, number, number]

const cameraViewOffsetParams = {
  content: [
    // (100 - 21.1 - 40.8) / 2 + 40.8 = 59.85 // 119.7 // from right
    119.7 * vw, innerHeight, 19.7 * vw, 0, 100 * vw, innerHeight,
  ],
  noncontent: [
    // (100 - 21.1) / 2 + 21.1 = 60.55 // 121.1 // from left
    // 121.1 * vw, innerHeight, 0, 0, 100 * vw, innerHeight,
    100 * vw,   innerHeight, 0,         0, 100 * vw, innerHeight,
  ],
  resize() {
    cameraViewOffsetParams.content[0] = 119.7 * vw
    cameraViewOffsetParams.content[1] = cameraViewOffsetParams.content[5] = innerHeight
    cameraViewOffsetParams.content[2] = 19.7 * vw
    cameraViewOffsetParams.content[4] = 100 * vw

    // cameraViewOffsetParams.noncontent[0] = 121.1 * vw
    cameraViewOffsetParams.noncontent[0] = 100 * vw
    cameraViewOffsetParams.noncontent[1] = cameraViewOffsetParams.noncontent[5] = innerHeight
    cameraViewOffsetParams.noncontent[4] = 100 * vw

    const type = _content ? "content" : "noncontent"
    cameraViewOffsetParams[type].forEach((v, i) => {
      currViewParams[i] = v
    })
  },
} as {
  content: TParams
  noncontent: TParams
  resize(): void
}

const currViewParams = [ ...cameraViewOffsetParams.noncontent ] as TParams

const animateCameraOffset = (
  content: boolean,
) => {
  const type = content ? "content" : "noncontent"

  const init = [ ...currViewParams ]
  const diff = cameraViewOffsetParams[type].map((v, i) => v - init[i])
  const start = performance.now()

  requestAnimationFrame(function tween() {
    const t = Math.min((performance.now() - start) / duration, 1)
    currViewParams.forEach((v, i) => {
      currViewParams[i] = init[i] + diff[i] * t
    })
    camera.setViewOffset(...currViewParams)

    if (t < 1) requestAnimationFrame(tween)
  })
}