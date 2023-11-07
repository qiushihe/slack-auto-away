// Set away
// https://api.slack.com/methods/users.setPresence

export const handler = async (event) => {
  console.log("Event: ", event);

  const clientId = process.env.CLIENT_ID as string;
  const clientSecret = process.env.CLIENT_SECRET as string;
  const oauthCallbackUrl = process.env.OAUTH_CALLBACK_URL as string;

  let userId: string | null = null;
  let userAccessToken: string | null = null;
  const messages: string[] = [];

  let res: any = null;
  try {
    messages.push("Fetching user token ...");
    res = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: event.queryStringParameters["code"],
        redirect_uri: oauthCallbackUrl
      })
    });
    messages.push("Done fetching user token");
  } catch (err) {
    messages.push(`Error fetching user token: ${err.message}`);
  }

  if (res) {
    let data: any = null;
    try {
      messages.push("Reading response data ...");
      data = await res.json();
      messages.push("Done reading response data");
    } catch (err) {
      messages.push(`Error reading response data: ${err.message}`);
    }
    messages.push(`Response data: ${JSON.stringify(data)}`);

    if (data.ok) {
      if (data.authed_user) {
        if (data.authed_user.id) {
          const idValue = `${data.authed_user.id}`.trim();
          if (idValue.length > 0) {
            userId = idValue;

            if (data.authed_user.scope) {
              const scopes = `${data.authed_user.scope}`.trim().split(",");
              if (scopes.includes("users:write")) {
                if (data.authed_user.access_token) {
                  const accessTokenValue = `${data.authed_user.access_token}`.trim();
                  if (accessTokenValue.length > 0) {
                    userAccessToken = accessTokenValue;
                  } else {
                    messages.push("Response data missing authed_user access_token value");
                  }
                } else {
                  messages.push("Response data missing authed_user access_token");
                }
              } else {
                messages.push(`Response data missing authed_user "users:write" scope`);
              }
            } else {
              messages.push("Response data missing authed_user scope");
            }
          } else {
            messages.push("Response data missing authed_user id value");
          }
        } else {
          messages.push("Response data missing authed_user id");
        }
      } else {
        messages.push("Response data missing authed_user");
      }
    } else {
      messages.push("Response data not ok");
    }
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code: event.queryStringParameters["code"],
      state: event.queryStringParameters["state"],
      messages,
      userId,
      userAccessToken
    })
  };
};
