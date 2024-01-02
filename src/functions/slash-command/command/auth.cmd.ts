import { CommandHandler } from "~src/constant/command.constant";
import { jsonResponse } from "~src/util/response.util";

type AuthCmdEnvVars = {
  oauthStartUrl: string;
};

export const command: CommandHandler<AuthCmdEnvVars> = async (logger, cmd) => {
  logger.log("Handling command: auth ...");

  return jsonResponse({
    response_type: "ephemeral",
    text: [
      "To authenticate (or re-authenticate) with *Auto Away*, open this URL:",
      ` 👉 ${cmd.environmentVariable.oauthStartUrl}`
    ].join("\n")
  });
};
