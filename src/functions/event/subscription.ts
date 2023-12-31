import { Handler } from "aws-lambda";

import { processEnvGetString } from "~src/util/env.util";
import { extractEventBody, IVerifiableEvent } from "~src/util/request.util";

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

export const handler: Handler<EventSubscriptionEvent> = async (evt) => {
  const signingSecret = processEnvGetString("SIGNING_SECRET");
  const loggableUserIdsString = processEnvGetString("LOGGABLE_USER_IDS");

  const loggableUserIds = (loggableUserIdsString || "").trim().split(",");

  const eventPayload = extractEventBody(
    "event/subscription",
    false,
    evt,
    "v0",
    signingSecret
  ) as EventPayload;

  if (eventPayload.type === EventType.UrlVerification) {
    console.log("[event/subscription] Received URL Verification event");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ challenge: eventPayload.challenge })
    };
  } else if (eventPayload.type === EventType.EventCallback) {
    const slackEvent = eventPayload.event;
    if (slackEvent.type === SlackEventType.UserChange) {
      const user = (slackEvent as UserChangeSlackEvent).user;
      if (loggableUserIds.includes(user.id)) {
        console.log("[event/subscription] Received loggable User Change event: ", user);
      } else {
        console.log("[event/subscription] Received non-loggable User Change event: ", user.id);
      }
    } else {
      console.warn(
        `[event/subscription] Unknown slack event type: ${(slackEvent as BaseSlackEvent).type}`
      );
    }
    return { statusCode: 202 };
  } else {
    console.warn(
      `[event/subscription] Unknown event type: ${(eventPayload as BaseEventPayload).type}`
    );
    return { statusCode: 204 };
  }
};
