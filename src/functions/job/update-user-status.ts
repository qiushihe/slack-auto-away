import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { UpdateUserStatusJob } from "~src/constant/job.constant";
import { Weekday } from "~src/type/date.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { addMinutes } from "~src/util/time.util";
import {
  localDateGetter,
  localTimeInRangePredicate,
  localWeekdayGetter
} from "~src/util/timezone.util";
import { getUserData } from "~src/util/user-data.util";

type UpdateUserStatusEvent = {
  Job: UpdateUserStatusJob;
};

type SetPresenceResponse = {
  ok: boolean;
  error?: string;
};

const userPresenceSetter =
  (apiUrlPrefix: string, authToken: string) =>
  async (presence: "auto" | "away"): Promise<[Error, null] | [null, SetPresenceResponse]> => {
    const [reqErr, res] = await promisedFn(() =>
      fetch(`${apiUrlPrefix}/users.setPresence`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ presence })
      })
    );
    if (reqErr) {
      return [reqErr, null];
    }

    const [jsonErr, resJson] = await promisedFn(() => res.json() as Promise<SetPresenceResponse>);
    if (jsonErr) {
      return [jsonErr, null];
    }

    return [null, resJson];
  };

const logger = new NamespacedLogger("job/update-user-status");

export const handler: Handler<UpdateUserStatusEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const slackApiUrlPrefix = processEnvGetString("SLACK_API_URL_PREFIX");

  const s3 = new S3Client();

  logger.log(`Getting user data for user ID: ${evt.Job.userId} ...`);
  const [userDataErr, userData] = await getUserData(logger, s3, dataBucketName, evt.Job.userId);
  if (userDataErr) {
    logger.error(`Error getting user data for user ID: ${evt.Job.userId}`);
    return emptyResponse();
  }

  if (!userData) {
    logger.warn(`Missing user data for user ID: ${evt.Job.userId}`);
    return emptyResponse();
  }

  if (!userData.authToken) {
    logger.warn(`Missing user auth token for user ID: ${evt.Job.userId}`);
    return emptyResponse();
  }

  if (!userData.timezoneName) {
    logger.warn(`Missing user timezone for user ID: ${evt.Job.userId}`);
    return emptyResponse();
  }

  if (!userData.schedule) {
    logger.warn(`Missing user schedule data for user ID: ${evt.Job.userId}`);
    return emptyResponse();
  }

  if (userData.schedule.pauseUpdates) {
    logger.info(`Update paused. Not updating away status for user ID: ${evt.Job.userId}`);
    return emptyResponse();
  }

  const getLocalDate = localDateGetter();
  const userDate = getLocalDate(userData.timezoneName);
  if (userData.schedule.exceptionDates.includes(userDate)) {
    logger.info(
      `User local date excluded. Not updating away status for user ID: ${evt.Job.userId}`
    );
    return emptyResponse();
  }

  const getLocalWeekday = localWeekdayGetter();
  const userWeekday = getLocalWeekday(userData.timezoneName);
  if (userWeekday === Weekday.Saturday && userData.schedule.disableSaturdaySchedule) {
    logger.info(
      `User local Saturday disabled. Not updating away status for user ID: ${evt.Job.userId}`
    );
    return emptyResponse();
  } else if (userWeekday === Weekday.Sunday && userData.schedule.disableSundaySchedule) {
    logger.info(
      `User local Sunday disabled. Not updating away status for user ID: ${evt.Job.userId}`
    );
    return emptyResponse();
  }

  let timeAuto = userData.schedule.timeAuto;
  let timeAway = userData.schedule.timeAway;

  if (userWeekday === Weekday.Saturday && userData.schedule.differentSaturdaySchedule) {
    timeAuto = userData.schedule.saturdayTimeAuto;
    timeAway = userData.schedule.saturdayTimeAway;
  } else if (userWeekday === Weekday.Sunday && userData.schedule.differentSundaySchedule) {
    timeAuto = userData.schedule.sundayTimeAuto;
    timeAway = userData.schedule.sundayTimeAway;
  }

  logger.log(`Local timezone name: ${userData.timezoneName}`);
  logger.log(`Effective local time for setting status to auto ${timeAuto}`);
  logger.log(`Effective local time for setting status to away ${timeAway}`);

  const localTimeAutoStart = addMinutes(timeAuto, -10);
  const localTimeAutoEnd = addMinutes(timeAuto, 10);
  const localTimeAwayStart = addMinutes(timeAway, -10);
  const localTimeAwayEnd = addMinutes(timeAway, 10);

  logger.log("Checking local time ranges:", {
    autoStart: localTimeAutoStart,
    autoEnd: localTimeAutoEnd,
    awayStart: localTimeAwayStart,
    awayEnd: localTimeAwayEnd
  });

  const setUserPresence = userPresenceSetter(slackApiUrlPrefix, userData.authToken);
  const isLocalTimeInRange = localTimeInRangePredicate();

  if (isLocalTimeInRange(userData.timezoneName, localTimeAutoStart, localTimeAutoEnd)) {
    logger.log(`Updating away status to "auto" for user ID: ${evt.Job.userId} ...`);
    const [setPresenceErr, setPresenceRes] = await setUserPresence("auto");
    if (setPresenceErr) {
      logger.error(`Error setting user presence: ${setPresenceErr.message}`);
      return emptyResponse();
    }
    if (!setPresenceRes.ok) {
      logger.error(`Unable to set user presence: ${setPresenceRes?.error}`);
      return emptyResponse();
    }
    logger.log(`Done updating away status to "auto" for user ID: ${evt.Job.userId}`);
  } else if (isLocalTimeInRange(userData.timezoneName, localTimeAwayStart, localTimeAwayEnd)) {
    logger.log(`Updating away status to "away" for user ID: ${evt.Job.userId} ...`);
    const [setPresenceErr, setPresenceRes] = await setUserPresence("away");
    if (setPresenceErr) {
      logger.error(`Error setting user presence: ${setPresenceErr.message}`);
      return emptyResponse();
    }
    if (!setPresenceRes.ok) {
      logger.error(`Unable to set user presence: ${setPresenceRes?.error}`);
      return emptyResponse();
    }
    logger.log(`Done updating away status to "away" for user ID: ${evt.Job.userId}`);
  } else {
    logger.log(
      `Local time not in neither range. Not updating away status for user ID: ${evt.Job.userId}`
    );
  }

  return emptyResponse();
};
