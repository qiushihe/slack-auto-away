type User = {
  id: string;
  username: string;
  name?: string;
  team_id: string;
};

type Container = {
  type: string;
  view_id: string;
};

type Team = {
  id: string;
  domain: string;
};

type View = {
  id: string;
  team_id: string;
  state: { values: unknown };
  hash: string;
  previous_view_id: string;
  root_view_id: string;
  app_id: string;
  app_installed_team_id: string;
  bot_id: string;

  // The view in payload actually contains the complete view object. But I don't think we need to
  // worry about it given the way it's going to work. For what we need to do, all we need from the
  // view payload is the view's `external_id` and `private_metadata`, then we should be able to
  // re-hydrate the view.
  type: string;
  private_metadata?: string;
  callback_id?: string;
  external_id?: string;
};

type Action = {
  action_id: string;
  block_id: string;
  value: string;
  type: string;
  action_ts: string;
};

export type BlockActionPayload = {
  type: "block_actions";
  user: User;
  api_app_id: string;
  container: Container;
  trigger_id: string;
  team: Team;
  enterprise: unknown;
  is_enterprise_install: boolean;
  view: View;
  actions: Action[];
};

export type ViewSubmissionPayload = {
  type: "view_submission";
  team: Team;
  user: User;
  api_app_id: string;
  trigger_id: string;
  view: View;
  is_enterprise_install: boolean;
  enterprise: unknown;
};
