import { DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey } from "~src/constant/s3.constant";
import { ClearAuthJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type ClearAuthEvent = {
  Job: ClearAuthJob;
};

export const handler: Handler<ClearAuthEvent> = async (evt) => {
  console.log("[job/clear-auth] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  let hasAuthFile = false;

  console.log(`[job/clear-auth] Checking auth file ...`);
  const [getAuthFileErr, getAuthFileRes] = await promisedFn(() =>
    new S3Client().send(
      new GetObjectCommand({
        Bucket: dataBucketName,
        Key: userAccessTokenS3StorageKey(evt.Job.userId)
      })
    )
  );
  if (getAuthFileErr) {
    console.error(`[job/clear-auth] Error getting auth file: ${getAuthFileErr.message}`);
  } else {
    console.log(`[job/clear-auth] Done getting auth file`);
    hasAuthFile = !!getAuthFileRes.Body;
  }

  if (hasAuthFile) {
    console.log(`[job/clear-auth] Auth file found. Deleting auth file ...`);
    const [deleteAuthFileErr] = await promisedFn(() =>
      new S3Client().send(
        new DeleteObjectCommand({
          Bucket: dataBucketName,
          Key: userAccessTokenS3StorageKey(evt.Job.userId)
        })
      )
    );
    if (deleteAuthFileErr) {
      console.log(`[job/clear-auth] Error deleting auth file: ${deleteAuthFileErr.message}`);
    } else {
      console.log(`[job/clear-auth] Done deleting auth file`);
    }
  } else {
    console.log(`[job/clear-auth] Auth file not found`);
  }

  console.log(`[job/clear-auth] Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Auth cleared." })
    })
  );
  if (err) {
    console.error(`[job/clear-auth] Error sending response: ${err.message}`);
  } else {
    console.log(`[job/clear-auth] Done sending response`);
  }

  return emptyResponse();
};
