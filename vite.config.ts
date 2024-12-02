import { defineConfig, type PluginOption } from "vite"
import fs from "fs"
import PACKAGE from "./package.json"



export default defineConfig((params) => {

  let version = parseInt(PACKAGE.version)

  if (params.command === "build") {
    updateVersion(++version)
  }


  return {
    publicDir: false,

    server: {
      open: "/src/index.html",
      host: true,
    },

    resolve: {
      alias: {
        "@utils": "/src/utils/",
        "@const": "/src/const.ts",
      },
    },

    optimizeDeps: {
      entries: PACKAGE.main,
    },

    plugins: [
      bundleJsToTxt(),
    ],

    build: {
      emptyOutDir: false,

      lib: {
        entry: PACKAGE.main,
        formats: [ "iife" ],
        name: "init",
      },

      outDir: "public",

      rollupOptions: {
        output: {
          entryFileNames: `bundle${version}.js`,
          globals: {
            three: "THREE",
          },
        },
        external: [ "three" ],
      },
    },
  }
})



const updateVersion = (
  version: number,
) => {
  const str = `${version}`

  const pkgPath = "./package.json"
  const pkgRgx = /(?<="version": ")\d+(?=",)/m
  editFile(pkgPath, pkgRgx, str)

  const htmlPath = "./index.html"
  const htmlRgx = /(?<=src="\.\/public\/bundle)\d+(?=\.(?:js|txt)")/m
  editFile(htmlPath, htmlRgx, str)
}



const editFile = (
  path: string,
  regex: RegExp,
  str: string,
) => {
  fs.readFile(path, "utf8", (readError, data) => {
    if (readError) throw readError
    fs.writeFile(
      path,
      data.replace(regex, str),
      (writeError) => { if (writeError) throw writeError },
    )
  })
}



const bundleJsToTxt = (): PluginOption => {
  let path: string
  let name: string
  return {
    name: "bundleJsToTxt",
    outputOptions({ dir, entryFileNames }) {
      path = dir as string
      name = (entryFileNames as string).match(/.+(?=\.js)/)![0]
    },
    closeBundle() {
      fs.rename(`${path}/${name}.js`, `${path}/${name}.txt`, (renameError) => {
        if (renameError) throw renameError
      })
    },
  }
}