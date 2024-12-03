import { Vector2 } from "three"
import { sumAbs } from "@utils"

const pointer = new Vector2()
const _easedPointer = new Vector2()
const targetPointer = new Vector2()

const velocity = 5
const threshold = 3e-3

let easing = false
let yLimit = -Infinity
let lastTime = 0

export type TPointerListener = (easedPointer: { x: number, y: number }) => void

const listeners: TPointerListener[] = []

const easeMovement = () => {
  const currTime = performance.now()
  const dt = (currTime - lastTime) * 0.001 * velocity
  lastTime = currTime

  targetPointer.copy(pointer)
  targetPointer.y = Math.max(targetPointer.y, yLimit)

  const dx = targetPointer.x - _easedPointer.x
  const dy = targetPointer.y - _easedPointer.y
  _easedPointer.x += dx * dt
  _easedPointer.y += dy * dt

  for (const handler of listeners) {
    handler(_easedPointer)
  }

  if (sumAbs(dx, dy) > threshold) requestAnimationFrame(easeMovement)
  else easing = false
}

addEventListener("pointermove", (e: PointerEvent) => {
  pointer.x = e.clientX / innerWidth - 0.5
  pointer.y = -e.clientY / innerHeight + 0.5

  if (easing) return
  easing = true
  lastTime = performance.now()
  requestAnimationFrame(easeMovement)
})

export const easedPointer = {
  subscribe(handler: TPointerListener) { listeners.push(handler) },
  updateYLimit(newLimit: number) {
    yLimit = newLimit
    if (_easedPointer.y < yLimit && !easing) {
      easing = true
      lastTime = performance.now()
      requestAnimationFrame(easeMovement)
    }
  },
  get x() { return _easedPointer.x },
  get y() { return _easedPointer.y },
}
