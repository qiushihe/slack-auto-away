import { S3Client } from "@aws-sdk/client-s3";
import { SQSClient } from "@aws-sdk/client-sqs";
import { Handler } from "aws-lambda";

import { JobName } from "~src/constant/job.constant";
import { BooleanIndexName } from "~src/constant/user-data.constant";
import { processEnvGetString } from "~src/util/env.util";
import { invokeJobCommand } from "~src/util/job.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { paginatedPromises, promisedFn } from "~src/util/promise.util";
import { emptyResponse } from "~src/util/response.util";
import { getIndexedUserIds } from "~src/util/user-index.util";

const logger = new NamespacedLogger("schedule/apply");

export const handler: Handler<never> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");
  const jobsQueueUrl = processEnvGetString("JOBS_QUEUE_URL");

  const s3 = new S3Client();
  const sqs = new SQSClient();

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

  logger.log(`Enqueuing ${JobName.UPDATE_USER_STATUS} jobs ...`);
  const [queueUpdateJobsErr] = await paginatedPromises(
    potentialUserIds.map((potentialUserId) => async () => {
      const [queueUpdateJobErr] = await promisedFn(
        (userId: string) =>
          sqs.send(invokeJobCommand(jobsQueueUrl, JobName.UPDATE_USER_STATUS, { userId })),
        potentialUserId
      );
      if (queueUpdateJobErr) {
        throw queueUpdateJobErr;
      }
    }),
    { pageSize: 10 }
  );
  if (queueUpdateJobsErr) {
    logger.error(
      `Error enqueuing ${JobName.UPDATE_USER_STATUS} jobs: ${queueUpdateJobsErr.message}`
    );
    return emptyResponse();
  }
  logger.log(`Done enqueuing ${JobName.UPDATE_USER_STATUS} jobs`);

  return emptyResponse();
};
