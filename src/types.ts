import type { BufferGeometry, DataTexture, Group, Mesh, MeshStandardMaterial, PerspectiveCamera, Sphere, Texture } from "three"
import type { GLTF } from "three/examples/jsm/loaders/GLTFLoader"
import type { TCamAnimTransition, TCamAnimType } from "./features"
import { ThemeMode } from "@const"



export interface IInitProps {
  container: HTMLDivElement
  path: string
  onProgress: (type: string, progress?: number) => void
  cameraType: TCamAnimType
  content: boolean
  themeMode: ThemeMode
  BG: string
  BG_DARK: string
}



export type IFetchedData = (GLTF | Texture | DataTexture)[]



export interface IHouseInnerMesh extends Mesh {
  geometry: BufferGeometry & {
    boundingSphere: Sphere
  }
  material: MeshStandardMaterial
  userData: {
    lightTexture: Texture
    darkTexture: Texture
    trueNightTexture?: Texture
  }
}

export interface IHouse extends Group {
  children: IHouseInnerMesh[]
  add(...object: IHouseInnerMesh[]): this
  userData: {
    bulbs: IHouseInnerMesh
  }
  traverse: (callback: (obj: IHouseInnerMesh) => void) => void
}



export interface ICameraPivot extends PerspectiveCamera {
  userData: {
    type: TCamAnimType
    tween: TCamAnimTransition
  }
}
