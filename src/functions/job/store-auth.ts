import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { StoreAuthJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { emptyResponse } from "~src/util/response.util";
import { setUserData } from "~src/util/user-data.util";

type StoreAuthEvent = {
  Job: StoreAuthJob;
};

const logger = new NamespacedLogger("job/store-auth");

export const handler: Handler<StoreAuthEvent> = async (evt) => {
  console.log("[job/store-auth] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  logger.log("Storing user auth token ...");
  const setUserDataErr = await setUserData(logger, new S3Client(), dataBucketName, evt.Job.userId, {
    authToken: evt.Job.authToken
  });
  if (setUserDataErr) {
    logger.error(`Error storing user auth token: ${setUserDataErr.message}`);
  } else {
    logger.log("Done storing user auth token");
  }

  return emptyResponse();
};
