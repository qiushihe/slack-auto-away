import { SQSClient } from "@aws-sdk/client-sqs";

import { CommandHandler } from "~src/constant/command.constant";
import { JobName } from "~src/constant/job.constant";
import { invokeJobCommand } from "~src/util/job.util";
import { promisedFn } from "~src/util/promise.util";
import { jsonResponse } from "~src/util/response.util";

type LogoutCmdEnvVars = {
  jobsQueueUrl: string;
};

export const command: CommandHandler<LogoutCmdEnvVars> = async (logger, cmd) => {
  logger.log("Handling command: logout ...");

  const sqs = new SQSClient();

  logger.log(`Enqueuing ${JobName.LOGOUT} job ...`);
  const [queueErr] = await promisedFn(
    (responseUrl: string, userId: string) =>
      sqs.send(
        invokeJobCommand(cmd.environmentVariable.jobsQueueUrl, JobName.LOGOUT, {
          responseUrl,
          userId
        })
      ),
    cmd.responseUrl,
    cmd.userId
  );
  if (queueErr) {
    logger.error(`Error enqueuing ${JobName.LOGOUT} job: ${queueErr.message}`);
  } else {
    logger.log(`Done enqueuing ${JobName.LOGOUT} job`);
  }

  return jsonResponse({
    response_type: "ephemeral",
    text: "Logging out ..."
  });
};
