import { beforeEach, describe, expect, it } from "@jest/globals";

import {
  CreateBucketCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException
} from "@aws-sdk/client-s3";

import { INDEX_PREFIX, IndexName } from "../constant/index.constant";
import { NamespacedLogger, UnitTestNamespacedLogger } from "./logger.util";
import { addUserIdToIndex, getIndexedUserIds, removeUserIdFromIndex } from "./user-index.util";
import { uuidV4 } from "./uuid.util";

describe("util / user-index", () => {
  let logger: NamespacedLogger;
  let s3: S3Client;
  let bucketName: string;

  beforeEach(() => {
    logger = new UnitTestNamespacedLogger("unit test");

    s3 = new S3Client({
      endpoint: "https://s3.localhost.localstack.cloud:4566",
      region: "us-east-1",
      credentials: { accessKeyId: "aCcEsS", secretAccessKey: "sEcEeT" }
    });

    bucketName = `test-bucket-${uuidV4()}`;
  });

  describe("getIndexedUserIds", () => {
    it("should return error when bucket does not exist", async () => {
      const [err] = await getIndexedUserIds(logger, s3, bucketName, IndexName.HAS_AUTH);

      expect(err).toBeInstanceOf(S3ServiceException);
      expect(err as S3ServiceException).toHaveProperty("name", "NoSuchBucket");
    });

    describe("when bucket exists", () => {
      beforeEach(async () => {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      });

      it("should return empty array when no user IDs were indexed", async () => {
        const [err, userIds] = await getIndexedUserIds(logger, s3, bucketName, IndexName.HAS_AUTH);

        expect(err).toBeNull();
        expect(userIds).toHaveLength(0);
      });

      describe("when user IDs were indexed", () => {
        let userIdIndexer: (indexName: IndexName) => (userId: string) => Promise<void>;

        beforeEach(() => {
          userIdIndexer = (indexName: IndexName) => async (userId: string) => {
            await s3.send(
              new PutObjectCommand({
                Bucket: bucketName,
                Key: `${INDEX_PREFIX}${indexName}/${userId}`,
                Body: `${indexName}:${userId}`
              })
            );
          };
        });

        it("should return indexed user IDs", async () => {
          const indexUserId = userIdIndexer(IndexName.HAS_AUTH);
          await indexUserId("user-1");
          await indexUserId("user-2");
          await indexUserId("user-3");

          const [err, userIds] = await getIndexedUserIds(
            logger,
            s3,
            bucketName,
            IndexName.HAS_AUTH
          );

          expect(err).toBeNull();
          expect(userIds).toHaveLength(3);
          expect(userIds).toContain("user-1");
          expect(userIds).toContain("user-2");
          expect(userIds).toContain("user-3");
        });

        it("should return all indexed user IDs via pagination", async () => {
          const indexUserId = userIdIndexer(IndexName.HAS_AUTH);
          await indexUserId("user-1");
          await indexUserId("user-2");
          await indexUserId("user-3");
          await indexUserId("user-4");
          await indexUserId("user-5");
          await indexUserId("user-6");
          await indexUserId("user-7");

          const [err, userIds] = await getIndexedUserIds(
            logger,
            s3,
            bucketName,
            IndexName.HAS_AUTH,
            { maxKeys: 3 }
          );

          expect(err).toBeNull();
          expect(userIds).toHaveLength(7);
          expect(userIds).toContain("user-1");
          expect(userIds).toContain("user-2");
          expect(userIds).toContain("user-3");
          expect(userIds).toContain("user-4");
          expect(userIds).toContain("user-5");
          expect(userIds).toContain("user-6");
          expect(userIds).toContain("user-7");
        });
      });
    });
  });

  describe("addUserIdToIndex", () => {
    let userId: string;

    beforeEach(() => {
      userId = `user-id-${uuidV4()}`;
    });

    it("should return error when bucket does not exist", async () => {
      const err = await addUserIdToIndex(logger, s3, bucketName, IndexName.HAS_SCHEDULE, userId);

      expect(err).toBeInstanceOf(S3ServiceException);
      expect(err as S3ServiceException).toHaveProperty("name", "NoSuchBucket");
    });

    describe("when bucket exists", () => {
      beforeEach(async () => {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      });

      it("should add user ID to index", async () => {
        await expect(
          s3.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: `${INDEX_PREFIX}${IndexName.HAS_SCHEDULE}/${userId}`
            })
          )
        ).rejects.toThrow("The specified key does not exist.");

        const err = await addUserIdToIndex(logger, s3, bucketName, IndexName.HAS_SCHEDULE, userId);
        expect(err).toBeNull();

        await expect(
          s3.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: `${INDEX_PREFIX}${IndexName.HAS_SCHEDULE}/${userId}`
            })
          )
        ).resolves.not.toThrow();
      });

      it("should not return error when user ID is already indexed", async () => {
        await expect(
          s3.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: `${INDEX_PREFIX}${IndexName.HAS_SCHEDULE}/${userId}`,
              Body: `${IndexName.HAS_SCHEDULE}:${userId}`
            })
          )
        ).resolves.not.toThrow();

        const err = await addUserIdToIndex(logger, s3, bucketName, IndexName.HAS_SCHEDULE, userId);
        expect(err).toBeNull();
      });
    });
  });

  describe("removeUserIdFromIndex", () => {
    let userId: string;

    beforeEach(() => {
      userId = `user-id-${uuidV4()}`;
    });

    it("should return error when bucket does not exist", async () => {
      const err = await removeUserIdFromIndex(
        logger,
        s3,
        bucketName,
        IndexName.HAS_TIMEZONE,
        userId
      );

      expect(err).toBeInstanceOf(S3ServiceException);
      expect(err as S3ServiceException).toHaveProperty("name", "NoSuchBucket");
    });

    describe("when bucket exists", () => {
      beforeEach(async () => {
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
      });

      it("should remove user ID from index", async () => {
        await expect(
          s3.send(
            new PutObjectCommand({
              Bucket: bucketName,
              Key: `${INDEX_PREFIX}${IndexName.HAS_TIMEZONE}/${userId}`,
              Body: `${IndexName.HAS_TIMEZONE}:${userId}`
            })
          )
        ).resolves.not.toThrow();

        const err = await removeUserIdFromIndex(
          logger,
          s3,
          bucketName,
          IndexName.HAS_TIMEZONE,
          userId
        );
        expect(err).toBeNull();

        await expect(
          s3.send(
            new GetObjectCommand({
              Bucket: bucketName,
              Key: `${INDEX_PREFIX}${IndexName.HAS_TIMEZONE}/${userId}`
            })
          )
        ).rejects.toThrow("The specified key does not exist.");
      });

      it("should not return error when user ID is not already indexed", async () => {
        const err = await removeUserIdFromIndex(
          logger,
          s3,
          bucketName,
          IndexName.HAS_TIMEZONE,
          userId
        );
        expect(err).toBeNull();
      });
    });
  });
});
