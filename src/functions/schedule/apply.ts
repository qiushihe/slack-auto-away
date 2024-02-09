import { Handler } from "aws-lambda";

export const handler: Handler<never> = async (evt) => {
  console.log("[schedule/apply] Event: ", evt);

  // TODO: Implement logic to find all users who are due to either turn on or off their `away`
  //       status, and make that happen via Slack's user presence API.
  //       See: https://api.slack.com/methods/users.setPresence

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "It Worked!" })
  };
};
