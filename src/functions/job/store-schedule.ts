import { S3Client } from "@aws-sdk/client-s3";
import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName } from "~src/constant/job.constant";
import { IndexUserDataJob, StoreScheduleJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { setUserData } from "~src/util/user-data.util";

type StoreScheduleEvent = {
  Job: StoreScheduleJob;
};

const logger = new NamespacedLogger("job/store-schedule");

export const handler: Handler<StoreScheduleEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  logger.log("Storing user schedule ...");
  const setUserDataErr = await setUserData(logger, new S3Client(), dataBucketName, evt.Job.userId, {
    scheduleFromHour24: evt.Job.fromHour24,
    scheduleToHour24: evt.Job.toHour24
  });

  let responseMessage: string;
  if (setUserDataErr) {
    logger.error(`Error storing user schedule: ${setUserDataErr.message}`);
    responseMessage = `Unable to store schedule.`;
  } else {
    logger.log("Done storing user schedule");
    responseMessage = `Schedule stored.`;
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
