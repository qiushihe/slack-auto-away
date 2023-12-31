import { SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName } from "~src/constant/job.constant";
import { processEnvGetString } from "~src/util/env.util";
import { invokeJobCommand } from "~src/util/job.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { extractEventBody, IVerifiableEvent } from "~src/util/request.util";
import { emptyResponse, jsonResponse } from "~src/util/response.util";
import { stringifyNormalizedTime } from "~src/util/time.util";

interface SlashCommandDefaultEvent extends IVerifiableEvent {}

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

const logger = new NamespacedLogger("slash-command/default");

export const handler: Handler<SlashCommandDefaultEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const oauthStartUrl = processEnvGetString("OAUTH_START_URL");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");
  const signingSecret = processEnvGetString("SIGNING_SECRET");

  const commandPayload = extractEventBody(
    "slash-command/default",
    true,
    evt,
    "v0",
    signingSecret
  ) as CommandPayload;

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
    logger.log(`Enqueuing ${JobName.CHECK_STATUS} job ...`);
    const [queueErr] = await promisedFn(
      (responseUrl: string, userId: string) =>
        new SQSClient().send(
          invokeJobCommand(jobsQueueUrl, JobName.CHECK_STATUS, { responseUrl, userId })
        ),
      commandResponseUrl,
      commandUserId
    );
    if (queueErr) {
      logger.error(`Error enqueuing ${JobName.CHECK_STATUS} job: ${queueErr.message}`);
    } else {
      logger.log(`Done enqueuing ${JobName.CHECK_STATUS} job`);
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

      logger.log(`Enqueuing ${JobName.STORE_SCHEDULE} job ...`);
      const [queueErr] = await promisedFn(
        (responseUrl: string, userId: string, from: number, to: number) =>
          new SQSClient().send(
            invokeJobCommand(jobsQueueUrl, JobName.STORE_SCHEDULE, {
              responseUrl,
              userId,
              fromHour24: from,
              toHour24: to
            })
          ),
        commandResponseUrl,
        commandUserId,
        fromHour24,
        toHour24
      );
      if (queueErr) {
        logger.error(`Error enqueuing ${JobName.STORE_SCHEDULE} job: ${queueErr.message}`);
      } else {
        logger.log(`Done enqueuing ${JobName.STORE_SCHEDULE} job`);
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
    logger.log(`Enqueuing ${JobName.CLEAR_SCHEDULE} job ...`);
    const [queueErr] = await promisedFn(
      (responseUrl: string, userId: string) =>
        new SQSClient().send(
          invokeJobCommand(jobsQueueUrl, JobName.CLEAR_SCHEDULE, { responseUrl, userId })
        ),
      commandResponseUrl,
      commandUserId
    );
    if (queueErr) {
      logger.error(`Error enqueuing ${JobName.CLEAR_SCHEDULE} job: ${queueErr.message}`);
    } else {
      logger.log(`Done enqueuing ${JobName.CLEAR_SCHEDULE} job`);
    }

    return jsonResponse({
      response_type: "ephemeral",
      text: "Clearing schedule ..."
    });
  } else if (commandWords[0] === "logout") {
    logger.log(`Enqueuing ${JobName.LOGOUT} job ...`);
    const [queueErr] = await promisedFn(
      (responseUrl: string, userId: string) =>
        new SQSClient().send(
          invokeJobCommand(jobsQueueUrl, JobName.LOGOUT, { responseUrl, userId })
        ),
      commandResponseUrl,
      commandUserId
    );
    if (queueErr) {
      logger.error(`Error enqueuing ${JobName.LOGOUT} job: ${queueErr.message}`);
    } else {
      logger.log(`Done enqueuing ${JobName.LOGOUT} job`);
    }

    return jsonResponse({
      response_type: "ephemeral",
      text: "Logging out ..."
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
    logger.log(`Enqueuing ${JobName.SEND_RESPONSE} job ...`);
    const [queueErr] = await promisedFn(
      (responseUrl: string, responseMessage: string) =>
        new SQSClient().send(
          invokeJobCommand(jobsQueueUrl, JobName.SEND_RESPONSE, { responseUrl, responseMessage })
        ),
      commandResponseUrl,
      [
        "For generations, the Dreaming City housed one of the Awoken's most closely guarded secrets.",
        "She is known as Riven — Riven of a Thousand Voices. The last known Ahamkara.",
        "She has been Taken. And her death is your calling."
      ]
        .join(" ")
        .toUpperCase()
    );
    if (queueErr) {
      logger.error(`Error enqueuing ${JobName.SEND_RESPONSE} job: ${queueErr.message}`);
    } else {
      logger.log(`Done enqueuing ${JobName.SEND_RESPONSE} job`);
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
