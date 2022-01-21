import peerDepsExternal from "rollup-plugin-peer-deps-external";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import copy from "rollup-plugin-copy";
import license from "rollup-plugin-license";

const path = require('path');
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
    license({
      sourcemap: true,
      cwd: __dirname,//'.', // Default is process.cwd()

      banner: {
        commentStyle: 'regular', // The default

        content: {
          file: path.join(__dirname, 'LICENSE'),
          encoding: 'utf-8', // Default is utf-8
        },

        // // Optional, may be an object or a function returning an object.
        // data() {
        //   return {
        //   };
        // },
      },

      // thirdParty: {
      //   includePrivate: false, // Default is false.
      //   output: {
      //     file: path.join(__dirname, 'dist', 'dependencies.txt'),
      //     encoding: 'utf-8', // Default is utf-8.
      //   },
      // },
    }),
  ]
};
