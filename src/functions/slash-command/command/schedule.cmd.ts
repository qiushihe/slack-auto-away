import { S3Client } from "@aws-sdk/client-s3";

import { CommandHandler } from "~src/constant/command.constant";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse, jsonResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";
import { scheduleModalView } from "~src/view/schedule.view";

type ScheduleCmdEnvVars = {
  slackApiUrlPrefix: string;
  dataBucketName: string;
};

// We can't move the async data fetching and whatnot into a background job, because in order to
// show interactive modal, we need the "trigger ID" from the slash command payload which expires
// after only 3 seconds. So if we queue the works into a background job, that may just delay the
// execution a bit too long.

export const command: CommandHandler<ScheduleCmdEnvVars> = async (logger, cmd) => {
  logger.log("Handling command: schedule ...");

  logger.log(`Trigger ID: ${cmd.payload.trigger_id}`);
  logger.log(`API URL Prefix: ${cmd.environmentVariable.slackApiUrlPrefix}`);

  const [userDataErr, userData] = await getUserData(
    logger,
    new S3Client(),
    cmd.environmentVariable.dataBucketName,
    cmd.userId
  );
  if (userDataErr) {
    return jsonResponse({
      response_type: "ephemeral",
      text: `Unable to get user data: ${userDataErr.message}`
    });
  }
  if (!userData) {
    return jsonResponse({ response_type: "ephemeral", text: "Missing get user data" });
  }
  if (!userData.authToken) {
    return jsonResponse({
      response_type: "ephemeral",
      text: "Missing get user authentication token"
    });
  }

  logger.log(`Opening modal ...`);
  const [err] = await promisedFn(() =>
    fetch(`${cmd.environmentVariable.slackApiUrlPrefix}/views.open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userData.authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        trigger_id: cmd.payload.trigger_id,
        view: scheduleModalView()
      })
    })
  );
  if (err) {
    logger.error(`Error opening modal: ${err.message}`);
  } else {
    logger.log(`Done opening modal`);
  }

  return emptyResponse();
};
