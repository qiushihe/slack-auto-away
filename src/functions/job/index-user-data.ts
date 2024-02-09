import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { IndexUserDataJob } from "~src/constant/job.constant";
import { IndexName } from "~src/constant/user-data.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { emptyResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";
import { addUserIdToIndex, removeUserIdFromIndex } from "~src/util/user-index.util";

type IndexUserDataEvent = {
  Job: IndexUserDataJob;
};

const booleanIndexUpdater =
  (logger: NamespacedLogger, s3: S3Client, bucketName: string, userId: string) =>
  async (indexName: IndexName, predicateFn: () => boolean) => {
    const updateIndexArgs = [logger, s3, bucketName, indexName, userId] as const;

    if (predicateFn()) {
      logger.log(`Adding user ID ${userId} to index ${indexName} ...`);
      const err = await addUserIdToIndex(...updateIndexArgs);
      if (err) {
        logger.log(`Error adding user ID ${userId} to index ${indexName}: ${err.message}`);
      } else {
        logger.log(`Done adding user ID ${userId} to index ${indexName}`);
      }
      return err;
    } else {
      logger.log(`Removing user ID ${userId} to index ${indexName} ...`);
      const err = await removeUserIdFromIndex(...updateIndexArgs);
      if (err) {
        logger.log(`Error removing user ID ${userId} to index ${indexName}: ${err.message}`);
      } else {
        logger.log(`Done removing user ID ${userId} to index ${indexName}`);
      }
      return err;
    }
  };

const logger = new NamespacedLogger("job/index-user-data");

export const handler: Handler<IndexUserDataEvent> = async (evt) => {
  logger.log("Event: ", evt);

  const dataBucketName = processEnvGetString("DATA_BUCKET_NAME");

  logger.log(`Getting user data ...`);
  const [userDataErr, userData] = await getUserData(
    logger,
    new S3Client(),
    dataBucketName,
    evt.Job.userId
  );
  if (userDataErr) {
    logger.error(`Error getting user data: ${userDataErr.message}`);
  } else {
    logger.log(`Done getting user data`);
  }

  const updateIndex = booleanIndexUpdater(logger, new S3Client(), dataBucketName, evt.Job.userId);

  if (!userData) {
    logger.error("User data not found");
    await Promise.all([
      updateIndex(IndexName.HAS_AUTH, () => false),
      updateIndex(IndexName.HAS_TIMEZONE, () => false),
      updateIndex(IndexName.HAS_SCHEDULE, () => false)
    ]);
  } else {
    await Promise.all([
      updateIndex(
        IndexName.HAS_AUTH,
        () => !!userData.authToken && userData.authToken.trim().length > 0
      ),
      updateIndex(
        IndexName.HAS_TIMEZONE,
        () => !!userData.timezoneName && userData.timezoneName.trim().length > 0
      ),
      updateIndex(
        IndexName.HAS_SCHEDULE,
        () => !!userData.schedule && !userData.schedule.pauseUpdates
      )
    ]);
  }

  return emptyResponse();
};
