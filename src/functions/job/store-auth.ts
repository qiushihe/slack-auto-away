import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey } from "~src/constant/s3.constant";
import { StoreAuthJob } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type StoreAuthEvent = {
  Job: StoreAuthJob;
};

export const handler: Handler<StoreAuthEvent> = async (evt) => {
  console.log("[job/store-auth] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  console.log("[job/store-auth] Storing user auth file ...");
  const [putObjectErr] = await promisedFn(
    (id: string, token: string) =>
      new S3Client().send(
        new PutObjectCommand({
          Bucket: dataBucketName,
          Key: userAccessTokenS3StorageKey(id),
          Body: token
        })
      ),
    evt.Job.userId,
    evt.Job.authToken
  );

  if (putObjectErr) {
    console.error(`[job/store-auth] Error storing user auth file: ${putObjectErr.message}`);
  } else {
    console.log("[job/store-auth] Done storing user auth file");
  }

  return emptyResponse();
};
