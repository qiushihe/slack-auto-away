import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey } from "~src/constant/user-access-token.constant";
import { processEnvGetString } from "~src/util/env.util";

// Set away
// https://api.slack.com/methods/users.setPresence

interface OAuthCallbackEvent {
  queryStringParameters: {
    code: string;
    state?: string;
  };
}

let s3Client: S3Client | null = null;
const getS3Client = () => {
  if (!s3Client) {
    const region = processEnvGetString("FN_AWS_REGION");
    const accessKey = processEnvGetString("FN_AWS_ACCESS_KEY");
    const secretKey = processEnvGetString("FN_AWS_SECRET_KEY");

    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey
      }
    });
  }
  return s3Client;
};

export const handler: Handler<OAuthCallbackEvent> = async (evt) => {
  console.log("[oauth/callback] Event: ", evt);

  const dataBucketName = processEnvGetString("FN_DATA_BUCKET_NAME");
  const clientId = processEnvGetString("FN_CLIENT_ID");
  const clientSecret = processEnvGetString("FN_CLIENT_SECRET");
  const oauthCallbackUrl = processEnvGetString("FN_OAUTH_CALLBACK_URL");

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
        code: evt.queryStringParameters.code,
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

  if (userId && userAccessToken) {
    await getS3Client().send(
      new PutObjectCommand({
        Bucket: dataBucketName,
        Key: userAccessTokenS3StorageKey(userId),
        Body: userAccessToken
      })
    );
  }

  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code: evt.queryStringParameters.code,
      state: evt.queryStringParameters.state,
      messages,
      userId,
      userAccessToken
    })
  };
};
