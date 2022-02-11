import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import copy from "rollup-plugin-copy";
import { embedLicense } from "@vdimensions/rollup-js-helpers";

const packageJson = require("./package.json");

export default {
  input: "src/index.tsx",
  output: [
    {
      file: `dist/${packageJson.main}`,
      format: "cjs",
      sourcemap: true
    },
    {
      file: `dist/${packageJson.module}`,
      format: "esm",
      sourcemap: true
    }
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    commonjs(),
    typescript({ 
      useTsconfigDeclarationDir: true, 
      rollupCommonJSResolveHack: false,
      clean: true
    }),
    copy({
      targets: [
        {
          src: "package.json",
          dest: "dist"
        }
      ]
    }),
    embedLicense({workDir: __dirname}),
  ]
};
