import childProcess from "child_process";
import fs from "fs";
import path from "path";

const promisedChild = {
  spawn: async (...args: Parameters<typeof childProcess.spawn>) => {
    return new Promise<string>((resolve, reject) => {
      const outputs: string[] = [];
      const child = childProcess.spawn(...args);

      child.stdout?.on("data", (data) => {
        outputs.push(data);
      });

      child.stderr?.on("data", (data) => {
        outputs.push(data);
      });

      child.on("close", (code) => {
        if (code === 0) {
          resolve(outputs.join(""));
        } else {
          reject(new Error(`Child process exited with non-zero code: ${code}`));
        }
      });
    });
  }
};

const getAllFiles = async (directoryPath: string): Promise<string[]> =>
  (
    await Promise.all(
      (await fs.promises.readdir(directoryPath, { withFileTypes: true }))
        .map((entry) => ({
          isDirectory: entry.isDirectory(),
          entryPath: path.join(directoryPath, entry.name)
        }))
        .map(({ isDirectory, entryPath }) => (isDirectory ? getAllFiles(entryPath) : [entryPath]))
    )
  ).flat();

const main = async (args: string[]) => {
  const [, , functionsDirectoryPath] = args;

  const filePathTuples = (await getAllFiles(functionsDirectoryPath))
    .filter((filePath) => !filePath.match(/\.spec\.ts$/))
    .map((filePath) => [
      filePath,
      filePath.replace(/\//g, "-").replace(/\.ts$/g, ".js"),
      filePath.replace(/\.ts$/g, ".js")
    ])
    .map(([inputFilePath, outputFileName, outputFilePath]) => [
      `./${inputFilePath}`,
      `./.build/${outputFileName}`,
      `./.build/${outputFilePath}`
    ]);

  await Promise.all(
    filePathTuples.map(([inputFilePath, intermediateOutputFilePath]) =>
      promisedChild.spawn(
        "rollup",
        [
          "--config",
          "./rollup-functions.config.js",
          "--input",
          inputFilePath,
          "--file",
          intermediateOutputFilePath,
          "--format",
          "cjs"
        ],
        { stdio: "inherit" }
      )
    )
  );

  await Promise.all(
    Object.keys(
      filePathTuples
        .map(([, , outputFilePath]) => outputFilePath.replace(/\/[^/]+$/, ""))
        .reduce(
          (acc, directoryPath) => ({ ...acc, [directoryPath]: directoryPath }),
          {} as Record<string, string>
        )
    ).map((directoryPath) =>
      promisedChild.spawn("mkdir", ["-v", "-p", directoryPath], { stdio: "inherit" })
    )
  );

  await Promise.all(
    filePathTuples.map(([, intermediateOutputFilePath, outputFilePath]) =>
      promisedChild.spawn("mv", ["-v", intermediateOutputFilePath, outputFilePath], {
        stdio: "inherit"
      })
    )
  );
};

main(process.argv).catch(console.error);
