import { GetObjectCommand, GetObjectCommandOutput, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey, userScheduleS3StorageKey } from "~src/constant/s3.constant";
import { CheckStatusJob } from "~src/job/job.type";
import { UserSchedule } from "~src/schedule/schedule.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { stringifyNormalizedTime } from "~src/util/time.util";

type CheckStatusEvent = {
  Job: CheckStatusJob;
};

export const handler: Handler<CheckStatusEvent> = async (evt) => {
  console.log("[job/check-status] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  let hasAuthFile = false;
  let schedule: UserSchedule | null = null;

  console.log(`[job/check-status] Getting access token file ...`);
  const [getAccessTokenFileErr, getAccessTokenFileRes] = await promisedFn(() =>
    new S3Client().send(
      new GetObjectCommand({
        Bucket: dataBucketName,
        Key: userAccessTokenS3StorageKey(evt.Job.userId)
      })
    )
  );
  if (getAccessTokenFileErr) {
    console.error(
      `[job/check-status] Error getting access token file: ${getAccessTokenFileErr.message}`
    );
  } else {
    console.log(`[job/check-status] Done getting access token file`);
    hasAuthFile = !!getAccessTokenFileRes.Body;
  }

  console.log(`[job/check-status] Getting schedule file ...`);
  const [getScheduleFileErr, getScheduleFileRes] = await promisedFn(() =>
    new S3Client().send(
      new GetObjectCommand({
        Bucket: dataBucketName,
        Key: userScheduleS3StorageKey(evt.Job.userId)
      })
    )
  );
  if (getScheduleFileErr) {
    console.error(`[job/check-status] Error getting schedule file: ${getScheduleFileErr.message}`);
  } else {
    console.log(`[job/check-status] Done getting schedule file`);

    if (getScheduleFileRes.Body) {
      const [scheduleStringError, scheduleString] = await promisedFn(
        (output: NonNullable<GetObjectCommandOutput["Body"]>) => output.transformToString("utf-8"),
        getScheduleFileRes.Body
      );
      if (scheduleStringError) {
        console.error(
          `[job/check-status] Error getting schedule string: ${scheduleStringError.message}`
        );
      } else {
        const [parsedScheduleErr, parsedSchedule] = await promisedFn(
          async (data: string) => JSON.parse(data) as UserSchedule,
          scheduleString
        );
        if (parsedScheduleErr) {
          console.error(
            `[job/check-status] Error parsing schedule string: ${parsedScheduleErr.message}`
          );
        } else {
          schedule = parsedSchedule;
        }
      }
    }
  }

  const authStatus = hasAuthFile ? "authenticated" : "not authenticated";

  let scheduleStatus = "off";
  if (schedule) {
    const [fromTime24Str, fromTime12Str] = stringifyNormalizedTime(schedule.fromHour24);
    const [toTime24Str, toTime12Str] = stringifyNormalizedTime(schedule.toHour24);
    scheduleStatus = `from ${fromTime12Str} (${fromTime24Str}) to ${toTime12Str} (${toTime24Str})`;
  }

  console.log(`[job/check-status] Sending response ...`);
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
    console.error(`[job/check-status] Error sending response: ${err.message}`);
  } else {
    console.log(`[job/check-status] Done sending response`);
  }

  return emptyResponse();
};
