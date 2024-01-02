import { CommandHandler } from "~src/constant/command.constant";
import { jsonResponse } from "~src/util/response.util";

export const command: CommandHandler = (logger) => {
  logger.log("Handling command: riven ...");

  return jsonResponse({
    response_type: "ephemeral",
    text: [
      "For generations, the Dreaming City housed one of the Awoken's most closely guarded secrets.",
      "She is known as Riven — Riven of a Thousand Voices. The last known Ahamkara.",
      "She has been Taken. And her death is your calling."
    ]
      .join(" ")
      .toUpperCase()
  });
};
