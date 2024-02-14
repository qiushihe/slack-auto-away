import { SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName } from "~src/constant/job.constant";
import { TimezoneName } from "~src/type/timezone.generated.type";
import { processEnvGetString } from "~src/util/env.util";
import { invokeJobCommand } from "~src/util/job.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { eventBodyExtractor, IVerifiableEvent } from "~src/util/request.util";
import { emptyResponse } from "~src/util/response.util";

interface EventSubscriptionEvent extends IVerifiableEvent {}

enum EventType {
  UrlVerification = "url_verification",
  EventCallback = "event_callback"
}

interface BaseEventPayload {
  token: string;
  type: EventType;
}

interface UrlVerificationEventPayload extends BaseEventPayload {
  type: EventType.UrlVerification;
  challenge: string;
}

interface EventCallbackEventPayload extends BaseEventPayload {
  type: EventType.EventCallback;
  event: BaseSlackEvent;
}

enum SlackEventType {
  UserChange = "user_change"
}

interface BaseSlackEvent {
  type: SlackEventType;
}

interface UserChangeSlackEvent extends BaseSlackEvent {
  type: SlackEventType.UserChange;
  user: SlackUser;
}

interface SlackUser {
  id: string;
  name: string;
  real_name?: string;
  tz?: string;
}

type EventPayload = UrlVerificationEventPayload | EventCallbackEventPayload;

const logger = new NamespacedLogger("event/subscription");

export const handler: Handler<EventSubscriptionEvent> = async (evt) => {
  const signingSecret = processEnvGetString("SIGNING_SECRET");
  const loggableUserIdsString = processEnvGetString("LOGGABLE_USER_IDS");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  const sqs = new SQSClient();

  const loggableUserIds = (loggableUserIdsString || "").trim().split(",");

  const extractEventBody = eventBodyExtractor<EventPayload>(logger, false, "v0", signingSecret);
  const [extractionErr, evtPayload] = extractEventBody(evt);
  if (extractionErr) {
    logger.error(`Error extracting event body: ${extractionErr.message}`);
    return emptyResponse(500);
  }

  if (evtPayload.type === EventType.UrlVerification) {
    logger.log("Received URL Verification event");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: evtPayload.challenge })
    };
  } else if (evtPayload.type === EventType.EventCallback) {
    const slackEvent = evtPayload.event;
    if (slackEvent.type === SlackEventType.UserChange) {
      const user = (slackEvent as UserChangeSlackEvent).user;
      if (loggableUserIds.includes(user.id)) {
        logger.log("Received loggable User Change event: ", user);
      } else {
        logger.log("Received non-loggable User Change event: ", user.id);
      }

      if (user.tz) {
        logger.log(`Enqueuing ${JobName.STORE_TIMEZONE} job ...`);
        const [queueErr] = await promisedFn(
          (userId: string, timezoneName: TimezoneName) =>
            sqs.send(
              invokeJobCommand(jobsQueueUrl, JobName.STORE_TIMEZONE, { userId, timezoneName })
            ),
          user.id,
          user.tz
        );
        if (queueErr) {
          logger.error(`Error enqueuing ${JobName.STORE_TIMEZONE} job: ${queueErr.message}`);
        } else {
          logger.log(`Done enqueuing ${JobName.STORE_TIMEZONE} job`);
        }
      } else {
        logger.log("User has no timezone");
      }
    } else {
      logger.warn(`Unknown slack event type: ${(slackEvent as BaseSlackEvent).type}`);
    }
    return { statusCode: 202 };
  } else {
    logger.warn(`Unknown event type: ${(evtPayload as BaseEventPayload).type}`);
    return { statusCode: 204 };
  }
};
