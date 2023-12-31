import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { ClearScheduleJob, JobName } from "~src/constant/job.constant";
import { processEnvGetString } from "~src/util/env.util";
import { invokeJobCommand } from "~src/util/job.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { setUserData } from "~src/util/user-data.util";

type ClearScheduleEvent = {
  Job: ClearScheduleJob;
};

const logger = new NamespacedLogger("job/clear-schedule");

export const handler: Handler<ClearScheduleEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  logger.log(`Clearing user schedule ...`);
  const setUserDataErr = await setUserData(logger, new S3Client(), dataBucketName, evt.Job.userId, {
    scheduleFromHour24: undefined,
    scheduleToHour24: undefined
  });
  if (setUserDataErr) {
    logger.error(`Error clearing user schedule: ${setUserDataErr.message}`);
  } else {
    logger.log(`Done clearing user schedule`);
  }

  logger.log(`Enqueuing ${JobName.INDEX_USER_DATA} job ...`);
  const [queueErr] = await promisedFn(
    (userId: string) =>
      new SQSClient().send(invokeJobCommand(jobsQueueUrl, JobName.INDEX_USER_DATA, { userId })),
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
      body: JSON.stringify({ text: "Schedule cleared." })
    })
  );
  if (err) {
    logger.error(`Error sending response: ${err.message}`);
  } else {
    logger.log(`Done sending response`);
  }

  return emptyResponse();
};
