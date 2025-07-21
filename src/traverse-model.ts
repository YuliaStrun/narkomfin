import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader";
import { Color, DataTexture, EquirectangularReflectionMapping, Group, Mesh, MeshStandardMaterial, Texture, Vector3 } from "three";

import { IFetchedData, IHouse, IHouseInnerMesh } from "./types";
import { ThemeMode, comGlassOpacity, glassEmissive, glassEnvIntensity, pngs } from "@const";
import * as THREE from "three";
import { scene } from "./setup";

const material111 = new MeshStandardMaterial({ color: 0x111111 });

export const traverseModel = (
  data: IFetchedData,
  themeMode: ThemeMode,
): IHouse => {
  const model = (data.find(element => (element as GLTF).scene !== undefined) as GLTF).scene;
  const envMap = data.find(element => typeof (element as DataTexture).source?.data?.data !== "undefined") as DataTexture;
  envMap.mapping = EquirectangularReflectionMapping
  data = data.filter(element => (<Texture>element).source?.data?.currentSrc !== undefined)

  const bulbsTexture = data.find(element => (<Texture>element).source.data.currentSrc.includes("bulbs")) as Texture;
  bulbsTexture.flipY = false

  //const glassTexture = data.find(element => (<Texture>element).source.data.currentSrc.includes("old_glass")) as Texture;
  //glassTexture.flipY = false

  const textures = Object.fromEntries(
    pngs.map(name => {
      const lightTexture = data.find(element => (<Texture>element).source.data.currentSrc.endsWith(`${name}.png`)) as Texture;
      const darkTexture = data.find(element => (<Texture>element).source.data.currentSrc.endsWith(`${name}_night.png`)) as Texture;
      lightTexture.flipY = false;
      darkTexture.flipY = false;

      if (name === "main" || name === "floors" || name === "main_glass") {
        const trueNightTexture = data.find(element => (<Texture>element).source.data.currentSrc.endsWith(`${name}_deep_night.png`)) as Texture;
        if (trueNightTexture) {
          trueNightTexture.flipY = false;
          return [ name, { lightTexture, darkTexture, trueNightTexture }]
        }
      }

      return [ name, { lightTexture, darkTexture }]
    })
  )

  const scale = Array(3).fill(0.075) as [number, number, number]
  const house = new Group() as IHouse
  house.position.y = -1.5
  house.name = "narkomfin"

  model.traverse((object) => {
    if (!(object instanceof Mesh)) return

    const clone = object.clone() as IHouseInnerMesh
    clone.geometry.scale(...scale)
    clone.castShadow = /terrain/.test(clone.name) ? false : true
    clone.receiveShadow = true
    clone.frustumCulled = false

    if (/non-material/.test(clone.name)) {
      clone.material = material111
    } else if (/main_glass/.test(clone.name)) {
      clone.material = new MeshStandardMaterial({
        color: 0x888888,
        metalness: 1,
        roughness: 0,
        envMap: envMap,
        envMapIntensity: themeMode === "day" ? glassEnvIntensity[0] : glassEnvIntensity[1],
        name: clone.name
      })
      clone.material.emissive = new Color(0xffcc88)
      clone.material.emissiveMap = textures[clone.name].lightTexture
      clone.userData.darkTexture = textures[clone.name].darkTexture
      if ("trueNightTexture" in textures[clone.name]) {
        clone.userData.trueNightTexture = (textures[clone.name] as any).trueNightTexture
      }
      clone.material.emissiveIntensity = glassEmissive[0]
      clone.material.needsUpdate = true
    } else if (/transparent_glass/.test(clone.name)) {
      clone.material.transparent = true
      clone.material.opacity = themeMode === "day" ? comGlassOpacity[0] : comGlassOpacity[1]
    } else if (/bulbs/.test(clone.name)) {
      house.userData.bulbs = clone
      clone.material = new MeshStandardMaterial({
        emissiveMap: bulbsTexture,
        emissive: 0xffffff,
      })
    } else {
      let texture;
      if (themeMode === "day") {
        texture = textures[clone.name].lightTexture;
      } else if (themeMode === "deep_night" && "trueNightTexture" in textures[clone.name]) {
        texture = (textures[clone.name] as any).trueNightTexture;
      } else {
        texture = textures[clone.name].darkTexture;
      }
      clone.material = new MeshStandardMaterial({
        map: texture
      })
      clone.userData.lightTexture = textures[clone.name].lightTexture
      clone.userData.darkTexture = textures[clone.name].darkTexture
      if ("trueNightTexture" in textures[clone.name]) {
        clone.userData.trueNightTexture = (textures[clone.name] as any).trueNightTexture
      }
      clone.material.needsUpdate = true
    }

    house.add(clone)

    if (themeMode === "day" && /bulbs/.test(clone.name)) {
      house.remove(clone)
    }
  })

  return house
}
function emissive(
  material: MeshStandardMaterial,
) {
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <emissivemap_fragment>",
      `
      vec4 emissiveColor = texture2D(emissiveMap, vUv);
      totalEmissiveRadiance *= emissiveColor.rgb;
      float steppedEmissive = step(0.18, length(totalEmissiveRadiance) * 0.57735);
      totalEmissiveRadiance *= (steppedEmissive + 0.5) * 0.6667;
      `,
    )
  }
}