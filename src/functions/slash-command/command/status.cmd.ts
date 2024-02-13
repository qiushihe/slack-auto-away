import { SQSClient } from "@aws-sdk/client-sqs";

import { CommandHandler } from "~src/constant/command.constant";
import { JobName } from "~src/constant/job.constant";
import { invokeJobCommand } from "~src/util/job.util";
import { promisedFn } from "~src/util/promise.util";
import { jsonResponse } from "~src/util/response.util";

type StatusCmdEnvVars = {
  jobsQueueUrl: string;
};

export const command: CommandHandler<StatusCmdEnvVars> = async (logger, cmd) => {
  logger.log("Handling command: status ...");

  const sqs = new SQSClient();

  logger.log(`Enqueuing ${JobName.CHECK_STATUS} job ...`);
  const [queueErr] = await promisedFn(
    (responseUrl: string, userId: string) =>
      sqs.send(
        invokeJobCommand(cmd.environmentVariable.jobsQueueUrl, JobName.CHECK_STATUS, {
          responseUrl,
          userId
        })
      ),
    cmd.responseUrl,
    cmd.userId
  );
  if (queueErr) {
    logger.error(`Error enqueuing ${JobName.CHECK_STATUS} job: ${queueErr.message}`);
  } else {
    logger.log(`Done enqueuing ${JobName.CHECK_STATUS} job`);
  }

  return jsonResponse({
    response_type: "ephemeral",
    text: "Checking status ..."
  });
};
