import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { LogoutJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { deleteUserData } from "~src/util/user-data.util";

type LogoutEvent = {
  Job: LogoutJob;
};

const logger = new NamespacedLogger("job/logout");

export const handler: Handler<LogoutEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  logger.log(`Deleting user data ...`);
  const deleteUserDataErr = await deleteUserData(
    logger,
    new S3Client(),
    dataBucketName,
    evt.Job.userId
  );

  let responseMessage: string;
  if (deleteUserDataErr) {
    logger.error(`Error deleting user data: ${deleteUserDataErr.message}`);
    responseMessage = `Unable to log out.`;
  } else {
    logger.log(`Done deleting user data`);
    responseMessage = `Logged out.`;
  }

  logger.log(`Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: responseMessage })
    })
  );
  if (err) {
    logger.error(`Error sending response: ${err.message}`);
  } else {
    logger.log(`Done sending response`);
  }

  return emptyResponse();
};
