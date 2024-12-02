export const throttle = <T extends unknown[]>(
  fn: (...args: T) => void,
  waitTime: number,
  context: unknown = null,
) => {
  let timeoutId: number
  let lastTime = 0

  return (...args: T) => {
    clearTimeout(timeoutId)
    const currTime = performance.now()
    const deltaTime = currTime - lastTime

    if (deltaTime >= waitTime) {
      lastTime = currTime
      fn.apply(context, args)
    } else {
      timeoutId = setTimeout(() => {
        lastTime = performance.now()
        fn.apply(context, args)
      }, waitTime - deltaTime)
    }
  }
}