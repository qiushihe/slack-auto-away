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
  console.log("[job/dispatch] Event: ", evt);

  const functionArnSendResponse = processEnvGetString("FUNCTION_ARN_SEND_RESPONSE");
  const functionArnCheckStatus = processEnvGetString("FUNCTION_ARN_CHECK_STATUS");
  const functionArnStoreSchedule = processEnvGetString("FUNCTION_ARN_STORE_SCHEDULE");
  const functionArnClearSchedule = processEnvGetString("FUNCTION_ARN_CLEAR_SCHEDULE");
  const functionArnStoreAuth = processEnvGetString("FUNCTION_ARN_STORE_AUTH");
  const functionArnClearAuth = processEnvGetString("FUNCTION_ARN_CLEAR_AUTH");

  console.log(`[job/dispatch] Dispatching jobs ...`);
  const dispatchResults = await Promise.all(
    evt.Records.map((record) => {
      const job = JSON.parse(record.body) as Job;
      let functionArn: string | null = null;

      if (job.type === JobName.SEND_RESPONSE) {
        functionArn = functionArnSendResponse;
      } else if (job.type === JobName.CHECK_STATUS) {
        functionArn = functionArnCheckStatus;
      } else if (job.type === JobName.STORE_SCHEDULE) {
        functionArn = functionArnStoreSchedule;
      } else if (job.type === JobName.CLEAR_SCHEDULE) {
        functionArn = functionArnClearSchedule;
      } else if (job.type === JobName.STORE_AUTH) {
        functionArn = functionArnStoreAuth;
      } else if (job.type === JobName.CLEAR_AUTH) {
        functionArn = functionArnClearAuth;
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
        return promisedFn(async () => {
          throw new Error(`Unsupported job: ${job.type}`);
        });
      }
    })
  );
  console.log(`[job/dispatch] Done dispatching jobs`);

  dispatchResults
    .map(([err]) => err)
    .forEach((err) => {
      if (err) {
        console.error(`[job/dispatch] Error dispatching job: ${err.message}`);
      }
    });

  return emptyResponse();
};
