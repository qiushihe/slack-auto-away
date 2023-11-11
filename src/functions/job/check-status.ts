import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey, userScheduleS3StorageKey } from "~src/constant/s3.constant";
import { CheckStatusJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type CheckStatusEvent = {
  Job: CheckStatusJob;
};

export const handler: Handler<CheckStatusEvent> = async (evt) => {
  console.log("[job/check-status] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  let hasAuthFile = false;
  let hasScheduleFile = false;

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
    hasScheduleFile = !!getScheduleFileRes.Body;
  }

  console.log(`[job/check-status] Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: [
          "Status:",
          ` • Authentication: ${hasAuthFile ? "authenticated" : "not authenticated"}`,
          ` • Schedule: ${hasScheduleFile ? "[TBD]" : "off"}`
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
