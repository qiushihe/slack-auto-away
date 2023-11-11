import { Handler } from "aws-lambda";

import { SendResponseJob } from "~src/job/job.type";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type SendResponseEvent = {
  Job: SendResponseJob;
};

export const handler: Handler<SendResponseEvent> = async (evt) => {
  console.log("[job/send-response] Event: ", evt);

  console.log(`[job/send-response] Sending response ...`);
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
    console.error(`[job/send-response] Error sending response: ${err.message}`);
  } else {
    console.log(`[job/send-response] Done sending response`);
  }

  return emptyResponse();
};
