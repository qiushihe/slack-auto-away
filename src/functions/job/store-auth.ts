import { S3Client } from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName } from "~src/constant/job.constant";
import { IndexUserDataJob, StoreAuthJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { setUserData } from "~src/util/user-data.util";

type StoreAuthEvent = {
  Job: StoreAuthJob;
};

const logger = new NamespacedLogger("job/store-auth");

export const handler: Handler<StoreAuthEvent> = async (evt) => {
  console.log("[job/store-auth] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  logger.log("Storing user auth token ...");
  const setUserDataErr = await setUserData(logger, new S3Client(), dataBucketName, evt.Job.userId, {
    authToken: evt.Job.authToken
  });
  if (setUserDataErr) {
    logger.error(`Error storing user auth token: ${setUserDataErr.message}`);
  } else {
    logger.log("Done storing user auth token");
  }

  logger.log(`Enqueuing ${JobName.INDEX_USER_DATA} job ...`);
  const [queueErr] = await promisedFn(() =>
    new SQSClient().send(
      new SendMessageCommand({
        QueueUrl: jobsQueueUrl,
        MessageBody: JSON.stringify({
          type: JobName.INDEX_USER_DATA,
          userId: evt.Job.userId
        } as IndexUserDataJob)
      })
    )
  );
  if (queueErr) {
    logger.error(`Error enqueuing ${JobName.INDEX_USER_DATA} job: ${queueErr.message}`);
  } else {
    logger.log(`Done enqueuing ${JobName.INDEX_USER_DATA} job`);
  }

  return emptyResponse();
};
