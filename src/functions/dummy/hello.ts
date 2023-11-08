import { Handler } from "aws-lambda";

export const handler: Handler<never> = async (evt) => {
  console.log("[dummy/hello] Event: ", evt);

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: "It Worked!" })
  };
};
