import { Handler } from "aws-lambda";

import { StoreScheduleJob } from "~src/job/job.type";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";

type StoreScheduleEvent = {
  Job: StoreScheduleJob;
};

export const handler: Handler<StoreScheduleEvent> = async (evt) => {
  console.log("[job/store-schedule] Event: ", evt);

  console.log(`[job/store-schedule] Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `job/store-schedule: ${JSON.stringify(evt)}`
      })
    })
  );
  if (err) {
    console.error(`[job/store-schedule] Error sending response: ${err.message}`);
  } else {
    console.log(`[job/store-schedule] Done sending response`);
  }

  return emptyResponse();
};
