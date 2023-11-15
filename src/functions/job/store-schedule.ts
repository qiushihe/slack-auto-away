import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userScheduleS3StorageKey } from "~src/constant/s3.constant";
import { StoreScheduleJob } from "~src/job/job.type";
import { UserSchedule } from "~src/schedule/schedule.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type StoreScheduleEvent = {
  Job: StoreScheduleJob;
};

export const handler: Handler<StoreScheduleEvent> = async (evt) => {
  console.log("[job/store-schedule] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  console.log("[job/store-schedule] Storing user schedule ...");
  const [putObjectErr] = await promisedFn(
    (id: string, schedule: UserSchedule) =>
      new S3Client().send(
        new PutObjectCommand({
          Bucket: dataBucketName,
          Key: userScheduleS3StorageKey(id),
          Body: JSON.stringify(schedule)
        })
      ),
    evt.Job.userId,
    { userId: evt.Job.userId, fromHour24: evt.Job.fromHour24, toHour24: evt.Job.toHour24 }
  );

  let responseMessage: string;
  if (putObjectErr) {
    console.error(`[job/store-schedule] Error storing user schedule: ${putObjectErr.message}`);
    responseMessage = `Unable to store schedule.`;
  } else {
    console.log("[job/store-schedule] Done storing user schedule");
    responseMessage = `Schedule stored.`;
  }

  console.log(`[job/store-schedule] Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: responseMessage })
    })
  );
  if (err) {
    console.error(`[job/store-schedule] Error sending response: ${err.message}`);
  } else {
    console.log(`[job/store-schedule] Done sending response`);
  }

  return emptyResponse();
};
