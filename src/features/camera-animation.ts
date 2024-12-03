import { LineCurve3, QuadraticBezierCurve3, Vector3 } from "three"
// import { GUI } from "lil-gui"

import { clamp } from "@utils"
import { MAX_DISTANCE, getInitCameraPos } from "@const"
import { cameraPivot, controls, scene } from "../setup"

export type TCamAnimType = "init" | "cafe" | "roof" |"bookstore"
export type TCamAnimTransition = Exclude<`${TCamAnimType}-${TCamAnimType}`, "init-init" | "cafe-cafe" | "roof-roof" |"bookstore-bookstore">
type TCamAnimListener = (type: TCamAnimType, t: number) => void

const listeners: TCamAnimListener[] = []

let animating = false
const duration = 1500

const cafeTarget = new Vector3(-3, -0.1, 0.9)
const cafeCameraPos = new Vector3(-0.7, 0.2, 1.75)

const roofTarget = new Vector3(-1, 0.8, -0.7)
const roofCircle = new Vector3().addVectors(roofTarget, new Vector3(0, 1, 0))
const roofRadius = 2.2

const bookstoreTarget = new Vector3(-1, -0.4, -0.8);
const bookstoreCameraPosFront = new Vector3(-1, -0.52, 0.3);
const bookstoreCameraPosBack = new Vector3(-1, -0.52, -1.5);

const tweenCamera = (type: TCamAnimType) => {
  if (cameraPivot.userData.type === type || animating) return
  cameraPivot.userData.tween = `${cameraPivot.userData.type}-${type}` as TCamAnimTransition
  cameraPivot.userData.type = type
  animating = true
  controls.enabled = false
  const { cameraCurve, targetCurve, startSphericalRadius, difSphericalRadius } = getCurveMap[type]()
  for (const handler of listeners) handler(type, 0)

  const start = performance.now()

  setTimeout(function animate() {
    const now = performance.now()
    const t = clamp((now - start) / duration, 0, 1)
    const tt = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2 // ease.functions[ease.current](t)

    cameraCurve.getPointAt(tt, cameraPivot.position)

    targetCurve.getPointAt(tt, controls.target)
    controls.spherical.radius = startSphericalRadius + difSphericalRadius * tt
    controls.update()

    for (const handler of listeners) handler(type, t)

    if (t === 1) {
      animating = false
      controls.enabled = true
      for (const handler of listeners) handler(type, 1)
    }
    else setTimeout(animate, 0)
  }, 0)
}

export const cameraTweener = {
  tween: tweenCamera,
  subscribe(handler: TCamAnimListener) { listeners.push(handler) },
}

// Задание координат границ здания
const buildingBounds = {
  xMin: -3.6,
  xMax: 4.8,
  zMin: -1.25,
  zMax: -0.35,
  y: 3, // Высота здания
};

const getInitCurve = () => {
  const newCameraPos = getInitCameraPos()
  const newTargetPos = scene.position

  const targetCurve = new LineCurve3(
    controls.target.clone(),
    newTargetPos,
  )

  const newSphericalRadius = newCameraPos.distanceTo(newTargetPos)
  const startSphericalRadius = cameraPivot.position.distanceTo(controls.target)
  const difSphericalRadius = newSphericalRadius - startSphericalRadius

  const needsFlythrough = cameraPivot.position.z < buildingBounds.zMin && newCameraPos.y < buildingBounds.y
  console.log(cameraPivot.position.z)

  const cameraCurve = new QuadraticBezierCurve3(
    cameraPivot.position.clone(),
    new Vector3(),
    newCameraPos,
  )

  if (needsFlythrough) {
    cameraCurve.v1 = cameraPivot.position.clone();
    cameraCurve.v1.y = buildingBounds.y;
  } else {
    const theta = controls.getPolarAngle()
    const d = cameraCurve.v1.distanceTo(cameraCurve.v2) / MAX_DISTANCE
    const t = clamp(theta - PI * 0.3, 0, PI * 0.2) / (PI * 0.2) // if theta 0.3-0.5

    cameraCurve.v1.x = (cameraCurve.v1.x * 2 + cameraCurve.v2.x) / 3
    cameraCurve.v1.y = (cameraCurve.v1.y * 2 + cameraCurve.v2.y) / 3 + d + t
    cameraCurve.v1.z = (cameraCurve.v1.z * 2 + cameraCurve.v2.z) / 3
  }

  cameraCurve.updateArcLengths()

  return { cameraCurve, targetCurve, startSphericalRadius, difSphericalRadius }
}

const PI = Math.PI
const upVec = new Vector3(0, 1, 0)

const getBookstoreCurve = () => {
  const currentPos = cameraPivot.position;
  const currentTarget = controls.target;

  // Determine the new camera position (behind or in front)
  const isBack = currentPos.distanceTo(bookstoreCameraPosBack) < currentPos.distanceTo(bookstoreCameraPosFront);
  const newCameraPos = isBack ? bookstoreCameraPosBack : bookstoreCameraPosFront;

  const targetCurve = new LineCurve3(currentTarget.clone(), bookstoreTarget);

  const newSphericalRadius = newCameraPos.distanceTo(bookstoreTarget);
  const startSphericalRadius = currentPos.distanceTo(currentTarget);
  const difSphericalRadius = newSphericalRadius - startSphericalRadius;

  // Create the camera movement curve
  const cameraCurve = new QuadraticBezierCurve3(
    currentPos.clone(),
    new Vector3(), // Control point, placeholder
    newCameraPos
  );

  // Determine viewing angles
  let escapeVector;
  const isAboveBuilding = currentPos.y >= buildingBounds.y;
  const isBehindBuilding = currentPos.x <= buildingBounds.xMin && newCameraPos.x >= buildingBounds.xMin && currentPos.z <= buildingBounds.zMin;
  const isOnBuildingSide = currentPos.x >= buildingBounds.xMax && newCameraPos.x <= buildingBounds.xMax;
  if (isBehindBuilding || isOnBuildingSide || isAboveBuilding) {
    escapeVector = currentPos.clone();
    escapeVector.z = isBack ? Math.min(buildingBounds.zMin, escapeVector.z) : Math.max(buildingBounds.zMax, escapeVector.z);
  }

  // const wasAvoided = avoidBuilding(currentPos, newCameraPos, cameraCurve)
  if (!escapeVector) {
    const theta = controls.getPolarAngle();
    const phi = controls.getAzimuthalAngle();

    // Check if a flyby of the neighboring building is necessary
    const d = cameraCurve.v0.distanceTo(cameraCurve.v2) / MAX_DISTANCE;
    const t = Math.max(0, Math.min((theta - Math.PI * 0.3) / (Math.PI * 0.2), 1));
    const f = phi < -1 ? 1 : phi > 1.4 ? 1 : 0; // Camera is behind the building
    let a = (phi < -1 && phi > -2.5) ? (1.5 - phi - 2.5) / 1.5 : 0;

    // Adjust the flyby of the building
    a = a ? 1 - (a - 0.5) * (a - 0.5) / 0.5 ** 2 : 0;
    if (a) {
      const isLeftSide = currentPos.x < 0;
      const orbitDirection = isLeftSide ? Math.PI / 2 : -Math.PI / 2;

      cameraCurve.v1.add(
        new Vector3()
          .subVectors(cameraCurve.v2, cameraCurve.v0)
          .normalize()
          .multiplyScalar(1 + a * (2 - d) * 3)
          .applyAxisAngle(new Vector3(0, 1, 0), orbitDirection)
      );
    }
    // If the camera is outside the building, use standard logic
    const baseY = (cameraCurve.v0.y * 2 + cameraCurve.v2.y) / 3; // Base height
    const flybyCorrection = a ? d * (1 - a) + t * f * 1.5 : d + t * f; // Adjust the flyby effect
    cameraCurve.v1.x = (cameraCurve.v0.x * 2 + cameraCurve.v2.x) / 3;
    cameraCurve.v1.y = baseY + flybyCorrection; // Adjusted height
    cameraCurve.v1.z = (cameraCurve.v0.z * 2 + cameraCurve.v2.z) / 3;
  } else {
    debugger;
    cameraCurve.v1.copy(escapeVector);
  }

  // Update curve arc lengths
  cameraCurve.updateArcLengths();

  return { cameraCurve, targetCurve, startSphericalRadius, difSphericalRadius };
};

const getCafeCurve = () => {
  const newCameraPos = cafeCameraPos
  const newTargetPos = cafeTarget

  const targetCurve = new LineCurve3(
    controls.target.clone(),
    newTargetPos,
  )

  const newSphericalRadius = newCameraPos.distanceTo(newTargetPos)
  const startSphericalRadius = cameraPivot.position.distanceTo(controls.target)
  const difSphericalRadius = newSphericalRadius - startSphericalRadius

  const cameraCurve = new QuadraticBezierCurve3(
    cameraPivot.position.clone(),
    new Vector3(),
    newCameraPos,
  )

  cameraCurve.v1.x = (cameraCurve.v0.x * 2 + cameraCurve.v2.x) / 3
  cameraCurve.v1.y = (cameraCurve.v0.y * 2 + cameraCurve.v2.y) / 3
  cameraCurve.v1.z = (cameraCurve.v0.z * 2 + cameraCurve.v2.z) / 3

  const theta = controls.getPolarAngle()
  const phi = controls.getAzimuthalAngle()

  const d = cameraCurve.v0.distanceTo(cameraCurve.v2) / MAX_DISTANCE
  const t = clamp(theta - PI * 0.3, 0, PI * 0.2) / (PI * 0.2) // if theta 0.3-0.5
  const f = phi < -1 ? 1 : phi > 1.4 ? 1 : 0 // if phi behind building
  let a = (phi < -1 && phi > -2.5) ? (1.5 - phi - 2.5) / 1.5 : 0 // if phi behind cafe
  a = a ? 1 - (a - 0.5) * (a - 0.5) / 0.5 ** 2 : 0 // make a -> from 0-1 to 0-1-0

  a && cameraCurve.v1.add(
    new Vector3()
      .subVectors(cameraCurve.v2, cameraCurve.v0)
      .normalize()
      .multiplyScalar(1 + a * (2 - d) * 3)
      .applyAxisAngle(upVec, -Math.PI / 2),
  )
  cameraCurve.v1.y = (cameraCurve.v0.y * 2 + cameraCurve.v2.y) / 3 + d + t * f * 2

  cameraCurve.updateArcLengths()

  return { cameraCurve, targetCurve, startSphericalRadius, difSphericalRadius }
}

const getRoofCurve = () => {
  const camV = cameraPivot.position.clone()
  camV.y = roofCircle.y
  const subV = new Vector3().subVectors(roofCircle, camV)
  subV.setLength(subV.length() - roofRadius)

  const newCameraPos = subV.add(camV)
  const newTargetPos = roofTarget

  const targetCurve = new LineCurve3(controls.target.clone(), newTargetPos)
  const cameraCurve = new LineCurve3(cameraPivot.position.clone(), newCameraPos)

  const newSphericalRadius = newCameraPos.distanceTo(newTargetPos)
  const startSphericalRadius = cameraPivot.position.distanceTo(controls.target)
  const difSphericalRadius = newSphericalRadius - startSphericalRadius

  return { cameraCurve, targetCurve, startSphericalRadius, difSphericalRadius }
}

const getCurveMap = {
  bookstore: getBookstoreCurve,
  cafe: getCafeCurve,
  roof: getRoofCurve,
  init: getInitCurve,
}

export const setCameraPosOnInit = (type: TCamAnimType = "init") => {
  cameraPivot.userData.type = type
  if (type === "cafe") {
    cameraPivot.position.copy(cafeCameraPos)
    controls.target.copy(cafeTarget)
    controls.update()
  }
  else if (type === "roof") {
    cameraPivot.position.set(roofCircle.x, roofCircle.y, roofCircle.z + roofRadius)
    controls.target.copy(roofTarget)
    controls.update()
  } else if (type === "bookstore") {
    cameraPivot.position.copy(bookstoreCameraPosFront) //todo
    controls.target.copy(bookstoreTarget)
    controls.update()
  }
  else cameraPivot.position.copy(getInitCameraPos())
}

// interface IEase {
//   current: "easeInQuad" | "easeOutQuad" | "easeInOutQuad" | "easeInCubic" | "easeOutCubic" | "easeInOutCubic"
//   functions: { [K in IEase["current"]]: (x: number) => number }
// }

// const ease: IEase = {
//   current: "easeInOutQuad",
//   functions: {
//     easeInQuad(x: number): number {
//       return x * x
//     },
//     easeOutQuad(x: number): number {
//       return 1 - (1 - x) * (1 - x)
//     },
//     easeInOutQuad(x: number): number {
//       return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2
//     },
//     easeInCubic(x: number): number {
//       return x * x * x
//     },
//     easeOutCubic(x: number): number {
//       return 1 - Math.pow(1 - x, 3)
//     },
//     easeInOutCubic(x: number): number {
//       return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2
//     },
//   },
// }

// const gui = new GUI()

// gui.add(ease, "current", {
//   easeInQuad: "easeInQuad",
//   easeOutQuad: "easeOutQuad",
//   easeInOutQuad: "easeInOutQuad",
//   easeInCubic: "easeInCubic",
//   easeOutCubic: "easeOutCubic",
//   easeInOutCubic: "easeInOutCubic",
// } as {
//   [K in IEase["current"]]: K
// }).name("easing function:")
