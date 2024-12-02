import { Color } from "three"
import { scene } from "../setup"



let duration = 1000
let animating = false



export const switchBg = (bg: string) => {
  if (animating) return
  animating = true

  const currColor = scene.background as Color
  const targetColor = new Color(bg)

  let lastTime = performance.now()

  requestAnimationFrame(function animate() {
    const currTime = performance.now()
    const deltaTime = currTime - lastTime
    let t = Math.min(deltaTime / duration, 1)
    t = -(Math.cos(Math.PI * t) - 1) / 2

    scene.background = new Color().lerpColors(currColor, targetColor, t)

    if (t === 1) animating = false
    else requestAnimationFrame(animate)
  })
}