import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";
import crypto from "crypto";
import querystring from "querystring";

import { JobName } from "~src/constant/job.constant";
import {
  CheckStatusJob,
  ClearAuthJob,
  ClearScheduleJob,
  SendResponseJob,
  StoreScheduleJob
} from "~src/job/job.type";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse, jsonResponse } from "~src/util/response.util";
import { stringifyNormalizedTime } from "~src/util/time.util";

interface SlashCommandDefaultEvent {
  headers: Record<string, string>;
  body: unknown;
  isBase64Encoded: boolean;
}

type CommandPayload = Record<
  | "token"
  | "team_id"
  | "team_domain"
  | "channel_id"
  | "channel_name"
  | "user_id"
  | "user_name"
  | "command"
  | "text"
  | "api_app_id"
  | "is_enterprise_install"
  | "response_url"
  | "trigger_id",
  any
>;

const SCHEDULE_STRING_REGEXP_12H = new RegExp(
  "^from\\s+(([1-9]|1[0-2])[ap]m)\\s+to\\s+(([1-9]|1[0-2])[ap]m)$",
  "i"
);

const SCHEDULE_STRING_REGEXP_24H = new RegExp(
  "^from\\s+([1-9]|1[0-9]|2[0-4])\\s+to\\s+([1-9]|1[0-9]|2[0-4])$",
  "i"
);

const verifyJsonEncodedEventSignature = (
  UNUSED_version: string,
  UNUSED_secret: string,
  UNUSED_body: string,
  UNUSED_timestamp: number,
  UNUSED_signature: string
) => {
  console.warn(
    `[slash-command/default/verify-json-encoded-event-signature] Verification for JSON encoded event body is not supported.`
  );
};

const verifyFormUrlEncodedEventSignature = (
  version: string,
  secret: string,
  body: string,
  timestamp: number,
  signature: string
) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${version}:${timestamp}:${body}`);

  if (`${version}=${hmac.digest("hex")}` !== signature) {
    throw new Error(`Invalid request signature`);
  }
};

const extractEventBody = (
  evt: SlashCommandDefaultEvent,
  signingVersion: string,
  signingSecret: string
): Record<string, any> => {
  const contentType = evt.headers["Content-Type"];
  const requestTimestamp = parseInt(evt.headers["X-Slack-Request-Timestamp"], 10);
  const signature = evt.headers["X-Slack-Signature"];

  if (contentType === "application/json") {
    if (typeof evt.body === "string") {
      const rawBody = evt.isBase64Encoded
        ? Buffer.from(evt.body as string, "base64").toString("utf-8")
        : (evt.body as string);
      console.log(`[slash-command/default] Got JSON encoded command body: ${rawBody}`);

      verifyJsonEncodedEventSignature(
        signingVersion,
        signingSecret,
        rawBody,
        requestTimestamp,
        signature
      );

      try {
        console.log("[slash-command/default] Parsing JSON encoded command body ...");
        const parsedBody = JSON.parse(rawBody) as Record<string, any>;
        console.log("[slash-command/default] Done parsing JSON encoded command body");
        return parsedBody;
      } catch (err) {
        console.error(
          `[slash-command/default] Error parsing JSON encoded command body: ${err.message}`
        );
        return {};
      }
    } else {
      return evt.body as Record<string, any>;
    }
  } else if (contentType === "application/x-www-form-urlencoded") {
    const rawBody = evt.isBase64Encoded
      ? Buffer.from(evt.body as string, "base64").toString("utf-8")
      : (evt.body as string);
    console.log(`[slash-command/default] Got form URL encoded command body: ${rawBody}`);

    verifyFormUrlEncodedEventSignature(
      signingVersion,
      signingSecret,
      rawBody,
      requestTimestamp,
      signature
    );

    try {
      console.log("[slash-command/default] Parsing form URL encoded command body ...");
      const parsedBody = querystring.parse(rawBody);
      console.log("[slash-command/default] Done parsing form URL encoded command body");
      return parsedBody;
    } catch (err) {
      console.error(
        `[slash-command/default] Error parsing form URL encoded command body: ${err.message}`
      );
      return {};
    }
  } else {
    console.error(`[slash-command/default] Unknown content-type: ${contentType}`);
    return {};
  }
};

export const handler: Handler<SlashCommandDefaultEvent> = async (evt) => {
  console.log("[slash-command/default] Event: ", evt);

  const oauthStartUrl = processEnvGetString("OAUTH_START_URL");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");
  const signingSecret = processEnvGetString("SIGNING_SECRET");

  const commandPayload = extractEventBody(evt, "v0", signingSecret) as CommandPayload;

  const commandName = `${commandPayload.command || ""}`.trim();
  const commandText = `${commandPayload.text || ""}`.trim();
  const commandWords = commandText.split(/\s+/).map((word) => `${word || ""}`.trim().toLowerCase());
  const commandResponseUrl = `${commandPayload.response_url || ""}`.trim();

  const commandApiAppId = `${commandPayload.api_app_id || ""}`.trim();
  const commandTeamId = `${commandPayload.team_id || ""}`.trim();
  const commandTeamDomain = `${commandPayload.team_domain || ""}`.trim();
  const commandUserId = `${commandPayload.user_id || ""}`.trim();
  const commandUserName = `${commandPayload.user_name || ""}`.trim();

  if (commandWords[0] === "help") {
    return jsonResponse({
      response_type: "ephemeral",
      text: [
        `Usage: \`${commandName} [command] [...options]\`:`,
        "",
        ` • \`${commandName} help\`: Display this help message`,
        ` • \`${commandName} status\`: Display authentication and schedule information`,
        ` • \`${commandName} auth\`: Initiate (or re-initiate) authentication flow`,
        ` • \`${commandName} from [time] to [time]\`: Set auto-away schedule`,
        ` • \`${commandName} off\`: Clear auto-away schedule`,
        ` • \`${commandName} logout\`: Clear authentication and auto-away schedule`,
        "",
        "For example, to set a schedule for auto-away:",
        `\`${commandName} from 5pm to 9am\``,
        "",
        "... or using 24-hour time format:",
        `\`${commandName} from 17 to 9\``,
        "",
        [
          `Once a schedule is set, *Auto Away* will automatically update your \`away\` status`,
          "based on that schedule using the timezone value in your Slack profile."
        ].join(" ")
      ].join("\n")
    });
  } else if (commandWords[0] === "status") {
    console.log(`[slash-command/default] Enqueuing ${JobName.CHECK_STATUS} job ...`);
    const [queueErr] = await promisedFn(() =>
      new SQSClient().send(
        new SendMessageCommand({
          QueueUrl: jobsQueueUrl,
          MessageBody: JSON.stringify({
            type: JobName.CHECK_STATUS,
            responseUrl: commandResponseUrl,
            userId: commandUserId
          } as CheckStatusJob)
        })
      )
    );
    if (queueErr) {
      console.error(
        `[slash-command/default] Error enqueuing ${JobName.CHECK_STATUS} job: ${queueErr.message}`
      );
    } else {
      console.log(`[slash-command/default] Done enqueuing ${JobName.CHECK_STATUS} job`);
    }

    return jsonResponse({
      response_type: "ephemeral",
      text: "Checking status ..."
    });
  } else if (commandWords[0] === "auth") {
    return jsonResponse({
      response_type: "ephemeral",
      text: [
        "To authenticate (or re-authenticate) with *Auto Away*, open this URL:",
        ` 👉 ${oauthStartUrl}`
      ].join("\n")
    });
  } else if (commandWords[0] === "from") {
    const matches12h = commandText.match(SCHEDULE_STRING_REGEXP_12H);
    const matches24h = commandText.match(SCHEDULE_STRING_REGEXP_24H);

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

      console.log(`[slash-command/default] Enqueuing ${JobName.STORE_SCHEDULE} job ...`);
      const [queueErr] = await promisedFn(() =>
        new SQSClient().send(
          new SendMessageCommand({
            QueueUrl: jobsQueueUrl,
            MessageBody: JSON.stringify({
              type: JobName.STORE_SCHEDULE,
              responseUrl: commandResponseUrl,
              userId: commandUserId,
              fromHour24,
              toHour24
            } as StoreScheduleJob)
          })
        )
      );
      if (queueErr) {
        console.error(
          `[slash-command/default] Error enqueuing ${JobName.STORE_SCHEDULE} job: ${queueErr.message}`
        );
      } else {
        console.log(`[slash-command/default] Done enqueuing ${JobName.STORE_SCHEDULE} job`);
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
  } else if (commandWords[0] === "off") {
    console.log(`[slash-command/default] Enqueuing ${JobName.CLEAR_SCHEDULE} job ...`);
    const [queueErr] = await promisedFn(() =>
      new SQSClient().send(
        new SendMessageCommand({
          QueueUrl: jobsQueueUrl,
          MessageBody: JSON.stringify({
            type: JobName.CLEAR_SCHEDULE,
            responseUrl: commandResponseUrl,
            userId: commandUserId
          } as ClearScheduleJob)
        })
      )
    );
    if (queueErr) {
      console.error(
        `[slash-command/default] Error enqueuing ${JobName.CLEAR_SCHEDULE} job: ${queueErr.message}`
      );
    } else {
      console.log(`[slash-command/default] Done enqueuing ${JobName.CLEAR_SCHEDULE} job`);
    }

    return jsonResponse({
      response_type: "ephemeral",
      text: "Clearing schedule ..."
    });
  } else if (commandWords[0] === "logout") {
    console.log(`[slash-command/default] Enqueuing ${JobName.CLEAR_AUTH} job ...`);
    const [queueClearAuthErr] = await promisedFn(() =>
      new SQSClient().send(
        new SendMessageCommand({
          QueueUrl: jobsQueueUrl,
          MessageBody: JSON.stringify({
            type: JobName.CLEAR_AUTH,
            responseUrl: commandResponseUrl,
            userId: commandUserId
          } as ClearAuthJob)
        })
      )
    );
    if (queueClearAuthErr) {
      console.error(
        `[slash-command/default] Error enqueuing ${JobName.CLEAR_AUTH} job: ${queueClearAuthErr.message}`
      );
    } else {
      console.log(`[slash-command/default] Done enqueuing ${JobName.CLEAR_AUTH} job`);
    }

    console.log(`[slash-command/default] Enqueuing ${JobName.CLEAR_SCHEDULE} job ...`);
    const [queueClearScheduleErr] = await promisedFn(() =>
      new SQSClient().send(
        new SendMessageCommand({
          QueueUrl: jobsQueueUrl,
          MessageBody: JSON.stringify({
            type: JobName.CLEAR_SCHEDULE,
            responseUrl: commandResponseUrl,
            userId: commandUserId
          } as ClearScheduleJob)
        })
      )
    );
    if (queueClearScheduleErr) {
      console.error(
        `[slash-command/default] Error enqueuing ${JobName.CLEAR_SCHEDULE} job: ${queueClearScheduleErr.message}`
      );
    } else {
      console.log(`[slash-command/default] Done enqueuing ${JobName.CLEAR_SCHEDULE} job`);
    }

    return jsonResponse({
      response_type: "ephemeral",
      text: "Clearing auth and schedule ..."
    });
  } else if (commandWords[0] === "debug") {
    return jsonResponse({
      response_type: "ephemeral",
      text: [
        "Debug information:",
        ` • API App ID: \`${commandApiAppId}\``,
        ` • Team ID: \`${commandTeamId}\``,
        ` • Team Domain: \`${commandTeamDomain}\``,
        ` • User ID: \`${commandUserId}\``,
        ` • User Name: \`${commandUserName}\``
      ].join("\n")
    });
  } else if (commandWords[0] === "riven") {
    console.log(`[slash-command/default] Enqueuing ${JobName.SEND_RESPONSE} job ...`);
    const [queueErr] = await promisedFn(() =>
      new SQSClient().send(
        new SendMessageCommand({
          QueueUrl: jobsQueueUrl,
          MessageBody: JSON.stringify({
            type: JobName.SEND_RESPONSE,
            responseUrl: commandResponseUrl,
            responseMessage: [
              "For generations, the Dreaming City housed one of the Awoken's most closely guarded secrets.",
              "She is known as Riven — Riven of a Thousand Voices. The last known Ahamkara.",
              "She has been Taken. And her death is your calling."
            ]
              .join(" ")
              .toUpperCase()
          } as SendResponseJob)
        })
      )
    );
    if (queueErr) {
      console.error(
        `[slash-command/default] Error enqueuing ${JobName.SEND_RESPONSE} job: ${queueErr.message}`
      );
    } else {
      console.log(`[slash-command/default] Done enqueuing ${JobName.SEND_RESPONSE} job`);
    }

    return emptyResponse();
  } else {
    return jsonResponse({
      response_type: "ephemeral",
      text: [
        `Unknown command: \`${commandName} ${commandText}\``,
        `For a list of available commands, run: \`${commandName} help\``
      ].join("\n")
    });
  }
};
