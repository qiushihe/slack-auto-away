import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName, LogoutJob } from "~src/constant/job.constant";
import { processEnvGetString } from "~src/util/env.util";
import { invokeJobCommand } from "~src/util/job.util";
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
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  const s3 = new S3Client();
  const sqs = new SQSClient();

  logger.log(`Deleting user data ...`);
  const deleteUserDataErr = await deleteUserData(logger, s3, dataBucketName, evt.Job.userId);
  let responseMessage: string;
  if (deleteUserDataErr) {
    logger.error(`Error deleting user data: ${deleteUserDataErr.message}`);
    responseMessage = `Unable to log out.`;
  } else {
    logger.log(`Done deleting user data`);
    responseMessage = `Logged out.`;
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
