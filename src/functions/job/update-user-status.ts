import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { UpdateUserStatusJob } from "~src/constant/job.constant";
import { Weekday } from "~src/type/date.type";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
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

const logger = new NamespacedLogger("job/update-user-status");

export const handler: Handler<UpdateUserStatusEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

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

  console.log("AUTO", timeAuto, addMinutes(timeAuto, -10), addMinutes(timeAuto, 10));
  console.log("AWAY", timeAway, addMinutes(timeAway, -10), addMinutes(timeAway, 10));

  const isLocalTimeInRange = localTimeInRangePredicate();
  if (
    isLocalTimeInRange(userData.timezoneName, addMinutes(timeAuto, -10), addMinutes(timeAuto, 10))
  ) {
    logger.log(`Updating away status to "auto" for user ID: ${evt.Job.userId} ...`);
    console.log("!!! Set status to AUTO");
    logger.log(`Done updating away status to "auto" for user ID: ${evt.Job.userId}`);
  } else if (
    isLocalTimeInRange(userData.timezoneName, addMinutes(timeAway, -10), addMinutes(timeAway, 10))
  ) {
    logger.log(`Updating away status to "away" for user ID: ${evt.Job.userId} ...`);
    console.log("!!! Set status to AWAY");
    logger.log(`Done updating away status to "away" for user ID: ${evt.Job.userId}`);
  } else {
    logger.log(
      `Local time not in neither range. Not updating away status for user ID: ${evt.Job.userId}`
    );
  }

  return emptyResponse();
};
