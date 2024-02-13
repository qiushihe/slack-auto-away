import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName, StoreTimezoneJob } from "~src/constant/job.constant";
import { processEnvGetString } from "~src/util/env.util";
import { invokeJobCommand } from "~src/util/job.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { setUserData } from "~src/util/user-data.util";

type StoreTimezoneEvent = {
  Job: StoreTimezoneJob;
};

const logger = new NamespacedLogger("job/store-timezone");

export const handler: Handler<StoreTimezoneEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  const s3 = new S3Client();
  const sqs = new SQSClient();

  logger.log("Storing user timezone ...");
  const setUserDataErr = await setUserData(logger, s3, dataBucketName, evt.Job.userId, {
    timezoneName: evt.Job.timezoneName
  });
  if (setUserDataErr) {
    logger.error(`Error storing user timezone: ${setUserDataErr.message}`);
  } else {
    logger.log("Done storing user timezone");
  }

  logger.log(`Enqueuing ${JobName.INDEX_USER_DATA} job ...`);
  const [queueErr] = await promisedFn(
    (userId: string) =>
      sqs.send(invokeJobCommand(jobsQueueUrl, JobName.INDEX_USER_DATA, { userId })),
    evt.Job.userId
  );
  if (queueErr) {
    logger.error(`Error enqueuing ${JobName.INDEX_USER_DATA} job: ${queueErr.message}`);
  } else {
    logger.log(`Done enqueuing ${JobName.INDEX_USER_DATA} job`);
  }

  return emptyResponse();
};
