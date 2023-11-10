import { Handler } from "aws-lambda";

import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

export type SendResponseJob = {
  type: "send-response";
  responseUrl: string;
  responseMessage: string;
};

type JobProcessEventRecord = {
  body: string;
};

type JobProcessEvent = {
  Records: JobProcessEventRecord[];
};

export const handler: Handler<JobProcessEvent> = async (evt) => {
  console.log("[job/process] Event: ", evt);

  for (let recordIndex = 0; recordIndex < evt.Records.length; recordIndex++) {
    const record = evt.Records[recordIndex];
    const payload = JSON.parse(record.body) as SendResponseJob;

    console.log(`[job/process] Sending response ...`);
    const [err] = await promisedFn(() =>
      fetch(payload.responseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: payload.responseMessage
        })
      })
    );
    if (err) {
      console.error(`[job/process] Error sending response: ${err.message}`);
    } else {
      console.log(`[job/process] Done sending response`);
    }
  }

  return emptyResponse();
};
