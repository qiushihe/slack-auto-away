import * as compose from "docker-compose";
import path from "path";

export default async () => {
  await compose.down({ cwd: path.resolve(__dirname, "..") });
  await compose.upAll({ cwd: path.resolve(__dirname, "..") });

  // TODO: Figure out a way to ping the service instead of hard-coding the wait time.
  await new Promise((resolve) => setTimeout(resolve, 2000));
};
