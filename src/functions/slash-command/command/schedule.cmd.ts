import { S3Client } from "@aws-sdk/client-s3";

import { CommandHandler } from "~src/constant/command.constant";
import { UserSchedule } from "~src/constant/user-data.constant";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse, jsonResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";
import { modalView } from "~src/view/schedule/view";

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

  const s3 = new S3Client();

  logger.log(`Trigger ID: ${cmd.payload.trigger_id}`);
  logger.log(`API URL Prefix: ${cmd.environmentVariable.slackApiUrlPrefix}`);

  const [userDataErr, userData] = await getUserData(
    logger,
    s3,
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

  const scheduleData: UserSchedule = userData.schedule ?? {
    timeAuto: "09:00",
    timeAway: "17:00",
    disableSaturdaySchedule: false,
    differentSaturdaySchedule: false,
    saturdayTimeAuto: "10:00",
    saturdayTimeAway: "16:00",
    disableSundaySchedule: false,
    differentSundaySchedule: false,
    sundayTimeAuto: "11:00",
    sundayTimeAway: "15:00",
    exceptionDates: [],
    pauseUpdates: false
  };

  logger.log(`Opening modal ...`);
  const [err, res] = await promisedFn(() =>
    fetch(`${cmd.environmentVariable.slackApiUrlPrefix}/views.open`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${userData.authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        trigger_id: cmd.payload.trigger_id,
        view: modalView({
          initialTimeAuto: scheduleData.timeAuto,
          initialTimeAway: scheduleData.timeAway,
          disableSaturdaySchedule: scheduleData.disableSaturdaySchedule,
          showSaturdayTimePickers: scheduleData.differentSaturdaySchedule,
          initialSaturdayTimeAuto: scheduleData.saturdayTimeAuto,
          initialSaturdayTimeAway: scheduleData.saturdayTimeAway,
          disableSundaySchedule: scheduleData.disableSundaySchedule,
          showSundayTimePickers: scheduleData.differentSundaySchedule,
          initialSundayTimeAuto: scheduleData.sundayTimeAuto,
          initialSundayTimeAway: scheduleData.sundayTimeAway,
          exceptionDates: scheduleData.exceptionDates,
          pauseUpdates: scheduleData.pauseUpdates
        })
      })
    })
  );
  if (err) {
    logger.error(`Error opening modal: ${err.message}`);
  } else {
    if (res) {
      const resText = await res.text();
      logger.log(`Done opening modal: (${res.status} / ${res.statusText}) ${resText}`);
    } else {
      logger.warn(`Done opening modal: Response empty`);
    }
  }

  return emptyResponse();
};
