import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import cleanup from "rollup-plugin-cleanup";

export default {
  plugins: [
    nodeResolve({
      exportConditions: ["node"],
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
  ],
  external: [
    // Lambda execution environment has AWS SDK preinstalled and available for import. So there is
    // no need to bundle the AWS SDK with the rest of the code.
    // Note: AWS SDK is the only NPM package made available this way. Other 3rd party NPM packages
    // still need to be bundled.
    "@aws-sdk/client-s3",
    "@aws-sdk/client-sqs",
    "@aws-sdk/client-lambda"
  ]
};
