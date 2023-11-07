const CLIENT_ID = process.env.CLIENT_ID;
const OAUTH_CALLBACK_URL = process.env.OAUTH_CALLBACK_URL;

async function main(args) {
  const oauthStartUrl = new URL("https://slack.com/oauth/v2/authorize");
  oauthStartUrl.searchParams.set('client_id', CLIENT_ID);
  oauthStartUrl.searchParams.set('user_scope', 'users:write');
  oauthStartUrl.searchParams.set('redirect_uri', OAUTH_CALLBACK_URL);
  oauthStartUrl.searchParams.set('state', "dummy-state");

  return {
    statusCode: 302,
    headers: {
      "Location": oauthStartUrl.toString()
    }
  }
}
