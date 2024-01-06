import { TextObject } from "~src/view/view.type";

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

type CheckboxesValue = {
  type: "checkboxes";
  selected_options: {
    text: TextObject;
    value: string;
  }[];
};

type DatePickerValue = {
  type: "datepicker";
  selected_date: string;
};

type DatetimePickerValue = {
  type: "datetimepicker";
  selected_date_time: number;
};

type EmailValue = {
  type: "email_text_input";
  value: string;
};

type FileValue = { type: "__UNKNOW_FileValue" };

type StaticMultiSelectValue = {
  type: "multi_static_select";
  selected_options: { text: TextObject; value: string }[];
};

type ExternalMultiSelectValue = { type: "__UNKNOW_ExternalMultiSelectValue" };

type UsersMultiSelectValue = {
  type: "multi_users_select";
  selected_users: string[];
};

type ConversationsMultiSelectValue = { type: "__UNKNOW_ConversationsMultiSelectValue" };

type ChannelsMultiSelectValue = { type: "__UNKNOW_ChannelsMultiSelectValue" };

type NumberValue = {
  type: "number_input";
  value: number;
};

type PlainTextValue = {
  type: "plain_text_input";
  value: string;
};

type RadioValue = {
  type: "radio_buttons";
  selected_option: { text: TextObject; value: string }[];
};

type RichTextValue = {
  type: "rich_text_input";
  rich_text_value: unknown;
};

type StaticSelectValue = {
  type: "static_select";
  selected_option: { text: TextObject; value: string };
};

type ExternalSelectValue = { type: "__UNKNOW_ExternalSelectValue" };

type UsersSelectValue = {
  type: "users_select";
  selected_user: string;
};

type ConversationsSelectValue = { type: "__UNKNOW_ConversationsSelectValue" };

type ChannelsSelectValue = { type: "__UNKNOW_ChannelsSelectValue" };

type TimepickerValue = {
  type: "timepicker";
  selected_time: string;
};

type URLValue = {
  type: "url_text_input";
  value: string;
};

type WorkflowValue = { type: "__UNKNOW_WorkflowValue" };

export type State = {
  values: {
    [blockId: string]: {
      [actionId: string]:
        | CheckboxesValue
        | DatePickerValue
        | DatetimePickerValue
        | EmailValue
        | FileValue
        | StaticMultiSelectValue
        | ExternalMultiSelectValue
        | UsersMultiSelectValue
        | ConversationsMultiSelectValue
        | ChannelsMultiSelectValue
        | NumberValue
        | PlainTextValue
        | RadioValue
        | RichTextValue
        | StaticSelectValue
        | ExternalSelectValue
        | UsersSelectValue
        | ConversationsSelectValue
        | ChannelsSelectValue
        | TimepickerValue
        | URLValue
        | WorkflowValue;
    };
  };
};

type View = {
  id: string;
  team_id: string;
  state: State;
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

type AbstractAction<TAction extends string> = {
  type: TAction;
  action_id: string;
  block_id: string;
  action_ts: string;
};

type ButtonAction = AbstractAction<"button"> & {
  text: TextObject;
  value: string;
};

type OverflowAction = AbstractAction<"overflow"> & {
  selected_option: {
    text: TextObject;
    value: string;
  };
};

type Action = ButtonAction | OverflowAction;

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
