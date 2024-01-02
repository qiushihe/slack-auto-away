import { Handler } from "aws-lambda";

import { Command, CommandHandler } from "~src/constant/command.constant";
import { EventPayload } from "~src/constant/event.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { extractEventBody, IVerifiableEvent } from "~src/util/request.util";
import { jsonResponse } from "~src/util/response.util";

import { command as handleAuthCommand } from "./command/auth.cmd";
import { command as handleDebugCommand } from "./command/debug.cmd";
import { command as handleFromCommand } from "./command/from.cmd";
import { command as handleHelpCommand } from "./command/help.cmd";
import { command as handleLogoutCommand } from "./command/logout.cmd";
import { command as handleOffCommand } from "./command/off.cmd";
import { command as handleRivenCommand } from "./command/riven.cmd";
import { command as handleScheduleCommand } from "./command/schedule.cmd";
import { command as handleStatusCommand } from "./command/status.cmd";

interface SlashCommandDefaultEvent extends IVerifiableEvent {}

const COMMAND_HANDLER: Record<string, CommandHandler> = {
  auth: handleAuthCommand,
  debug: handleDebugCommand,
  from: handleFromCommand,
  help: handleHelpCommand,
  logout: handleLogoutCommand,
  off: handleOffCommand,
  riven: handleRivenCommand,
  schedule: handleScheduleCommand,
  status: handleStatusCommand
};

const logger = new NamespacedLogger("slash-command/default");

export const handler: Handler<SlashCommandDefaultEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const oauthStartUrl = processEnvGetString("OAUTH_START_URL");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");
  const slackApiUrlPrefix = processEnvGetString("SLACK_API_URL_PREFIX");
  const signingSecret = processEnvGetString("SIGNING_SECRET");
  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  const evtPayload = extractEventBody(logger, true, evt, "v0", signingSecret) as EventPayload;

  const commandName = `${evtPayload.command || ""}`.trim();
  const commandText = `${evtPayload.text || ""}`.trim();

  const cmd: Command = {
    slashCmd: commandName,
    keyword: commandText.split(/\s+/).map((word) => `${word || ""}`.trim().toLowerCase())[0],
    text: commandText,
    responseUrl: `${evtPayload.response_url || ""}`.trim(),
    userId: `${evtPayload.user_id || ""}`.trim(),
    payload: evtPayload,
    environmentVariable: { oauthStartUrl, jobsQueueUrl, slackApiUrlPrefix, dataBucketName }
  };

  const handleCommand = COMMAND_HANDLER[cmd.keyword];
  if (handleCommand) {
    return handleCommand(logger, cmd);
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
