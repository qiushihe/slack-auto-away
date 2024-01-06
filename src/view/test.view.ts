import { ModalView } from "~src/view/view.type";

export const testModalView = (): ModalView => {
  return {
    type: "modal",
    callback_id: "modal-identifier",
    private_metadata: JSON.stringify({ test: 42, ohHai: "lawl" }),
    title: { type: "plain_text", text: "Test Modal Please Ignore" },
    blocks: [
      { type: "header", text: { type: "plain_text", text: "Test Actions" } },
      { type: "section", text: { type: "mrkdwn", text: "Some placeholder text." } },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Test Actions" },
            value: "test-value",
            action_id: "test-button"
          },
          {
            type: "overflow",
            options: [
              { text: { type: "plain_text", text: "Action 1" }, value: "action-1" },
              { text: { type: "plain_text", text: "Action 2" }, value: "action-2" }
            ],
            action_id: "test-overflow"
          }
        ]
      },
      { type: "header", text: { type: "plain_text", text: "Test Inputs" } },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Checkboxes" },
        element: {
          type: "checkboxes",
          options: [
            { text: { type: "plain_text", text: "Option 1" }, value: "cbk-1" },
            { text: { type: "plain_text", text: "Option 2" }, value: "cbk-2" }
          ],
          action_id: "test-checkboxes"
        }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Date Picker" },
        element: { type: "datepicker", initial_date: "2371-09-23", action_id: "test-datepicker" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Datetime Picker" },
        element: { type: "datetimepicker", action_id: "test-datetimepicker" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Email" },
        element: { type: "email_text_input", action_id: "test-email" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Multi-Static Select" },
        element: {
          type: "multi_static_select",
          options: [
            {
              text: { type: "plain_text", text: "Select 1" },
              value: "select-1"
            },
            {
              text: { type: "plain_text", text: "Select 2" },
              value: "select-2"
            }
          ],
          action_id: "test-multi-select-static"
        }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Multi-Users Select" },
        element: { type: "multi_users_select", action_id: "test-multi-select-users" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Number" },
        element: { type: "number_input", is_decimal_allowed: true, action_id: "test-number" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Plain Text" },
        element: { type: "plain_text_input", action_id: "test-plain-text" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Radio Buttons" },
        element: {
          type: "radio_buttons",
          options: [
            {
              text: { type: "plain_text", text: "Radio 1" },
              value: "radio-1"
            },
            {
              text: { type: "plain_text", text: "Radio 2" },
              value: "radio-2"
            }
          ],
          action_id: "test-radios"
        }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Rich Text" },
        element: { type: "rich_text_input", action_id: "test-rich-text" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Static Select" },
        element: {
          type: "static_select",
          options: [
            {
              text: { type: "plain_text", text: "Select 1" },
              value: "select-1"
            },
            {
              text: { type: "plain_text", text: "Select 2" },
              value: "select-2"
            }
          ],
          action_id: "test-select-static"
        }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test User Select" },
        element: { type: "users_select", action_id: "test-select-users" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test Time Picker" },
        element: { type: "timepicker", initial_time: "04:20", action_id: "test-timepicker" }
      },
      {
        type: "input",
        label: { type: "plain_text", text: "Test URL" },
        element: { type: "url_text_input", action_id: "test-url" }
      }
    ],
    close: { type: "plain_text", text: "Cancel" },
    submit: { type: "plain_text", text: "Submit" }
  };
};
