import { Handler } from "aws-lambda";

import { processEnvGetString } from "~src/util/env.util";

export const handler: Handler<never> = async (evt) => {
  console.log("[oauth/start] Event: ", evt);

  const clientId = processEnvGetString("FN_CLIENT_ID");
  const oauthCallbackUrl = processEnvGetString("FN_OAUTH_CALLBACK_URL");

  const oauthStartUrl = new URL("https://slack.com/oauth/v2/authorize");
  oauthStartUrl.searchParams.set("client_id", clientId);
  oauthStartUrl.searchParams.set("user_scope", "users:write");
  oauthStartUrl.searchParams.set("redirect_uri", oauthCallbackUrl);
  oauthStartUrl.searchParams.set("state", "dummy-state");

  return {
    statusCode: 302,
    headers: {
      Location: oauthStartUrl.toString()
    }
  };
};
