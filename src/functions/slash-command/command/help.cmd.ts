import { CommandHandler } from "~src/constant/command.constant";
import { jsonResponse } from "~src/util/response.util";

export const command: CommandHandler = (logger, cmd) => {
  logger.log("Handling command: help ...");

  return jsonResponse({
    response_type: "ephemeral",
    text: [
      `Usage: \`${cmd.trigger} [command] [...options]\`:`,
      "",
      ` • \`${cmd.trigger} help\`: Display this help message`,
      ` • \`${cmd.trigger} status\`: Display authentication and schedule information`,
      ` • \`${cmd.trigger} auth\`: Initiate (or re-initiate) authentication flow`,
      ` • \`${cmd.trigger} from [time] to [time]\`: Set auto-away schedule`,
      ` • \`${cmd.trigger} off\`: Clear auto-away schedule`,
      ` • \`${cmd.trigger} logout\`: Clear authentication and auto-away schedule`,
      "",
      "For example, to set a schedule for auto-away:",
      `\`${cmd.trigger} from 5pm to 9am\``,
      "",
      "... or using 24-hour time format:",
      `\`${cmd.trigger} from 17 to 9\``,
      "",
      [
        `Once a schedule is set, *Auto Away* will automatically update your \`away\` status`,
        "based on that schedule using the timezone value in your Slack profile."
      ].join(" ")
    ].join("\n")
  });
};
