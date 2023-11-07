import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import cleanup from "rollup-plugin-cleanup";

export default {
  plugins: [
    nodeResolve({
      exportConditions: ["node"], // add node option here,
      preferBuiltins: true
    }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      outputToFilesystem: true,
      compilerOptions: {
        declaration: false,
        declarationMap: false,
        sourceMap: false
      }
    }),
    cleanup({ comments: "none", sourcemap: false })
  ]
};
