import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { ClearScheduleJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
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
