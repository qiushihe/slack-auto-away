import { Handler } from "aws-lambda";

import { InteractivityEventPayload } from "~src/constant/event.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { eventBodyExtractor, IVerifiableEvent } from "~src/util/request.util";
import { emptyResponse } from "~src/util/response.util";

interface InteractivityDefaultEvent extends IVerifiableEvent {}

const logger = new NamespacedLogger("interactivity/default");

export const handler: Handler<InteractivityDefaultEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");
  const signingSecret = processEnvGetString("SIGNING_SECRET");

  const extractInteractivityEventBody = eventBodyExtractor<InteractivityEventPayload>(
    logger,
    true,
    "v0",
    signingSecret
  );

  const [evtBodyErr, evtBody] = extractInteractivityEventBody(evt);
  if (evtBodyErr) {
    logger.error(`Unable to extract event body: ${evtBodyErr.message}`);
  } else {
    logger.log("jobsQueueUrl: ", jobsQueueUrl);
    logger.log("evtBody: ", JSON.stringify(evtBody));

    const interactivityPayload = evtBody.payload;
    logger.log("interactivityPayload: ", JSON.stringify(interactivityPayload, null, 2));
  }

  return emptyResponse();
};
