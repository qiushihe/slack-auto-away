import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { userAccessTokenS3StorageKey } from "~src/constant/user-access-token.constant";
import { processEnvGetString } from "~src/util/env.util";
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
  TOKEN_ERROR = 5
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

  let res: Awaited<ReturnType<typeof fetch>> | null = null;
  try {
    console.log("[oauth/callback] Fetching user token ...");
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
    console.log("[oauth/callback] Done fetching user token");
  } catch (err) {
    console.error(`[oauth/callback] Error fetching user token: ${err.message}`);
  }

  if (!res) {
    console.error("[oauth/callback] Response missing");
    return response(RESPONSE_CODE.GENERIC_ERROR);
  }

  let data: Record<string, any> | null = null;
  try {
    console.log("[oauth/callback] Reading response data ...");
    data = (await res.json()) as any;
    console.log("[oauth/callback] Done reading response data");
  } catch (err) {
    console.error(`[oauth/callback] Error reading response data: ${err.message}`);
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

  // Lambda execution environment has seeded environment variables for AWS region, access key
  // and secret key, so there is no need to explicitly provide them as parameters to the
  // `S3Client` constructor. The only requirement is the Lambda's IAM role has required
  // permissions/policies attached, in order to perform the required operations.
  const s3Client = new S3Client();

  await s3Client.send(
    new PutObjectCommand({
      Bucket: dataBucketName,
      Key: userAccessTokenS3StorageKey(userId),
      Body: userAccessToken
    })
  );

  return response(RESPONSE_CODE.SUCCESS);
};
