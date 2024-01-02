import { Handler } from "aws-lambda";

import { Command, CommandHandler, CommandPayload } from "~src/constant/command.constant";
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
  status: handleStatusCommand
};

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

  const cmd: Command = {
    trigger: commandName,
    keyword: commandText.split(/\s+/).map((word) => `${word || ""}`.trim().toLowerCase())[0],
    text: commandText,
    responseUrl: `${commandPayload.response_url || ""}`.trim(),
    userId: `${commandPayload.user_id || ""}`.trim(),
    payload: commandPayload,
    environmentVariable: { oauthStartUrl, jobsQueueUrl }
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
