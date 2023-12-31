import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { IndexName } from "~src/constant/user-data.constant";
import { CheckStatusJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { stringifyNormalizedTime } from "~src/util/time.util";
import { getUserData } from "~src/util/user-data.util";
import { isUserIdIndexed } from "~src/util/user-index.util";

type CheckStatusEvent = {
  Job: CheckStatusJob;
};

const logger = new NamespacedLogger("job/check-status");

export const handler: Handler<CheckStatusEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  let authStatus: string;
  let timezoneStatus: string;
  let scheduleStatus: string;

  logger.log(`Checking user auth index ...`);
  const [hasAuthErr, hasAuth] = await isUserIdIndexed(
    logger,
    new S3Client(),
    dataBucketName,
    IndexName.HAS_AUTH,
    evt.Job.userId
  );
  if (hasAuthErr) {
    logger.error(`Error checking user index ${IndexName.HAS_AUTH}: ${hasAuthErr.message}`);
    authStatus = "error";
  } else {
    logger.log(`Done checking user auth index`);
    authStatus = hasAuth ? "authenticated" : "not authenticated";
  }

  logger.log(`Getting user data ...`);
  const [userDataErr, userData] = await getUserData(
    logger,
    new S3Client(),
    dataBucketName,
    evt.Job.userId
  );
  if (userDataErr) {
    logger.error(`Error getting user data: ${userDataErr.message}`);
    timezoneStatus = "error";
    scheduleStatus = "error";
  } else {
    logger.log(`Done getting user data`);

    if (!!userData?.timezoneName && userData.timezoneName.trim().length > 0) {
      timezoneStatus = userData.timezoneName;
    } else {
      timezoneStatus = "missing";
    }

    if (userData?.scheduleFromHour24 && userData.scheduleToHour24) {
      const [fromTime24Str, fromTime12Str] = stringifyNormalizedTime(userData.scheduleFromHour24);
      const [toTime24Str, toTime12Str] = stringifyNormalizedTime(userData.scheduleToHour24);
      scheduleStatus = `from ${fromTime12Str} (${fromTime24Str}) to ${toTime12Str} (${toTime24Str})`;
    } else {
      scheduleStatus = "off";
    }
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
          ` • Timezone: ${timezoneStatus}`,
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
