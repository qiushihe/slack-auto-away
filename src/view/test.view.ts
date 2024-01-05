import { ModalView } from "~src/view/view.type";

export const testModalView = (): ModalView => {
  return {
    type: "modal",
    callback_id: "modal-identifier",
    private_metadata: JSON.stringify({ test: 42, ohHai: "lawl" }),
    title: {
      type: "plain_text",
      text: "Test Modal Please Ignore",
      emoji: true
    },
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "Test Header",
          emoji: true
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "Some placeholder text. Click this button:"
        }
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "Add Test",
              emoji: true
            },
            value: "test-value",
            action_id: "add-test"
          }
        ]
      }
    ],
    close: {
      type: "plain_text",
      text: "Cancel",
      emoji: true
    },
    submit: {
      type: "plain_text",
      text: "Submit",
      emoji: true
    }
  };
};
