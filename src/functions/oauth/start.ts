import { Handler } from "aws-lambda";

import { processEnvGetString } from "~src/util/env.util";
import { redirectResponse } from "~src/util/response.util";

export const handler: Handler<never> = async (evt) => {
  console.log("[oauth/start] Event: ", evt);

  const clientId = processEnvGetString("CLIENT_ID");
  const oauthCallbackUrl = processEnvGetString("OAUTH_CALLBACK_URL");

  const oauthStartUrl = new URL("https://slack.com/oauth/v2/authorize");
  oauthStartUrl.searchParams.set("client_id", clientId);
  oauthStartUrl.searchParams.set("user_scope", "users:write");
  oauthStartUrl.searchParams.set("redirect_uri", oauthCallbackUrl);
  oauthStartUrl.searchParams.set("state", "dummy-state");

  return redirectResponse(oauthStartUrl.toString());
};
