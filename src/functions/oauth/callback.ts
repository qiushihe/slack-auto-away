import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey } from "~src/constant/s3.constant";
import { processEnvGetString } from "~src/util/env.util";
import { promisedFn } from "~src/util/promise.util";
import { escapeRegExp } from "~src/util/regexp.util";
import { jsonResponse, redirectResponse } from "~src/util/response.util";

// Set away
// https://api.slack.com/methods/users.setPresence

interface OAuthCallbackEvent {
  queryStringParameters: {
    code: string;
    state?: string;
  };
}

enum RESPONSE_CODE {
  SUCCESS = 0,
  GENERIC_ERROR = 1,
  DATA_ERROR = 2,
  USER_DATA_ERROR = 3,
  PERMISSION_ERROR = 4,
  TOKEN_ERROR = 5,
  S3_ERROR = 6
}

const redirectOrJsonResponder = (destinationUrl: string | null | undefined) => {
  const trimmedUrl = `${destinationUrl || ""}`.trim();
  const hasDestinationUrl = trimmedUrl.length > 0;

  return (code: RESPONSE_CODE) => {
    const payload = { c: code };
    if (hasDestinationUrl) {
      const redirectUrl = new URL(trimmedUrl);
      Object.keys(payload).forEach((key) => redirectUrl.searchParams.set(key, payload[key]));
      return redirectResponse(redirectUrl.toString());
    } else {
      return jsonResponse(payload);
    }
  };
};

const findAssetUrl = (urls: string[], filename: string) => {
  const url = urls.find((url) => url.match(new RegExp(`/${escapeRegExp(filename)}$`)));
  if (url) {
    const trimmedUrl = url.trim();
    if (trimmedUrl.length > 0) {
      return trimmedUrl;
    } else {
      return null;
    }
  } else {
    return null;
  }
};

export const handler: Handler<OAuthCallbackEvent> = async (evt) => {
  console.log("[oauth/callback] Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const clientId = processEnvGetString("CLIENT_ID");
  const clientSecret = processEnvGetString("CLIENT_SECRET");
  const oauthCallbackUrl = processEnvGetString("OAUTH_CALLBACK_URL");
  const publicAssetUrls = processEnvGetString("PUBLIC_ASSET_URLS")
    .split(",")
    .map((url) => url.trim());

  const response = redirectOrJsonResponder(findAssetUrl(publicAssetUrls, "callback-result.html"));

  let userId: string | null = null;
  let userAccessToken: string | null = null;

  console.log("[oauth/callback] Fetching user token ...");
  const [fetchTokenErr, fetchTokenRes] = await promisedFn(
    (code: string) =>
      fetch("https://slack.com/api/oauth.v2.access", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          redirect_uri: oauthCallbackUrl
        })
      }),
    evt.queryStringParameters.code
  );
  if (fetchTokenErr) {
    console.error(`[oauth/callback] Error fetching user token: ${fetchTokenErr.message}`);
    return response(RESPONSE_CODE.GENERIC_ERROR);
  } else {
    console.log("[oauth/callback] Done fetching user token");
  }

  if (!fetchTokenRes) {
    console.error("[oauth/callback] Response missing");
    return response(RESPONSE_CODE.GENERIC_ERROR);
  }

  console.log("[oauth/callback] Reading response data ...");
  const [dataErr, data] = await promisedFn(
    () => fetchTokenRes.json() as Promise<Record<string, any>>
  );
  if (dataErr) {
    console.error(`[oauth/callback] Error reading response data: ${dataErr.message}`);
    return response(RESPONSE_CODE.GENERIC_ERROR);
  } else {
    console.log("[oauth/callback] Done reading response data");
  }
  console.log(`[oauth/callback] Response data: ${JSON.stringify(data)}`);

  if (!data) {
    console.error("[oauth/callback] Response data missing");
    return response(RESPONSE_CODE.GENERIC_ERROR);
  }

  if (!data.ok) {
    console.error("[oauth/callback] Response data not ok");
    return response(RESPONSE_CODE.DATA_ERROR);
  }

  if (!data.authed_user) {
    console.error("[oauth/callback] Response data missing authed_user");
    return response(RESPONSE_CODE.DATA_ERROR);
  }

  if (!data.authed_user.id) {
    console.error("[oauth/callback] Response data missing authed_user id");
    return response(RESPONSE_CODE.USER_DATA_ERROR);
  }

  userId = `${data.authed_user.id}`.trim();
  if (userId.length <= 0) {
    console.error("[oauth/callback] Response data missing authed_user id value");
    return response(RESPONSE_CODE.USER_DATA_ERROR);
  }

  if (!data.authed_user.scope) {
    console.error("[oauth/callback] Response data missing authed_user scope");
    return response(RESPONSE_CODE.USER_DATA_ERROR);
  }

  const scopes = `${data.authed_user.scope}`.trim().split(",");
  if (!scopes.includes("users:write")) {
    console.error('[oauth/callback] Response data missing authed_user "users:write" scope');
    return response(RESPONSE_CODE.PERMISSION_ERROR);
  }

  if (!data.authed_user.access_token) {
    console.error("[oauth/callback] Response data missing authed_user access_token");
    return response(RESPONSE_CODE.TOKEN_ERROR);
  }

  userAccessToken = `${data.authed_user.access_token}`.trim();
  if (userAccessToken.length <= 0) {
    console.error("[oauth/callback] Response data missing authed_user access_token value");
    return response(RESPONSE_CODE.TOKEN_ERROR);
  }

  console.log("[oauth/callback] Storing user access token ...");
  const [putObjectErr] = await promisedFn(
    (id: string, token: string) =>
      new S3Client().send(
        new PutObjectCommand({
          Bucket: dataBucketName,
          Key: userAccessTokenS3StorageKey(id),
          Body: token
        })
      ),
    userId,
    userAccessToken
  );
  if (putObjectErr) {
    console.error(`[oauth/callback] Error storing user access token: ${putObjectErr.message}`);
    return response(RESPONSE_CODE.S3_ERROR);
  } else {
    console.log("[oauth/callback] Done storing user access token");
  }

  return response(RESPONSE_CODE.SUCCESS);
};
