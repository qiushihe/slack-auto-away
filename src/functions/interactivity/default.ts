import { Handler } from "aws-lambda";

import { EventPayload } from "~src/constant/event.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { extractEventBody, IVerifiableEvent } from "~src/util/request.util";
import { emptyResponse } from "~src/util/response.util";

interface InteractivityDefaultEvent extends IVerifiableEvent {}

const logger = new NamespacedLogger("interactivity/default");

export const handler: Handler<InteractivityDefaultEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");
  const signingSecret = processEnvGetString("SIGNING_SECRET");

  const evtPayload = extractEventBody(logger, true, evt, "v0", signingSecret) as EventPayload;

  logger.log("jobsQueueUrl: ", jobsQueueUrl);
  logger.log("evtPayload: ", JSON.stringify(evtPayload));

  return emptyResponse();
};
