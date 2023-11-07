export const handler = async (event) => {
  console.log("Event: ", event);

  const clientId = process.env.CLIENT_ID as string;
  const oauthCallbackUrl = process.env.OAUTH_CALLBACK_URL as string;

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
