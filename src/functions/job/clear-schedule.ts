import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userScheduleS3StorageKey } from "~src/constant/user-data.constant";
import { ClearScheduleJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type ClearScheduleEvent = {
  Job: ClearScheduleJob;
};

export const handler: Handler<ClearScheduleEvent> = async (evt) => {
  console.log("[job/clear-schedule] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  let hasScheduleFile = false;

  console.log(`[job/clear-schedule] Checking schedule file ...`);
  const [getScheduleFileErr, getScheduleFileRes] = await promisedFn(() =>
    new S3Client().send(
      new GetObjectCommand({
        Bucket: dataBucketName,
        Key: userScheduleS3StorageKey(evt.Job.userId)
      })
    )
  );
  if (getScheduleFileErr) {
    console.error(
      `[job/clear-schedule] Error getting schedule file: ${getScheduleFileErr.message}`
    );
  } else {
    console.log(`[job/clear-schedule] Done getting schedule file`);
    hasScheduleFile = !!getScheduleFileRes.Body;
  }

  if (hasScheduleFile) {
    console.log(`[job/clear-schedule] Schedule file found. Deleting schedule file ...`);
    const [deleteScheduleFileErr] = await promisedFn(() =>
      new S3Client().send(
        new DeleteObjectCommand({
          Bucket: dataBucketName,
          Key: userScheduleS3StorageKey(evt.Job.userId)
        })
      )
    );
    if (deleteScheduleFileErr) {
      console.log(
        `[job/clear-schedule] Error deleting schedule file: ${deleteScheduleFileErr.message}`
      );
    } else {
      console.log(`[job/clear-schedule] Done deleting schedule file`);
    }
  } else {
    console.log(`[job/clear-schedule] Schedule file not found`);
  }

  console.log(`[job/clear-schedule] Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Schedule cleared." })
    })
  );
  if (err) {
    console.error(`[job/clear-schedule] Error sending response: ${err.message}`);
  } else {
    console.log(`[job/clear-schedule] Done sending response`);
  }

  return emptyResponse();
};
