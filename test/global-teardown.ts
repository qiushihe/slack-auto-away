import * as compose from "docker-compose";
import path from "path";

export default async () => {
  await compose.down({ cwd: path.resolve(__dirname, "..") });
};
