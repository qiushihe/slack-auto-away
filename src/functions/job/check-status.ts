import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";
import { format as formatDate, isPast as isPastDate, parse as parseDate } from "date-fns";
import getTimezoneOffset from "date-fns-tz/getTimezoneOffset";

import { CheckStatusJob } from "~src/constant/job.constant";
import { BooleanIndexName } from "~src/constant/user-data.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { verboseRange as range } from "~src/util/time.util";
import { getUserData } from "~src/util/user-data.util";
import { isUserIdIndexed } from "~src/util/user-index.util";

type CheckStatusEvent = {
  Job: CheckStatusJob;
};

const logger = new NamespacedLogger("job/check-status");

export const handler: Handler<CheckStatusEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  const s3 = new S3Client();

  const authStatus: string[] = [];
  const timezoneStatus: string[] = [];
  const scheduleStatus: string[] = [];

  logger.log(`Checking user auth index ...`);
  const [hasAuthErr, hasAuth] = await isUserIdIndexed(
    logger,
    s3,
    dataBucketName,
    BooleanIndexName.HAS_AUTH,
    evt.Job.userId
  );
  if (hasAuthErr) {
    logger.error(`Error checking user index ${BooleanIndexName.HAS_AUTH}: ${hasAuthErr.message}`);
    authStatus.push("Error");
  } else {
    logger.log(`Done checking user auth index`);
    authStatus.push(`${hasAuth ? "Authenticated" : "Not authenticated"}`);

    if (hasAuth) {
      logger.log(`Getting user data ...`);
      const [userDataErr, userData] = await getUserData(logger, s3, dataBucketName, evt.Job.userId);
      if (userDataErr) {
        logger.error(`Error getting user data: ${userDataErr.message}`);
        timezoneStatus.push("Error");
        scheduleStatus.push("Error");
      } else {
        logger.log(`Done getting user data`);

        if (!!userData?.timezoneName && userData.timezoneName.trim().length > 0) {
          const offset = getTimezoneOffset(userData.timezoneName, new Date()) / 1000 / 60 / 60;
          const prefix = offset < 0 ? "-" : "";
          const hours = `${Math.abs(Math.trunc(offset))}`.padStart(2, "0");
          const minutes = `${
            Math.abs(offset - Math.abs(Math.trunc(offset)) * (offset < 0 ? -1 : 1)) * 60
          }`.padStart(2, "0");

          timezoneStatus.push(`${userData.timezoneName} (${prefix}${hours}${minutes})`);
        } else {
          timezoneStatus.push("Missing");
        }

        if (userData?.schedule) {
          const {
            timeAuto,
            timeAway,
            disableSaturdaySchedule,
            differentSaturdaySchedule,
            saturdayTimeAuto,
            saturdayTimeAway,
            disableSundaySchedule,
            differentSundaySchedule,
            sundayTimeAuto,
            sundayTimeAway,
            exceptionDates,
            pauseUpdates
          } = userData.schedule;

          if (pauseUpdates) {
            scheduleStatus.push(`Update paused`);
          } else {
            scheduleStatus.push(`Daily from ${range(timeAway, timeAuto)}`);

            if (disableSaturdaySchedule) {
              if (disableSundaySchedule) {
                scheduleStatus.push("No update on Saturday and Sunday");
              } else if (differentSundaySchedule) {
                scheduleStatus.push("No update on Saturday");
                scheduleStatus.push(`Sunday from ${range(sundayTimeAway, sundayTimeAuto)}`);
              } else {
                scheduleStatus.push("No update on Saturday");
              }
            } else if (differentSaturdaySchedule) {
              if (disableSundaySchedule) {
                scheduleStatus.push("No update on Sunday");
                scheduleStatus.push(`Saturday from ${range(saturdayTimeAway, saturdayTimeAuto)}`);
              } else if (differentSundaySchedule) {
                scheduleStatus.push(`Saturday from ${range(saturdayTimeAway, saturdayTimeAuto)}`);
                scheduleStatus.push(`Sunday from ${range(sundayTimeAway, sundayTimeAuto)}`);
              } else {
                scheduleStatus.push(`Saturday from ${range(saturdayTimeAway, saturdayTimeAuto)}`);
              }
            } else {
              if (disableSundaySchedule) {
                scheduleStatus.push("No update on Sunday");
              } else if (differentSundaySchedule) {
                scheduleStatus.push(`Sunday from ${range(sundayTimeAway, sundayTimeAuto)}`);
              } else {
                // Both Saturday and Sunday use default schedule
              }
            }

            exceptionDates.forEach((exceptionDateStr) => {
              const exceptionDate = parseDate(exceptionDateStr, "yyyy-MM-dd", new Date());

              if (!isPastDate(exceptionDate)) {
                scheduleStatus.push(`No update on ${formatDate(exceptionDate, "MMMM do, yyyy")}`);
              }
            });
          }
        } else {
          scheduleStatus.push("Not set");
        }
      }
    }
  }

  logger.log(`Sending response ...`);
  const [err] = await promisedFn(() =>
    fetch(evt.Job.responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        blocks: [
          {
            type: "rich_text",
            elements: [
              {
                type: "rich_text_section",
                elements: [
                  { type: "text", text: "Authentication: ", style: { bold: true } },
                  { type: "text", text: authStatus.join("; ") }
                ]
              },
              {
                type: "rich_text_section",
                elements: [
                  { type: "text", text: "Timezone: ", style: { bold: true } },
                  { type: "text", text: timezoneStatus.join("; ") }
                ]
              },
              {
                type: "rich_text_section",
                elements: [
                  { type: "text", text: "Schedule: ", style: { bold: true } },
                  ...(scheduleStatus.length <= 1
                    ? [{ type: "text", text: scheduleStatus.join("; ") }]
                    : [])
                ]
              },
              ...(scheduleStatus.length > 1
                ? [
                    {
                      type: "rich_text_list",
                      style: "bullet",
                      elements: scheduleStatus.map((message) => ({
                        type: "rich_text_section",
                        elements: [{ type: "text", text: message }]
                      }))
                    }
                  ]
                : [])
            ]
          }
        ]
      })
    })
  );
  if (err) {
    logger.error(`Error sending response: ${err.message}`);
  } else {
    logger.log(`Done sending response`);
  }

  return emptyResponse();
};
