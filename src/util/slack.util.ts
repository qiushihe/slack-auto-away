import { jsonResponse } from "~src/util/response.util";

export const ephemeralResponse = (text: string) =>
  jsonResponse({ response_type: "ephemeral", text });

export const inChannelResponse = (text: string) =>
  jsonResponse({ response_type: "in_channel", text });
