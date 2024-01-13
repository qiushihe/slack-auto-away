import { Handler } from "aws-lambda";

import { InteractivityEventPayload, InteractivityPayload } from "~src/constant/event.constant";
import { InteractivityEventHandler } from "~src/functions/interactivity/event-handler.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { eventBodyExtractor, IVerifiableEvent } from "~src/util/request.util";
import { emptyResponse } from "~src/util/response.util";
import { eventHandler as scheduleViewHandler } from "~src/view/schedule/handler";

interface InteractivityDefaultEvent extends IVerifiableEvent {}

const logger = new NamespacedLogger("interactivity/default");

const VIEW_EVENT_HANDLER: Record<string, InteractivityEventHandler> = {
  "schedule-view": scheduleViewHandler
};

export const handler: Handler<InteractivityDefaultEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const slackApiUrlPrefix = processEnvGetString("SLACK_API_URL_PREFIX");
  const signingSecret = processEnvGetString("SIGNING_SECRET");

  const extractInteractivityEventBody = eventBodyExtractor<InteractivityEventPayload>(
    logger,
    true,
    "v0",
    signingSecret
  );

  logger.log(`Extracting event body ...`);
  const [evtBodyErr, evtBody] = extractInteractivityEventBody(evt);
  if (evtBodyErr) {
    logger.error(`Unable to extract event body: ${evtBodyErr.message}`);
    return emptyResponse();
  } else {
    logger.log(`Done extracting event body`);
  }

  logger.log(`Parsing interactivity payload ...`);
  const [interactivityPayloadErr, interactivityPayload] = await promisedFn<InteractivityPayload>(
    () => JSON.parse(evtBody.payload)
  );
  if (interactivityPayloadErr) {
    logger.error(`Unable to parse interactivity payload: ${interactivityPayloadErr.message}`);
    return emptyResponse();
  } else {
    logger.log(`Done parsing interactivity payload`);
  }

  const viewCallbackId = interactivityPayload?.view.callback_id || null;
  if (!viewCallbackId) {
    logger.error("Missing interactivity payload callback ID");
    return emptyResponse();
  } else {
    logger.log(`Received interactivity payload callback ID: ${viewCallbackId}`);
  }

  const eventHandler = VIEW_EVENT_HANDLER[viewCallbackId];
  if (!eventHandler) {
    logger.error(`Unknown interactivity payload callback ID: ${viewCallbackId}`);
    return emptyResponse();
  } else {
    logger.log(`Found event handler for interactivity payload callback ID: ${viewCallbackId}`);
  }

  const handleViewEvent = eventHandler(logger, dataBucketName, slackApiUrlPrefix);
  const viewEventErr = await handleViewEvent(interactivityPayload);
  if (viewEventErr) {
    logger.error(`Error handling view interactivity payload: ${viewEventErr.message}`);
    return emptyResponse();
  } else {
    logger.log("Done handling view interactivity payload");
  }

  return emptyResponse();
};
