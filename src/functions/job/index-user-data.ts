import { S3Client } from "@aws-sdk/client-s3";
import { Handler } from "aws-lambda";

import { IndexUserDataJob } from "~src/constant/job.constant";
import { BooleanIndexName } from "~src/constant/user-data.constant";
import { processEnvGetString } from "~src/util/env.util";
import { NamespacedLogger } from "~src/util/logger.util";
import { emptyResponse } from "~src/util/response.util";
import { getUserData } from "~src/util/user-data.util";
import { addUserIdToIndex, removeUserIdFromIndex } from "~src/util/user-index.util";

type IndexUserDataEvent = {
  Job: IndexUserDataJob;
};

const booleanIndicesUpdater =
  (logger: NamespacedLogger, s3: S3Client, bucketName: string, userId: string) =>
  async (
    updates: Partial<Record<BooleanIndexName, () => boolean>>
  ): Promise<Partial<Record<BooleanIndexName, Error | null>>> => {
    const updateEntries = Object.entries(updates) as [BooleanIndexName, () => boolean][];

    const updateResults = await Promise.all(
      updateEntries.map(async ([indexName, predicateFn]) => {
        const updateIndexArgs = [logger, s3, bucketName, indexName, userId] as const;

        if (predicateFn()) {
          logger.log(`Adding user ID ${userId} to index ${indexName} ...`);
          const err = await addUserIdToIndex(...updateIndexArgs);
          if (err) {
            logger.log(`Error adding user ID ${userId} to index ${indexName}: ${err.message}`);
            return [indexName, err] as const;
          } else {
            logger.log(`Done adding user ID ${userId} to index ${indexName}`);
            return null;
          }
        } else {
          logger.log(`Removing user ID ${userId} to index ${indexName} ...`);
          const err = await removeUserIdFromIndex(...updateIndexArgs);
          if (err) {
            logger.log(`Error removing user ID ${userId} to index ${indexName}: ${err.message}`);
            return [indexName, err] as const;
          } else {
            logger.log(`Done removing user ID ${userId} to index ${indexName}`);
            return null;
          }
        }
      })
    );

    return updateResults.reduce(
      (acc, result) => (result ? { ...acc, [result[0]]: result[1] } : acc),
      {} as Partial<Record<BooleanIndexName, Error | null>>
    );
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

  const updateBooleanIndices = booleanIndicesUpdater(
    logger,
    new S3Client(),
    dataBucketName,
    evt.Job.userId
  );

  if (userData) {
    const { authToken, timezoneName, schedule } = userData;

    logger.log("User data found. Setting indices values ...");
    await updateBooleanIndices({
      [BooleanIndexName.HAS_AUTH]: () => !!authToken && authToken.trim().length > 0,
      [BooleanIndexName.HAS_TIMEZONE]: () => !!timezoneName && timezoneName.trim().length > 0,
      [BooleanIndexName.HAS_SCHEDULE]: () => !!schedule && !schedule.pauseUpdates
    });
  } else {
    logger.error("User data not found. Clearing indices values ...");
    await updateBooleanIndices({
      [BooleanIndexName.HAS_AUTH]: () => false,
      [BooleanIndexName.HAS_TIMEZONE]: () => false,
      [BooleanIndexName.HAS_SCHEDULE]: () => false
    });
  }
  logger.log("Done updating indices values");

  return emptyResponse();
};
