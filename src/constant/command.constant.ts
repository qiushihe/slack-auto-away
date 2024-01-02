import { EventPayload } from "~src/constant/event.constant";
import { NamespacedLogger } from "~src/util/logger.util";

export type Command<TEnv extends Record<string, any> = any> = {
  slashCmd: string;
  keyword: string;
  text: string;
  responseUrl: string;
  userId: string;
  payload: EventPayload;
  environmentVariable: TEnv;
};

export type CommandResponse = {
  statusCode?: number;
  headers?: Record<string, any>;
  body?: string;
};

export type CommandHandler<TEnv extends Record<string, any> = any> = (
  logger: NamespacedLogger,
  cmd: Command<TEnv>
) => CommandResponse | Promise<CommandResponse>;
