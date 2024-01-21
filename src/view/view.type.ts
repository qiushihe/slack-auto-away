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
  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;

  /**
   * If set, this attribute must contain at least 1 value.
   * If there is no initial options, then this attribute must not be set.
   */
  initial_options?: OptionObject[];
};

export type DatePickerElement = AbstractActionElement<"datepicker"> & {
  /**
   * In the format of `"YYYY-MM-DD"`
   */
  initial_date?: string;

  confirm?: ConfirmationDialogObject;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;
};

export type DatetimePickerElement = AbstractActionElement<"datetimepicker"> & {
  /**
   * This should be in the format of 10 digits, for example 1628633820 represents the date and
   * time August 10th, 2021 at 03:17pm PST.
   */
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
  confirm?: ConfirmationDialogObject;
  max_selected_items?: number;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;

  /**
   * If set, this attribute must contain at least 1 value.
   * If there is no initial options, then this attribute must not be set.
   */
  initial_options?: OptionObject[];
};

export type ExternalMultiSelectMenuElement = AbstractActionElement<"multi_external_select"> & {
  min_query_length?: number;
  confirm?: ConfirmationDialogObject;
  max_selected_items?: number;
  focus_on_load?: boolean;
  placeholder?: TextObject<"plain_text">;

  /**
   * If set, this attribute must contain at least 1 value.
   * If there is no initial options, then this attribute must not be set.
   */
  initial_options?: OptionObject[];
};

export type UsersMultiSelectMenuElement = AbstractActionElement<"multi_users_select"> & {
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

  /**
   * The initial value in the plain-text input when it is loaded.
   */
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
  /**
   * The initial time that is selected when the element is loaded. This should be in the format
   * HH:mm, where HH is the 24-hour format of an hour (00 to 23) and mm is minutes with leading
   * zeros (00 to 59), for example 22:25 for 10:25pm.
   */
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

type AbstractElementBlock<TType extends string, TElement = never> = AbstractBlock<TType> & {
  element: TElement;
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

export type InputBlock = AbstractElementBlock<
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

  /**
   * A string that will be in the event sent back to interactivity handler endpoint.
   * Max length of 3000 characters.
   */
  private_metadata?: string;

  /**
   * An identifier to recognize interactions and submissions of this particular view.
   * Do not use this attribute to store sensitive information: use `private_metadata` instead.
   * Max length of 255 characters.
   */
  callback_id?: string;

  /**
   * A custom identifier that must be unique for all views on a per-team basis.
   */
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
