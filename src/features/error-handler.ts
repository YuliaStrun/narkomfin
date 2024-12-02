import type { IInitProps } from "../types"
import { STATUS } from "@const"



const state = {
  dark: false,
  path: "",
  dir: "",
  theme: "",
}

const dirs = [ "land", "mob" ]
const themes = [ "dark", "light" ]

const div = document.createElement("div")

const resizeHandler = () => {
  state.dir = getDir()
  div.style.backgroundImage = getImage()
}



const getDir = () => innerWidth > innerHeight ? dirs[0] : dirs[1]
const getTheme = () => state.dark ? themes[0] : themes[1]
const getImage = () => `url(${state.path}${state.dir}_${state.theme}.png)`



export const errorHandler = ({
  container,
  path,
  onProgress = () => {},
  dark = false,
  BG = "#E1E1DF",
  BG_DARK = "#1E1E1E",
}: Omit<IInitProps, "cameraType" | "content">) => {

  onProgress(STATUS.ERROR)

  state.dark = dark
  state.path = path
  state.dir = getDir()
  state.theme = getTheme()

  const style: Partial<CSSStyleDeclaration> = {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: "100%",
    backgroundImage: getImage(),
    backgroundPosition: "center",
    backgroundSize: "cover",
  }
  Object.assign(div.style, style)

  container.style.position = "relative"
  container.appendChild(div)

  window.addEventListener("resize", resizeHandler)
}



export const toggleDarkErrored = (force?: boolean) => {
  state.dark = force ?? !state.dark
  state.theme = getTheme()
  div.style.backgroundImage = getImage()
}