import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";
import getTimezoneOffset from "date-fns-tz/getTimezoneOffset";

import { CheckStatusJob } from "~src/constant/job.constant";
import { IndexName } from "~src/constant/user-data.constant";
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

  const statusMessages: string[] = [];

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
    statusMessages.push("Authentication: error");
  } else {
    logger.log(`Done checking user auth index`);
    statusMessages.push(`Authentication: ${hasAuth ? "authenticated" : "not authenticated"}`);

    if (hasAuth) {
      logger.log(`Getting user data ...`);
      const [userDataErr, userData] = await getUserData(
        logger,
        new S3Client(),
        dataBucketName,
        evt.Job.userId
      );
      if (userDataErr) {
        logger.error(`Error getting user data: ${userDataErr.message}`);
        statusMessages.push("Timezone: error");
        statusMessages.push("Schedule: error");
      } else {
        logger.log(`Done getting user data`);

        if (!!userData?.timezoneName && userData.timezoneName.trim().length > 0) {
          const offset = getTimezoneOffset(userData.timezoneName, new Date()) / 1000 / 60 / 60;
          const prefix = offset < 0 ? "-" : "";
          const hours = `${Math.abs(Math.trunc(offset))}`.padStart(2, "0");
          const minutes = `${
            Math.abs(offset - Math.abs(Math.trunc(offset)) * (offset < 0 ? -1 : 1)) * 60
          }`.padStart(2, "0");

          statusMessages.push(`Timezone: ${userData.timezoneName} (${prefix}${hours}${minutes})`);
        } else {
          statusMessages.push("Timezone: missing");
        }

        if (userData?.scheduleFromHour24 && userData.scheduleToHour24) {
          const [fromTime24Str, fromTime12Str] = stringifyNormalizedTime(
            userData.scheduleFromHour24
          );
          const [toTime24Str, toTime12Str] = stringifyNormalizedTime(userData.scheduleToHour24);
          statusMessages.push(
            `Schedule: from ${fromTime12Str} (${fromTime24Str}) to ${toTime12Str} (${toTime24Str})`
          );
        } else {
          statusMessages.push("Schedule: off");
        }
      }
    }
  }

  logger.log(`Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: ["Status:", ...statusMessages.map((message) => ` • ${message}`)].join("\n")
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
