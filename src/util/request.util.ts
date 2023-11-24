import crypto from "crypto";
import querystring from "querystring";

export const verifyEventSignature = (
  logPrefix: string,
  version: string,
  secret: string,
  body: string,
  timestamp: number,
  signature: string
) => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${version}:${timestamp}:${body}`);

  if (`${version}=${hmac.digest("hex")}` !== signature) {
    throw new Error(`[${logPrefix}] Invalid request signature`);
  }
};

export interface IVerifiableEvent {
  headers: Record<string, string>;
  body: unknown;
  isBase64Encoded: boolean;
}

export const extractEventBody = <TEvent extends IVerifiableEvent = IVerifiableEvent>(
  logPrefix: string,
  logBody: boolean,
  evt: TEvent,
  signingVersion: string,
  signingSecret: string
): Record<string, any> => {
  const contentType = evt.headers["Content-Type"];
  const requestTimestamp = parseInt(evt.headers["X-Slack-Request-Timestamp"], 10);
  const signature = evt.headers["X-Slack-Signature"];

  if (contentType === "application/json") {
    if (typeof evt.body === "string") {
      const rawBody = evt.isBase64Encoded
        ? Buffer.from(evt.body as string, "base64").toString("utf-8")
        : (evt.body as string);

      if (logBody) {
        console.log(`[${logPrefix}] Got JSON encoded command body: ${rawBody}`);
      } else {
        console.log(`[${logPrefix}] Got JSON encoded command body`);
      }

      verifyEventSignature(
        logPrefix,
        signingVersion,
        signingSecret,
        rawBody,
        requestTimestamp,
        signature
      );

      try {
        console.log(`[${logPrefix}] Parsing JSON encoded command body ...`);
        const parsedBody = JSON.parse(rawBody) as Record<string, any>;
        console.log(`[${logPrefix}] Done parsing JSON encoded command body`);
        return parsedBody;
      } catch (err) {
        console.error(`[${logPrefix}] Error parsing JSON encoded command body: ${err.message}`);
        return {};
      }
    } else {
      return evt.body as Record<string, any>;
    }
  } else if (contentType === "application/x-www-form-urlencoded") {
    const rawBody = evt.isBase64Encoded
      ? Buffer.from(evt.body as string, "base64").toString("utf-8")
      : (evt.body as string);

    if (logBody) {
      console.log(`[${logPrefix}] Got form URL encoded command body: ${rawBody}`);
    } else {
      console.log(`[${logPrefix}] Got form URL encoded command body`);
    }

    verifyEventSignature(
      logPrefix,
      signingVersion,
      signingSecret,
      rawBody,
      requestTimestamp,
      signature
    );

    try {
      console.log(`[${logPrefix}] Parsing form URL encoded command body ...`);
      const parsedBody = querystring.parse(rawBody);
      console.log(`[${logPrefix}] Done parsing form URL encoded command body`);
      return parsedBody;
    } catch (err) {
      console.error(`[${logPrefix}] Error parsing form URL encoded command body: ${err.message}`);
      return {};
    }
  } else {
    console.error(`[${logPrefix}] Unknown content-type: ${contentType}`);
    return {};
  }
};
