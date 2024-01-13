import { InteractivityPayload } from "~src/constant/event.constant";
import { NamespacedLogger } from "~src/util/logger.util";

export type InteractivityEventPayloadHandler = (
  payload: InteractivityPayload
) => Promise<Error | null>;

export type InteractivityEventHandler = (
  logger: NamespacedLogger,
  dataBucketName: string,
  slackApiUrlPrefix: string
) => InteractivityEventPayloadHandler;

export default {};
