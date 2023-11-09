import { Handler } from "aws-lambda";
import querystring from "querystring";

import { ephemeralResponse } from "~src/util/slack.util";

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

const extractEventBody = (evt: SlashCommandDefaultEvent): Record<string, any> => {
  const contentType = evt.headers["Content-Type"];
  if (contentType === "application/json") {
    if (typeof evt.body === "string") {
      const jsonEncodedBody = evt.isBase64Encoded
        ? Buffer.from(evt.body as string, "base64").toString("utf-8")
        : (evt.body as string);
      console.log(`[slash-command/default] Got JSON encoded command body: ${jsonEncodedBody}`);

      try {
        console.log("[slash-command/default] Parsing JSON encoded command body ...");
        const parsedBody = JSON.parse(jsonEncodedBody) as Record<string, any>;
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
    const formUrlEncodedBody = evt.isBase64Encoded
      ? Buffer.from(evt.body as string, "base64").toString("utf-8")
      : (evt.body as string);
    console.log(`[slash-command/default] Got form URL encoded command body: ${formUrlEncodedBody}`);

    try {
      console.log("[slash-command/default] Parsing form URL encoded command body ...");
      const parsedBody = querystring.parse(formUrlEncodedBody);
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

// {
//   "token":"i1cmTol7kPj7iCxTLXdb4jXE",
//   "team_id":"T024BF2PG",
//   "team_domain":"metalab",
//   "channel_id":"D19M4LXLK",
//   "channel_name":"directmessage",
//   "user_id":"U024Q4059",
//   "user_name":"qiushi_he",
//   "command":"/auto-away",
//   "text":"test this &.  that",
//   "api_app_id":"A064QPEBHQ9",
//   "is_enterprise_install":"false",
//   "response_url":"https://hooks.slack.com/commands/T024BF2PG/6172557443587/VScgqbG4RlF0soui5tWkPxQ4",
//   "trigger_id":"6175109868564.2147512798.80e6659f21bfa7a02f6d38722cce738e"
// }

// help
// from 9Am to 5Pm
// off
// auth

export const handler: Handler<SlashCommandDefaultEvent> = async (evt) => {
  console.log("[slash-command/default] Event: ", evt);

  const commandPayload = extractEventBody(evt) as CommandPayload;
  const commandText = commandPayload.text;

  return ephemeralResponse(`Payload ${JSON.stringify(commandPayload)}\nText: ${commandText}`);
};
