import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const main = async () => {
  const backupDirectoryPath = path.resolve(__dirname, "..", ".tfstate-backup");
  const stateFilePath = path.resolve(__dirname, "..", "terraform.tfstate");

  fs.mkdirSync(backupDirectoryPath, { recursive: true });

  if (fs.existsSync(stateFilePath)) {
    try {
      const backupStateFilePath = path.resolve(
        backupDirectoryPath,
        `terraform.tfstate-${new Date().getTime()}`
      );
      fs.copyFileSync(stateFilePath, backupStateFilePath);
      console.log(`Copied ${stateFilePath} -> ${backupStateFilePath}`);
    } catch (err) {
      console.error(`Error copying ${stateFilePath}: ${err.message}`);
    }
  } else {
    console.warn(`State file does not exist: ${stateFilePath}`);
  }
};

main().catch(console.error);
