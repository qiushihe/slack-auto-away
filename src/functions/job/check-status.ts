import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { CheckStatusJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { stringifyNormalizedTime } from "~src/util/time.util";
import { getUserData } from "~src/util/user-data.util";

type CheckStatusEvent = {
  Job: CheckStatusJob;
};

const logger = new NamespacedLogger("job/check-status");

export const handler: Handler<CheckStatusEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  logger.log(`Getting user data ...`);
  const [userDataErr, userData] = await getUserData(
    logger,
    new S3Client(),
    dataBucketName,
    evt.Job.userId
  );
  if (userDataErr) {
    logger.error(`Error getting user data: ${userDataErr.message}`);
  } else {
    logger.log(`Done getting user data`);
  }

  const authStatus =
    (userData?.authToken || "").trim().length > 0 ? "authenticated" : "not authenticated";

  let scheduleStatus = "off";
  if (userData?.scheduleFromHour24 && userData.scheduleToHour24) {
    const [fromTime24Str, fromTime12Str] = stringifyNormalizedTime(userData.scheduleFromHour24);
    const [toTime24Str, toTime12Str] = stringifyNormalizedTime(userData.scheduleToHour24);
    scheduleStatus = `from ${fromTime12Str} (${fromTime24Str}) to ${toTime12Str} (${toTime24Str})`;
  }

  logger.log(`Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [
          "Status:",
          ` • Authentication: ${authStatus}`,
          ` • Schedule: ${scheduleStatus}`
        ].join("\n")
      })
    })
  );
  if (err) {
    logger.error(`Error sending response: ${err.message}`);
  } else {
    logger.log(`Done sending response`);
  }

  return emptyResponse();
};
