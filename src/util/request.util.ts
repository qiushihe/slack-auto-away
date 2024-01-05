import crypto from "crypto";
import querystring from "querystring";

import { NamespacedLogger } from "~src/util/logger.util";

const verifyEventSignature = (
  version: string,
  secret: string,
  body: string,
  timestamp: number,
  signature: string
): Error | null => {
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(`${version}:${timestamp}:${body}`);

  if (`${version}=${hmac.digest("hex")}` !== signature) {
    return new Error("Invalid request signature");
  } else {
    return null;
  }
};

export interface IVerifiableEvent {
  headers: Record<string, string>;
  body: unknown;
  isBase64Encoded: boolean;
}

/**
 * @deprecated Use `eventBodyExtractor` instead.
 */
export const extractGenericEventBody = <TEvent extends IVerifiableEvent = IVerifiableEvent>(
  logger: NamespacedLogger,
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
        logger.log(`Got JSON encoded command body: ${rawBody}`);
      } else {
        logger.log(`Got JSON encoded command body`);
      }

      const signatureErr = verifyEventSignature(
        signingVersion,
        signingSecret,
        rawBody,
        requestTimestamp,
        signature
      );
      if (signatureErr) {
        throw signatureErr;
      }

      try {
        logger.log(`Parsing JSON encoded command body ...`);
        const parsedBody = JSON.parse(rawBody) as Record<string, any>;
        logger.log(`Done parsing JSON encoded command body`);
        return parsedBody;
      } catch (err) {
        logger.error(`Error parsing JSON encoded command body: ${err.message}`);
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
      logger.log(`Got form URL encoded command body: ${rawBody}`);
    } else {
      logger.log(`Got form URL encoded command body`);
    }

    const signatureErr = verifyEventSignature(
      signingVersion,
      signingSecret,
      rawBody,
      requestTimestamp,
      signature
    );
    if (signatureErr) {
      throw signatureErr;
    }

    try {
      logger.log(`Parsing form URL encoded command body ...`);
      const parsedBody = querystring.parse(rawBody);
      logger.log(`Done parsing form URL encoded command body`);
      return parsedBody;
    } catch (err) {
      logger.error(`Error parsing form URL encoded command body: ${err.message}`);
      return {};
    }
  } else {
    logger.error(`Unknown content-type: ${contentType}`);
    return {};
  }
};

export const eventBodyExtractor = <TBody = Record<string, any>>(
  logger: NamespacedLogger,
  logBody: boolean,
  signingVersion: string,
  signingSecret: string
) => {
  return <TEvent extends IVerifiableEvent = IVerifiableEvent>(
    evt: TEvent
  ): [Error, null] | [null, TBody] => {
    const contentType = evt.headers["Content-Type"];
    const requestTimestamp = parseInt(evt.headers["X-Slack-Request-Timestamp"], 10);
    const signature = evt.headers["X-Slack-Signature"];

    if (contentType === "application/json") {
      if (typeof evt.body === "string") {
        const rawBody = evt.isBase64Encoded
          ? Buffer.from(evt.body as string, "base64").toString("utf-8")
          : (evt.body as string);

        if (logBody) {
          logger.log(`Got JSON encoded command body: ${rawBody}`);
        } else {
          logger.log(`Got JSON encoded command body`);
        }

        const signatureErr = verifyEventSignature(
          signingVersion,
          signingSecret,
          rawBody,
          requestTimestamp,
          signature
        );
        if (signatureErr) {
          throw signatureErr;
        }

        try {
          logger.log(`Parsing JSON encoded command body ...`);
          const parsedBody = JSON.parse(rawBody) as Record<string, any>;
          logger.log(`Done parsing JSON encoded command body`);
          return [null, parsedBody as TBody];
        } catch (err) {
          logger.error(`Error parsing JSON encoded command body: ${err.message}`);
          return [err, null];
        }
      } else {
        return [null, evt.body as TBody];
      }
    } else if (contentType === "application/x-www-form-urlencoded") {
      const rawBody = evt.isBase64Encoded
        ? Buffer.from(evt.body as string, "base64").toString("utf-8")
        : (evt.body as string);

      if (logBody) {
        logger.log(`Got form URL encoded command body: ${rawBody}`);
      } else {
        logger.log(`Got form URL encoded command body`);
      }

      const signatureErr = verifyEventSignature(
        signingVersion,
        signingSecret,
        rawBody,
        requestTimestamp,
        signature
      );
      if (signatureErr) {
        throw signatureErr;
      }

      try {
        logger.log(`Parsing form URL encoded command body ...`);
        const parsedBody = querystring.parse(rawBody);
        logger.log(`Done parsing form URL encoded command body`);
        return [null, parsedBody as TBody];
      } catch (err) {
        logger.error(`Error parsing form URL encoded command body: ${err.message}`);
        return [err, null];
      }
    } else {
      const errMessage = `Unknown content-type: ${contentType}`;
      logger.error(errMessage);
      return [new Error(errMessage), null];
    }
  };
};
