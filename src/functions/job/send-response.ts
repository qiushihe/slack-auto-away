import { Handler } from "aws-lambda";

import { SendResponseJob } from "~src/constant/job.constant";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type SendResponseEvent = {
  Job: SendResponseJob;
};

const logger = new NamespacedLogger("job/send-response");

export const handler: Handler<SendResponseEvent> = async (evt) => {
  logger.log("Event: ", evt);

  logger.log(`Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `${evt.Job.responseMessage}`
      })
    })
  );
  if (err) {
    logger.error(`Error sending response: ${err.message}`);
  } else {
    logger.log(`Done sending response`);
  }

  return emptyResponse();
};
