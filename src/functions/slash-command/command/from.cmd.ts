import { SQSClient } from "@aws-sdk/client-sqs";

import { CommandHandler } from "~src/constant/command.constant";
import { JobName } from "~src/constant/job.constant";
import { invokeJobCommand } from "~src/util/job.util";
import { promisedFn } from "~src/util/promise.util";
import { jsonResponse } from "~src/util/response.util";
import { stringifyNormalizedTime } from "~src/util/time.util";

type FromCmdEnvVars = {
  jobsQueueUrl: string;
};

const SCHEDULE_STRING_REGEXP_12H = new RegExp(
  "^from\\s+(([1-9]|1[0-2])[ap]m)\\s+to\\s+(([1-9]|1[0-2])[ap]m)$",
  "i"
);

const SCHEDULE_STRING_REGEXP_24H = new RegExp(
  "^from\\s+([1-9]|1[0-9]|2[0-4])\\s+to\\s+([1-9]|1[0-9]|2[0-4])$",
  "i"
);

export const command: CommandHandler<FromCmdEnvVars> = async (logger, cmd) => {
  logger.log("Handling command: from ...");

  const matches12h = cmd.text.match(SCHEDULE_STRING_REGEXP_12H);
  const matches24h = cmd.text.match(SCHEDULE_STRING_REGEXP_24H);

  let fromHour24: number | null = null;
  let toHour24: number | null = null;

  if (matches12h) {
    const fromInputTimeStr = `${matches12h[1] || ""}`.trim();
    const toInputTimeStr = `${matches12h[3] || ""}`.trim();

    fromHour24 = parseInt(fromInputTimeStr, 10);
    if (fromInputTimeStr.match(/pm$/i)) {
      fromHour24 = fromHour24 + 12;
    }

    toHour24 = parseInt(toInputTimeStr, 10);
    if (toInputTimeStr.match(/pm$/i)) {
      toHour24 = toHour24 + 12;
    }
  } else if (matches24h) {
    const fromInputTimeStr = `${matches24h[1] || ""}`.trim();
    const toInputTimeStr = `${matches24h[2] || ""}`.trim();

    fromHour24 = parseInt(fromInputTimeStr, 10);
    toHour24 = parseInt(toInputTimeStr, 10);
  }

  if (fromHour24 !== null && toHour24 !== null) {
    const [fromTime24Str, fromTime12Str] = stringifyNormalizedTime(fromHour24);
    const [toTime24Str, toTime12Str] = stringifyNormalizedTime(toHour24);

    logger.log(`Enqueuing ${JobName.STORE_SCHEDULE} job ...`);
    const [queueErr] = await promisedFn(
      (responseUrl: string, userId: string, from: number, to: number) =>
        new SQSClient().send(
          invokeJobCommand(cmd.environmentVariable.jobsQueueUrl, JobName.STORE_SCHEDULE, {
            responseUrl,
            userId,
            fromHour24: from,
            toHour24: to
          })
        ),
      cmd.responseUrl,
      cmd.userId,
      fromHour24,
      toHour24
    );
    if (queueErr) {
      logger.error(`Error enqueuing ${JobName.STORE_SCHEDULE} job: ${queueErr.message}`);
    } else {
      logger.log(`Done enqueuing ${JobName.STORE_SCHEDULE} job`);
    }

    return jsonResponse({
      response_type: "ephemeral",
      text: [
        "Received schedule:",
        ` • Set status to \`away\` at ${fromTime12Str} / ${fromTime24Str}`,
        ` • Clear \`away\` status at ${toTime12Str} / ${toTime24Str}`,
        "Storing schedule ..."
      ].join("\n")
    });
  } else {
    return jsonResponse({
      response_type: "ephemeral",
      text: "Invalid input"
    });
  }
};
