import { NamespacedLogger } from "~src/util/logger.util";

export type CommandPayload = Record<
  | "token"
  | "team_id"
  | "team_domain"
  | "channel_id"
  | "channel_name"
  | "user_id"
  | "user_name"
  | "command"
  | "text"
  | "api_app_id"
  | "is_enterprise_install"
  | "response_url"
  | "trigger_id",
  any
>;

export type Command<TEnv extends Record<string, any> = any> = {
  trigger: string;
  keyword: string;
  text: string;
  responseUrl: string;
  userId: string;
  payload: CommandPayload;
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
