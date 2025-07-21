import { AmbientLight, Color, DirectionalLight } from "three"

import type { IHouse, IHouseInnerMesh } from "../types"
import { ThemeMode, ambientLightIntensity, directLightIntensity, glassEmissive, glassEnvIntensity, pngs } from "@const"
import { bokehPass, scene } from "../setup"



export const currTheme: { theme: ThemeMode } = { theme: "day" }

export const setThemeSwitcher = (
  BG: string,
  BG_DARK: string,
  themeMode: ThemeMode,
) => {

  const narkomfin = scene.getObjectByName("narkomfin") as IHouse
  const ambientLight = scene.getObjectByName("ambientLight") as AmbientLight
  const directLight = scene.getObjectByName("directLight") as DirectionalLight
  const glass = narkomfin.getObjectByName("main_glass") as IHouseInnerMesh
  const bulbs = narkomfin.userData.bulbs

  currTheme.theme = themeMode

  return (force?: ThemeMode) => {
    let newTheme: "day" | "night" | "deep_night";

    if (force) {
      newTheme = force;
    } else {
      const current = currTheme.theme;

      if (current === "day") {
        newTheme = "night";
      } else if (current === "night") {
        newTheme = "deep_night";
      } else {
        newTheme = "day";
      }
    }

    if (newTheme === "day") {
      glass.material.emissiveIntensity = glassEmissive[0]
      glass.material.envMapIntensity = glassEnvIntensity[0]
      glass.material.metalness = 1
      glass.material.roughness = 0

      narkomfin.traverse((obj) => {
        obj.receiveShadow = true
        obj.castShadow = true
        if(/main_glass/.test(obj.name)) {
          obj.material.map = null
        } else if (pngs.some((name) => name === obj.name)) {
          obj.material.map = obj.userData.lightTexture
        }
      })
      narkomfin.remove(bulbs)

      ambientLight.intensity = ambientLightIntensity[0]
      directLight.intensity = directLightIntensity[0]
      directLight.castShadow = true

      bokehPass.enabled = false
      scene.background = new Color(BG)
    } else { // night or true_night
      glass.material.emissiveIntensity = 0
      glass.material.envMapIntensity = glassEnvIntensity[1]
      glass.material.metalness = 0
      glass.material.roughness = 1

      narkomfin.traverse((obj) => {
        obj.receiveShadow = false
        obj.castShadow = false
        if (pngs.some((name) => name === obj.name)) {
          if (newTheme === "deep_night" && obj.userData.trueNightTexture) {
            obj.material.map = obj.userData.trueNightTexture
          } else {
            obj.material.map = obj.userData.darkTexture
          }
        }
      })
      narkomfin.add(bulbs)

      ambientLight.intensity = ambientLightIntensity[1]
      directLight.intensity = directLightIntensity[1]
      directLight.castShadow = false

      bokehPass.enabled = true
      scene.background = new Color(BG_DARK)
    }
  }
}