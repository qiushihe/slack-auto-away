import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { BooleanIndexName } from "~src/constant/user-data.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { paginatedPromises } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";
import { getIndexedUserIds } from "~src/util/user-index.util";

const logger = new NamespacedLogger("schedule/apply");

export const handler: Handler<never> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  const s3 = new S3Client();

  logger.log(`Getting indexed ${BooleanIndexName.HAS_AUTH} user IDs ...`);
  const [hasAuthUserIdsErr, hasAuthUserIds] = await getIndexedUserIds(
    logger,
    s3,
    dataBucketName,
    BooleanIndexName.HAS_AUTH
  );
  if (hasAuthUserIdsErr) {
    logger.error(
      `Error getting indexed ${BooleanIndexName.HAS_AUTH} user IDs: ${hasAuthUserIdsErr.message}`
    );
    return emptyResponse();
  }
  logger.log(`Indexed ${BooleanIndexName.HAS_AUTH} user IDs count: ${hasAuthUserIds.length}`);

  logger.log(`Getting indexed ${BooleanIndexName.HAS_TIMEZONE} user IDs ...`);
  const [hasTimezoneUserIdsErr, hasTimezoneUserIds] = await getIndexedUserIds(
    logger,
    s3,
    dataBucketName,
    BooleanIndexName.HAS_TIMEZONE
  );
  if (hasTimezoneUserIdsErr) {
    logger.error(
      `Error getting indexed ${BooleanIndexName.HAS_TIMEZONE} user IDs: ${hasTimezoneUserIdsErr.message}`
    );
    return emptyResponse();
  }
  logger.log(
    `Indexed ${BooleanIndexName.HAS_TIMEZONE} user IDs count: ${hasTimezoneUserIds.length}`
  );

  logger.log(`Getting indexed ${BooleanIndexName.HAS_SCHEDULE} user IDs ...`);
  const [hasScheduleUserIdsErr, hasScheduleUserIds] = await getIndexedUserIds(
    logger,
    s3,
    dataBucketName,
    BooleanIndexName.HAS_SCHEDULE
  );
  if (hasScheduleUserIdsErr) {
    logger.error(
      `Error getting indexed ${BooleanIndexName.HAS_SCHEDULE} user IDs: ${hasScheduleUserIdsErr.message}`
    );
    return emptyResponse();
  }
  logger.log(
    `Indexed ${BooleanIndexName.HAS_SCHEDULE} user IDs count: ${hasScheduleUserIds.length}`
  );

  logger.log("Indexing user IDs counts ...");
  const countByUserId = [...hasAuthUserIds, ...hasTimezoneUserIds, ...hasScheduleUserIds].reduce(
    (acc, userId) => ({ ...acc, [userId]: (acc[userId] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  const potentialUserIds = Object.entries(countByUserId)
    .filter(
      // Only consider user IDs that are present in all 3 indices.
      ([, count]) => count === 3
    )
    .map(([userId]) => userId);
  logger.log("Potential User IDs:", potentialUserIds);

  logger.log("Getting all potential users data ...");
  const [usersDataErr, usersData] = await paginatedPromises(
    potentialUserIds.map((userId) => async () => {
      const [userDataErr, userData] = await getUserData(logger, s3, dataBucketName, userId);
      if (userDataErr) {
        throw userDataErr;
      }
      return [userId, userData] as const;
    }),
    { pageSize: 10 }
  );
  if (usersDataErr) {
    logger.error(`Error getting potential users data: ${usersDataErr.message}`);
    return emptyResponse();
  }

  for (const [userId, userData] of usersData) {
    if (userData) {
      console.log(
        "POTENTIAL USER DATA",
        userData.userId,
        userData.timezoneName,
        JSON.stringify(userData.schedule)
      );
    } else {
      logger.warn(`No user data found for potential user ID: ${userId}`);
    }
  }

  logger.log("Done applying scheduled updates");
  return emptyResponse();
};
