import { CommandHandler } from "~src/constant/command.constant";
import { jsonResponse } from "~src/util/response.util";

export const command: CommandHandler = async (logger, cmd) => {
  logger.log("Handling command: debug ...");

  const commandApiAppId = `${cmd.payload.api_app_id || ""}`.trim();
  const commandTeamId = `${cmd.payload.team_id || ""}`.trim();
  const commandTeamDomain = `${cmd.payload.team_domain || ""}`.trim();
  const commandUserName = `${cmd.payload.user_name || ""}`.trim();

  return jsonResponse({
    response_type: "ephemeral",
    text: [
      "Debug information:",
      ` • API App ID: \`${commandApiAppId}\``,
      ` • Team ID: \`${commandTeamId}\``,
      ` • Team Domain: \`${commandTeamDomain}\``,
      ` • User ID: \`${cmd.userId}\``,
      ` • User Name: \`${commandUserName}\``
    ].join("\n")
  });
};
