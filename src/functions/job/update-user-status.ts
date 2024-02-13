import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { UpdateUserStatusJob } from "~src/constant/job.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { emptyResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";

type UpdateUserStatusEvent = {
  Job: UpdateUserStatusJob;
};

const logger = new NamespacedLogger("job/update-user-status");

export const handler: Handler<UpdateUserStatusEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  const s3 = new S3Client();

  logger.log(`Getting user data for user ID: ${evt.Job.userId} ...`);
  const [userDataErr, userData] = await getUserData(logger, s3, dataBucketName, evt.Job.userId);
  if (userDataErr) {
    logger.error(`Error getting user data for user IDs: ${evt.Job.userId}`);
    return emptyResponse();
  }

  if (!userData) {
    logger.warn(`Missing user data for user IDs: ${evt.Job.userId}`);
    return emptyResponse();
  }

  logger.log(`Updating away status for user ID: ${evt.Job.userId} ...`);
  console.log(
    "POTENTIAL USER DATA",
    userData.userId,
    userData.timezoneName,
    JSON.stringify(userData.schedule)
  );

  logger.log(`Done updating away status for user ID: ${evt.Job.userId}`);
  return emptyResponse();
};
