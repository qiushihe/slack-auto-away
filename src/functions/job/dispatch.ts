import { InvokeCommand, LambdaClient } from "@aws-sdk/client-lambda";
import { Handler } from "aws-lambda";

import { Job, JobName } from "~src/constant/job.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type JobProcessEventRecord = {
  body: string;
};

type JobProcessEvent = {
  Records: JobProcessEventRecord[];
};

const logger = new NamespacedLogger("job/dispatch");

export const handler: Handler<JobProcessEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const functionArnByJob: Record<JobName, string> = {
    [JobName.SEND_RESPONSE]: processEnvGetString("FUNCTION_ARN_SEND_RESPONSE"),
    [JobName.CHECK_STATUS]: processEnvGetString("FUNCTION_ARN_CHECK_STATUS"),
    [JobName.STORE_AUTH]: processEnvGetString("FUNCTION_ARN_STORE_AUTH"),
    [JobName.STORE_TIMEZONE]: processEnvGetString("FUNCTION_ARN_STORE_TIMEZONE"),
    [JobName.LOGOUT]: processEnvGetString("FUNCTION_ARN_LOGOUT"),
    [JobName.INDEX_USER_DATA]: processEnvGetString("FUNCTION_ARN_INDEX_USER_DATA")
  };

  logger.log(`Dispatching jobs ...`);
  const dispatchResults = await Promise.all(
    evt.Records.map((record) => {
      const job = JSON.parse(record.body) as Job;
      const functionArn: string | null = functionArnByJob[job.type] || null;

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
  logger.log(`Done dispatching jobs`);

  dispatchResults
    .map(([err]) => err)
    .forEach((err) => {
      if (err) {
        logger.error(`Error dispatching job: ${err.message}`);
      }
    });

  return emptyResponse();
};
