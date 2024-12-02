import { AmbientLight, Color, DirectionalLight } from "three"

import type { IHouse, IHouseInnerMesh } from "../types"
import { ambientLightIntensity, comGlassOpacity, directLightIntensity, glassEmissive, glassEnvIntensity, pngs } from "@const"
import { bokehPass, scene } from "../setup"



export const currTheme = { dark: false }

export const setThemeSwitcher = (
  BG: string,
  BG_DARK: string,
  dark: boolean,
) => {

  const narkomfin = scene.getObjectByName("narkomfin") as IHouse
  const ambientLight = scene.getObjectByName("ambientLight") as AmbientLight
  const directLight = scene.getObjectByName("directLight") as DirectionalLight
  const glass = narkomfin.getObjectByName("main_glass") as IHouseInnerMesh
  const bulbs = narkomfin.userData.bulbs

  return (force?: boolean) => {
    dark = force ?? !dark
    currTheme.dark = dark

    if (dark) {
      glass.material.emissiveIntensity = glassEmissive[1]
      glass.material.envMapIntensity = glassEnvIntensity[1]

      narkomfin.traverse((obj) => {
        obj.receiveShadow = false
        obj.castShadow = false
        if (pngs.some((name) => name === obj.name)) {
          obj.material.map = obj.userData.darkTexture
        }
      })
      narkomfin.add(bulbs)

      ambientLight.intensity = ambientLightIntensity[1]
      directLight.intensity = directLightIntensity[1]
      directLight.castShadow = false

      bokehPass.enabled = true
      scene.background = new Color(BG_DARK)
    }
    else {
      glass.material.emissiveIntensity = glassEmissive[0]
      glass.material.envMapIntensity = glassEnvIntensity[0]

      narkomfin.traverse((obj) => {
        obj.receiveShadow = true
        obj.castShadow = true
        if (pngs.some((name) => name === obj.name)) {
          console.log('theme1')
          obj.material.map = obj.userData.lightTexture
          console.log('theme2')
        }
      })
      narkomfin.remove(bulbs)

      ambientLight.intensity = ambientLightIntensity[0]
      directLight.intensity = directLightIntensity[0]
      directLight.castShadow = true

      bokehPass.enabled = false
      scene.background = new Color(BG)
    }
  }
}