import { Handler } from "aws-lambda";

export const handler: Handler<never> = async (evt) => {
  console.log("[slash-command/default] Event: ", evt);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      response_type: "ephemeral", // or "in_channel",
      text: "It worked!"
    })
  };
};
