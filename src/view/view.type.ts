// ===============================================================================================
// Composition objects
// ===============================================================================================

export type ConfirmationDialogObject = {
  title: TextObject<"plain_text">;
  text: TextObject<"plain_text">;
  confirm: TextObject<"plain_text">;
  deny: TextObject<"plain_text">;
  style?: string;
};

export type ConversationFilterObject = {
  include?: string[];
  exclude_external_shared_channels?: boolean;
  exclude_bot_users?: boolean;
};

export type DispatchActionConfigurationObject = {
  trigger_actions_on?: string[];
};

export type OptionObject = {
  text: TextObject;
  value: string;
  description?: TextObject<"plain_text">;
  url?: string;
};

export type OptionGroupObject = {
  label: TextObject<"plain_text">;
  options: OptionObject[];
};

export type TextObject<TType = "plain_text" | "mrkdwn"> = {
  type: TType;
  text: string;
  emoji?: boolean;
  verbatim?: boolean;
};

export type TriggerObject = {
  url: string;
  customizable_input_parameters?: InputParameterObject[];
};

export type WorkflowObject = {
  trigger: TriggerObject;
};

export type InputParameterObject = {
  name: string;
  value: string;
};

// ===============================================================================================
// Block elements & interactive components
// ===============================================================================================

type AbstractElement<TType extends string> = {
  type: TType;
};

type AbstractActionElement<TType extends string> = AbstractElement<TType> & {
  action_id?: string;
};

export type ButtonElement = AbstractActionElement<"button"> & {
  text: TextObject;
  url?: string;
  value?: string;
  style?: string;
  confirm?: ConfirmationDialogObject;
  accessibility_label?: string;
};

export type CheckboxesElement = AbstractActionElement<"checkboxes"> & {
  options: OptionObject[];
  initial_options?: OptionObject[];
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
};

export type DatePickerElement = AbstractActionElement<"datepicker"> & {
  initial_date?: string;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type DatetimePickerElement = AbstractActionElement<"datetimepicker"> & {
  initial_date_time?: number;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
};

export type EmailInputElement = AbstractActionElement<"email_text_input"> & {
  initial_value?: string;
  dispatch_action_config?: DispatchActionConfigurationObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type FileInputElement = AbstractActionElement<"file_input"> & {
  filetypes?: string[];
  max_files?: number;
};

export type ImageElement = AbstractElement<"image"> & {
  image_url: string;
  alt_text: string;
};

export type StaticMultiSelectMenuElement = AbstractActionElement<"multi_static_select"> & {
  options: OptionObject[];
  option_groups?: OptionGroupObject[];
  initial_options?: OptionObject[];
  confirm?: ConfirmationDialogObject;
  max_selected_items?: number;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type ExternalMultiSelectMenuElement = AbstractActionElement<"multi_external_select"> & {
  min_query_length?: number;
  initial_options?: OptionObject[];
  confirm?: ConfirmationDialogObject;
  max_selected_items?: number;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type UsersMultiSelectMenuElement = AbstractActionElement<"multi_external_select"> & {
  initial_users?: string[];
  confirm?: ConfirmationDialogObject;
  max_selected_items?: number;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type ConversationsMultiSelectMenuElement =
  AbstractActionElement<"multi_conversations_select"> & {
    initial_conversations?: string[];
    default_to_current_conversation?: boolean;
    confirm?: ConfirmationDialogObject;
    max_selected_items?: number;
    filter?: ConversationFilterObject;
    focus_on_load?: boolean;
    placeholder?: TextObject<"plain_text">;
  };

export type ChannelsMultiSelectMenuElement = AbstractActionElement<"multi_channels_select"> & {
  initial_channels?: string[];
  confirm?: ConfirmationDialogObject;
  max_selected_items?: number;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type MultiSelectMenuElement =
  | StaticMultiSelectMenuElement
  | ExternalMultiSelectMenuElement
  | UsersMultiSelectMenuElement
  | ConversationsMultiSelectMenuElement
  | ChannelsMultiSelectMenuElement;

export type NumberInputElement = AbstractActionElement<"number_input"> & {
  is_decimal_allowed: boolean;
  initial_value?: string;
  min_value?: string;
  max_value?: string;
  dispatch_action_config?: DispatchActionConfigurationObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type OverflowMenuElement = AbstractActionElement<"overflow"> & {
  options: OptionObject[];
  confirm?: ConfirmationDialogObject;
};

export type PlainTextInputElement = AbstractActionElement<"plain_text_input"> & {
  initial_value?: string;
  multiline?: boolean;
  min_length?: number;
  max_length?: number;
  dispatch_action_config?: DispatchActionConfigurationObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type RadioButtonGroupElement = AbstractActionElement<"radio_buttons"> & {
  options: OptionObject[];
  initial_option?: OptionObject;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
};

export type RichTextInputElement = AbstractActionElement<"rich_text_input"> & {
  initial_value?: RichTextBlock;
  dispatch_action_config?: DispatchActionConfigurationObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type StaticSelectMenuElement = AbstractActionElement<"static_select"> & {
  options: OptionObject[];
  option_groups?: OptionGroupObject[];
  initial_option?: OptionObject;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type ExternalSelectMenuElement = AbstractActionElement<"external_select"> & {
  initial_option?: OptionObject;
  min_query_length?: number;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type UsersSelectMenuElement = AbstractActionElement<"users_select"> & {
  initial_user?: string;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type ConversationsSelectMenuElement = AbstractActionElement<"conversations_select"> & {
  initial_conversation?: string;
  default_to_current_conversation?: boolean;
  confirm?: ConfirmationDialogObject;
  response_url_enabled?: boolean;
  filter?: ConversationFilterObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type ChannelsSelectMenuElement = AbstractActionElement<"channels_select"> & {
  initial_channel?: string;
  confirm?: ConfirmationDialogObject;
  response_url_enabled?: boolean;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type SelectMenuElement =
  | StaticSelectMenuElement
  | ExternalSelectMenuElement
  | UsersSelectMenuElement
  | ConversationsSelectMenuElement
  | ChannelsSelectMenuElement;

export type TimePickerElement = AbstractActionElement<"timepicker"> & {
  initial_time?: string;
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
  timezone?: string;
};

export type URLInputElement = AbstractActionElement<"url_text_input"> & {
  initial_value?: string;
  dispatch_action_config?: DispatchActionConfigurationObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type WorkflowButtonElement = AbstractActionElement<"workflow_button"> & {
  text: TextObject<"plain_text">;
  workflow: WorkflowObject;
  style?: string;
  accessibility_label?: string;
};

// ===============================================================================================
// Blocks
// ===============================================================================================

type AbstractBlock<TType extends string> = {
  type: TType;
  block_id?: string;
};

type AbstractElementsBlock<TType extends string, TElement = never> = AbstractBlock<TType> & {
  elements: TElement[];
};

export type ActionBlock = AbstractElementsBlock<
  "actions",
  | ButtonElement
  | CheckboxesElement
  | DatePickerElement
  | DatetimePickerElement
  | MultiSelectMenuElement
  | OverflowMenuElement
  | RadioButtonGroupElement
  | SelectMenuElement
  | TimePickerElement
  | WorkflowButtonElement
>;

export type ContextBlock = AbstractElementsBlock<"context", ImageElement>;

export type DividerBlock = AbstractBlock<"divider">;

export type FileBlock = AbstractBlock<"file"> & {
  external_id: string;
  source: string;
};

export type HeaderBlock = AbstractBlock<"header"> & {
  text: TextObject<"plain_text">;
};

export type ImageBlock = AbstractBlock<"image"> & {
  image_url: string;
  alt_text: string;
  title?: TextObject<"plain_text">;
};

export type InputBlock = AbstractElementsBlock<
  "input",
  | CheckboxesElement
  | DatePickerElement
  | DatetimePickerElement
  | EmailInputElement
  | FileInputElement
  | MultiSelectMenuElement
  | NumberInputElement
  | PlainTextInputElement
  | RadioButtonGroupElement
  | RichTextInputElement
  | SelectMenuElement
  | TimePickerElement
  | URLInputElement
> & {
  label: TextObject<"plain_text">;
  dispatch_action?: DispatchActionConfigurationObject;
  hint?: TextObject<"plain_text">;
  optional?: boolean;
};

export type RichTextBlock = AbstractElementsBlock<"rich_text", unknown>;

export type SectionBlock = AbstractBlock<"section"> & {
  text?: TextObject;
  fields?: TextObject[];
  accessory?:
    | ButtonElement
    | CheckboxesElement
    | DatePickerElement
    | ImageElement
    | MultiSelectMenuElement
    | OverflowMenuElement
    | RadioButtonGroupElement
    | SelectMenuElement
    | TimePickerElement
    | WorkflowButtonElement;
};

export type VideoBlock = AbstractBlock<"video"> & {
  alt_text: string;
  author_name?: string;
  description?: TextObject<"plain_text">;
  provider_icon_url?: string;
  provider_name?: string;
  title: TextObject<"plain_text">;
  title_url?: string;
  thumbnail_url: string;
  video_url: string;
};

// ===============================================================================================
// View
// ===============================================================================================

type AbstractView<TType extends string, TBlock = never> = {
  type: TType;
  blocks: TBlock[];
  private_metadata?: string;
  callback_id?: string;
  external_id?: string;
};

export type ModalView = AbstractView<
  "modal",
  | ActionBlock
  | ContextBlock
  | DividerBlock
  | FileBlock
  | HeaderBlock
  | ImageBlock
  | InputBlock
  | RichTextBlock
  | SectionBlock
  | VideoBlock
> & {
  title: TextObject<"plain_text">;
  close?: TextObject<"plain_text">;
  submit?: TextObject<"plain_text">;
  clear_on_close?: boolean;
  notify_on_close?: boolean;
  submit_disabled?: boolean;
};

export type HomeTabView = AbstractView<
  "home",
  | ActionBlock
  | ContextBlock
  | DividerBlock
  | FileBlock
  | HeaderBlock
  | ImageBlock
  | InputBlock
  | RichTextBlock
  | SectionBlock
  | VideoBlock
>;
