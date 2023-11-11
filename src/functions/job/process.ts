import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Handler } from "aws-lambda";

import { JobName } from "~src/constant/job.constant";
import { Job } from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type JobProcessEventRecord = {
  body: string;
};

type JobProcessEvent = {
  Records: JobProcessEventRecord[];
};

export const handler: Handler<JobProcessEvent> = async (evt) => {
  console.log("[job/process] Event: ", evt);

  const functionArnSendResponse = processEnvGetString("FUNCTION_ARN_SEND_RESPONSE");
  const functionArnCheckStatus = processEnvGetString("FUNCTION_ARN_CHECK_STATUS");

  console.log(`[job/process] Dispatching jobs ...`);
  const dispatchResults = await Promise.all(
    evt.Records.map((record) => {
      const job = JSON.parse(record.body) as Job;
      let functionArn: string | null = null;

      if (job.type === JobName.SEND_RESPONSE) {
        functionArn = functionArnSendResponse;
      } else if (job.type === JobName.CHECK_STATUS) {
        functionArn = functionArnCheckStatus;
      }

      if (functionArn) {
        return promisedFn(
          (fnArn: string) =>
            new LambdaClient().send(
              new InvokeCommand({
                FunctionName: fnArn,
                Payload: JSON.stringify({ Job: job }),

                // Use `"RequestResponse"` if we care about the response.
                // In this case, we use `"Event"` because we just want to fire and forget.
                InvocationType: "Event"
              })
            ),
          functionArn
        );
      } else {
        return promisedFn(() =>
          Promise.resolve<[Error, null] | [null, never]>([
            new Error(`Unsupported job: ${job.type}`),
            null
          ])
        );
      }
    })
  );
  console.log(`[job/process] Done dispatching jobs`);

  dispatchResults
    .map(([err]) => err)
    .forEach((err) => {
      if (err) {
        console.error(`[job/process] Error dispatching job: ${err.message}`);
      }
    });

  return emptyResponse();
};
