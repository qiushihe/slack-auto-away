export type EventPayload = Record<
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
