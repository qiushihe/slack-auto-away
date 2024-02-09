import { CommandHandler } from "~src/constant/command.constant";
import { jsonResponse } from "~src/util/response.util";

export const command: CommandHandler = (logger, cmd) => {
  logger.log("Handling command: help ...");

  return jsonResponse({
    response_type: "ephemeral",
    text: [
      `Usage: \`${cmd.slashCmd} [command] [...options]\`:`,
      "",
      ` • \`${cmd.slashCmd} help\`: Display this help message`,
      ` • \`${cmd.slashCmd} status\`: Display authentication and schedule information`,
      ` • \`${cmd.slashCmd} auth\`: Initiate (or re-initiate) authentication flow`,
      ` • \`${cmd.slashCmd} schedule\`: Setup auto-away schedule`,
      ` • \`${cmd.slashCmd} logout\`: Clear authentication and auto-away schedule`,
      "",
      "For example, to set a schedule for auto-away:",
      `\`${cmd.slashCmd} from 5pm to 9am\``,
      "",
      "... or using 24-hour time format:",
      `\`${cmd.slashCmd} from 17 to 9\``,
      "",
      [
        `Once a schedule is set, *Auto Away* will automatically update your \`away\` status`,
        "based on that schedule using the timezone value in your Slack profile."
      ].join(" ")
    ].join("\n")
  });
};
