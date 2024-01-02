import { SQSClient } from "@aws-sdk/client-sqs";

import { CommandHandler } from "~src/constant/command.constant";
import { JobName } from "~src/constant/job.constant";
import { invokeJobCommand } from "~src/util/job.util";
import { promisedFn } from "~src/util/promise.util";
import { jsonResponse } from "~src/util/response.util";

type OffCmdEnvVars = {
  jobsQueueUrl: string;
};

export const command: CommandHandler<OffCmdEnvVars> = async (logger, cmd) => {
  logger.log("Handling command: off ...");

  logger.log(`Enqueuing ${JobName.CLEAR_SCHEDULE} job ...`);
  const [queueErr] = await promisedFn(
    (responseUrl: string, userId: string) =>
      new SQSClient().send(
        invokeJobCommand(cmd.environmentVariable.jobsQueueUrl, JobName.CLEAR_SCHEDULE, {
          responseUrl,
          userId
        })
      ),
    cmd.responseUrl,
    cmd.userId
  );
  if (queueErr) {
    logger.error(`Error enqueuing ${JobName.CLEAR_SCHEDULE} job: ${queueErr.message}`);
  } else {
    logger.log(`Done enqueuing ${JobName.CLEAR_SCHEDULE} job`);
  }

  return jsonResponse({
    response_type: "ephemeral",
    text: "Clearing schedule ..."
  });
};
