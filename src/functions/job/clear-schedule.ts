import { Handler } from "aws-lambda";

import { emptyResponse } from "~src/util/response.util";

export const handler: Handler<never> = async (evt) => {
  console.log("[job/clear-schedule] Event: ", evt);

  return emptyResponse();
};
